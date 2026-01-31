/**
 * Helper functions using the astronomia library for precise astronomical calculations
 * Uses Meeus algorithms for sidereal time, nutation, and obliquity
 */

// Import from astronomia using its proper export paths
import nutation from "astronomia/nutation";
import julian from "astronomia/julian";
import sidereal from "astronomia/sidereal";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Calculate Julian Day from calendar date (UTC)
 * Uses astronomia's julian module for precision
 */
export function calculateJulianDay(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): number {
  // Create Calendar object and convert to Julian Day
  const dayFraction = day + (hour + minute / 60 + second / 3600) / 24;
  const cal = new julian.Calendar(year, month, dayFraction);
  return cal.toJD();
}

/**
 * Calculate centuries from J2000.0
 */
export function centuriesFromJ2000(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/**
 * Calculate Greenwich Mean Sidereal Time in DEGREES
 * Using astronomia's sidereal module with IAU 1982 coefficients
 */
export function calculateGMSTDegrees(jd: number): number {
  // astronomia.sidereal.mean returns GMST in seconds of time
  const gmstSeconds = sidereal.mean(jd);
  
  // Convert seconds to degrees: 86400 seconds = 360 degrees
  const gmstDeg = (gmstSeconds / 86400) * 360;
  
  return gmstDeg;
}

/**
 * Calculate Greenwich Mean Sidereal Time in HOURS
 */
export function calculateGMSTHours(jd: number): number {
  return calculateGMSTDegrees(jd) / 15;
}

/**
 * Calculate Greenwich Apparent Sidereal Time in DEGREES
 * GAST = GMST + equation of equinoxes (nutation in RA)
 * Using astronomia's sidereal.apparent function
 */
export function calculateGASTDegrees(jd: number): number {
  // astronomia.sidereal.apparent returns GAST in seconds of time
  const gastSeconds = sidereal.apparent(jd);
  
  // Convert seconds to degrees: 86400 seconds = 360 degrees
  const gastDeg = (gastSeconds / 86400) * 360;
  
  return gastDeg;
}

/**
 * Calculate Greenwich Apparent Sidereal Time in HOURS
 */
export function calculateGASTHours(jd: number): number {
  return calculateGASTDegrees(jd) / 15;
}

/**
 * Calculate Local Sidereal Time in DEGREES
 * @param jd - Julian Day (UT)
 * @param longitude - Observer longitude in degrees (positive East, negative West)
 * @returns LST in degrees (0-360)
 */
export function calculateLST(jd: number, longitude: number): number {
  const gast = calculateGASTDegrees(jd);
  
  // LST = GAST + longitude (longitude is positive east, negative west)
  let lst = gast + longitude;
  
  // Normalize to 0-360
  while (lst < 0) lst += 360;
  while (lst >= 360) lst -= 360;
  
  return lst;
}

/**
 * Calculate Mean Obliquity of the Ecliptic
 * Uses astronomia's nutation module (IAU 1980)
 * @returns obliquity in degrees
 */
export function calculateMeanObliquity(jd: number): number {
  const obliquityRad = nutation.meanObliquity(jd);
  return obliquityRad * RAD_TO_DEG;
}

/**
 * Calculate True Obliquity (mean + nutation in obliquity)
 * @returns obliquity in degrees
 */
export function calculateTrueObliquity(jd: number): number {
  const meanObl = nutation.meanObliquity(jd);
  const [, deltaEpsilon] = nutation.nutation(jd); // [Δψ, Δε] in radians
  return (meanObl + deltaEpsilon) * RAD_TO_DEG;
}

/**
 * Calculate Nutation values
 * @returns [nutationInLongitude, nutationInObliquity] in degrees
 */
export function calculateNutation(jd: number): [number, number] {
  const [deltaPsi, deltaEpsilon] = nutation.nutation(jd);
  return [deltaPsi * RAD_TO_DEG, deltaEpsilon * RAD_TO_DEG];
}

/**
 * Convert RAMC (Right Ascension of Midheaven) to Midheaven longitude
 * MC is where the ecliptic crosses the meridian
 * 
 * Formula: tan(MC) = sin(ARMC) / (cos(ARMC) * cos(ε))
 * 
 * Quadrant rule (per RadixPro):
 * - If ST is between 0 and 12 hours, MC should be between 0° and 180°
 * - If ST is between 12 and 24 hours, MC should be between 180° and 360°
 * 
 * @param ramc - RAMC in degrees (= LST in degrees)
 * @param obliquity - True obliquity in degrees
 * @returns MC longitude in degrees (0-360)
 */
export function ramcToMC(ramc: number, obliquity: number): number {
  const ramcRad = ramc * DEG_TO_RAD;
  const oblRad = obliquity * DEG_TO_RAD;
  
  // Formula: tan(L) = sin(ARMC) / (cos(ARMC) * cos(ε))
  const sinRAMC = Math.sin(ramcRad);
  const cosRAMC = Math.cos(ramcRad);
  const cosObl = Math.cos(oblRad);
  
  const tanMC = sinRAMC / (cosRAMC * cosObl);
  let mc = Math.atan(tanMC) * RAD_TO_DEG;
  
  // Normalize to 0-360
  while (mc < 0) mc += 360;
  while (mc >= 360) mc -= 360;
  
  // Quadrant correction based on sidereal time hours
  // ST 0-12h (RAMC 0-180°) → MC should be 0-180°
  // ST 12-24h (RAMC 180-360°) → MC should be 180-360°
  const ramcHours = ramc / 15;
  
  if (ramcHours >= 0 && ramcHours < 12) {
    // MC should be 0-180°
    if (mc >= 180) mc -= 180;
  } else {
    // MC should be 180-360°
    if (mc < 180) mc += 180;
  }
  
  return mc;
}

/**
 * Calculate Ascendant from LST and geographic latitude
 * Uses the standard formula: tan(ASC) = cos(RAMC) / -(sin(ε)tan(φ) + cos(ε)sin(RAMC))
 * 
 * @param lst - Local Sidereal Time in degrees (= RAMC)
 * @param latitude - Geographic latitude in degrees
 * @param obliquity - True obliquity in degrees
 * @param mc - Midheaven longitude for quadrant correction
 * @returns Ascendant longitude in degrees (0-360)
 */
export function calculateAscendant(lst: number, latitude: number, obliquity: number, mc?: number): number {
  const ramcRad = lst * DEG_TO_RAD;
  const latRad = latitude * DEG_TO_RAD;
  const oblRad = obliquity * DEG_TO_RAD;
  
  const sinObl = Math.sin(oblRad);
  const cosObl = Math.cos(oblRad);
  const tanLat = Math.tan(latRad);
  const sinRAMC = Math.sin(ramcRad);
  const cosRAMC = Math.cos(ramcRad);
  
  // Standard Ascendant formula (from radixpro.com, Meeus):
  // tan(asc) = cos(RAMC) / -(sin(ε) * tan(φ) + cos(ε) * sin(RAMC))
  const numerator = cosRAMC;
  const denominator = -(sinObl * tanLat + cosObl * sinRAMC);
  
  // Calculate ascendant using atan2
  let asc = Math.atan2(numerator, denominator) * RAD_TO_DEG;
  
  // Normalize to 0-360
  while (asc < 0) asc += 360;
  while (asc >= 360) asc -= 360;
  
  // Quadrant correction: The Ascendant must be in the 180° following the MC.
  // ASC should be roughly 90° ahead of MC (varies by latitude)
  if (mc !== undefined) {
    let diff = asc - mc;
    while (diff < 0) diff += 360;
    
    // ASC should be in range 0-180 degrees after MC
    // If diff is > 180, we're in the wrong half
    if (diff > 180) {
      asc = (asc + 180) % 360;
    }
  }
  
  return asc;
}
