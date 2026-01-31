/**
 * Planetary position calculations using astronomia's VSOP87 theory
 * Provides high-precision planetary positions using full VSOP87 series
 */

import { PlanetaryPosition, PlanetName, ZODIAC_SIGNS, ZodiacSign, DMS } from "./types";

// Import astronomia modules using proper exports
// @ts-ignore - astronomia types
import * as astronomia from "astronomia";
// @ts-ignore - astronomia data (default export)
import astronomiaDataDefault from "astronomia/data";

// Get the modules we need
const { planetposition, moonposition } = astronomia;

// Access the VSOP87 data from the default export
const vsopData = astronomiaDataDefault;

// Create planet objects for VSOP87 calculations
const earth = new planetposition.Planet(vsopData.earth);
const mercury = new planetposition.Planet(vsopData.mercury);
const venus = new planetposition.Planet(vsopData.venus);
const mars = new planetposition.Planet(vsopData.mars);
const jupiter = new planetposition.Planet(vsopData.jupiter);
const saturn = new planetposition.Planet(vsopData.saturn);
const uranus = new planetposition.Planet(vsopData.uranus);
const neptune = new planetposition.Planet(vsopData.neptune);

/**
 * Format decimal degrees to DMS within a sign (0-30)
 */
export function formatDMS(decimalDegrees: number): DMS {
  const normalized = ((decimalDegrees % 30) + 30) % 30;
  const degrees = Math.floor(normalized);
  const minFloat = (normalized - degrees) * 60;
  const minutes = Math.floor(minFloat);
  const seconds = Math.round((minFloat - minutes) * 60);

  // Handle rollover
  let finalSeconds = seconds;
  let finalMinutes = minutes;
  let finalDegrees = degrees;

  if (finalSeconds >= 60) {
    finalSeconds = 0;
    finalMinutes++;
  }
  if (finalMinutes >= 60) {
    finalMinutes = 0;
    finalDegrees++;
  }

  return {
    degrees: finalDegrees,
    minutes: finalMinutes,
    seconds: finalSeconds,
    formatted: `${finalDegrees}° ${finalMinutes.toString().padStart(2, "0")}' ${finalSeconds.toString().padStart(2, "0")}"`,
  };
}

/**
 * Get zodiac sign from ecliptic longitude
 */
export function getSignFromLongitude(longitude: number): ZodiacSign {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[signIndex] as ZodiacSign;
}

/**
 * Get degree within sign (0-30)
 */
export function getSignDegree(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return normalized % 30;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalize360(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate heliocentric to geocentric longitude conversion
 * Returns geocentric ecliptic longitude in degrees
 */
function helioToGeo(
  planetPos: { lon: number; lat: number; range: number },
  earthPos: { lon: number; lat: number; range: number }
): number {
  // Get cartesian coordinates for planet (heliocentric)
  const pLon = planetPos.lon;
  const pLat = planetPos.lat;
  const pR = planetPos.range;

  const px = pR * Math.cos(pLat) * Math.cos(pLon);
  const py = pR * Math.cos(pLat) * Math.sin(pLon);
  const pz = pR * Math.sin(pLat);

  // Get cartesian coordinates for Earth (heliocentric)
  const eLon = earthPos.lon;
  const eLat = earthPos.lat;
  const eR = earthPos.range;

  const ex = eR * Math.cos(eLat) * Math.cos(eLon);
  const ey = eR * Math.cos(eLat) * Math.sin(eLon);
  const ez = eR * Math.sin(eLat);

  // Get geocentric coordinates (planet relative to Earth)
  const gx = px - ex;
  const gy = py - ey;
  const gz = pz - ez;

  // Convert back to ecliptic longitude
  const geoLon = Math.atan2(gy, gx);

  return normalize360(toDegrees(geoLon));
}

/**
 * Calculate planetary positions using astronomia's VSOP87 theory
 * This is the main function for accurate planetary positions
 *
 * @param jd - Julian Day
 */
export function calculatePlanetaryPositionsFromJD(jd: number): PlanetaryPosition[] {
  const planets: PlanetaryPosition[] = [];

  // Get Earth's position for geocentric calculations
  const earthPos = earth.position(jd);

  // === SUN ===
  // Sun's geocentric position is opposite Earth's heliocentric position
  const sunLon = normalize360(toDegrees(earthPos.lon) + 180);
  planets.push({
    name: "sun",
    longitude: sunLon,
    isRetrograde: false,
    sign: getSignFromLongitude(sunLon),
    signDegree: getSignDegree(sunLon),
    dms: formatDMS(getSignDegree(sunLon)),
  });

  // === MOON ===
  const moonPos = moonposition.position(jd);
  const moonLon = normalize360(toDegrees(moonPos.lon));
  planets.push({
    name: "moon",
    longitude: moonLon,
    isRetrograde: false,
    sign: getSignFromLongitude(moonLon),
    signDegree: getSignDegree(moonLon),
    dms: formatDMS(getSignDegree(moonLon)),
  });

  // === PLANETS ===
  const planetData: { name: PlanetName; planet: typeof mercury }[] = [
    { name: "mercury", planet: mercury },
    { name: "venus", planet: venus },
    { name: "mars", planet: mars },
    { name: "jupiter", planet: jupiter },
    { name: "saturn", planet: saturn },
    { name: "uranus", planet: uranus },
    { name: "neptune", planet: neptune },
  ];

  // Calculate positions for previous day for retrograde detection
  const prevJd = jd - 1;
  const prevEarthPos = earth.position(prevJd);

  for (const { name, planet } of planetData) {
    const pos = planet.position(jd);
    const geoLon = helioToGeo(pos, earthPos);

    // Check retrograde by comparing with previous day
    const prevPos = planet.position(prevJd);
    const prevGeoLon = helioToGeo(prevPos, prevEarthPos);

    let diff = geoLon - prevGeoLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const isRetrograde = diff < 0;

    planets.push({
      name,
      longitude: geoLon,
      isRetrograde,
      sign: getSignFromLongitude(geoLon),
      signDegree: getSignDegree(geoLon),
      dms: formatDMS(getSignDegree(geoLon)),
    });
  }

  // === PLUTO ===
  // Use simplified formula for Pluto (not in VSOP87)
  const plutoLon = calculatePlutoLongitude(jd);
  const prevPlutoLon = calculatePlutoLongitude(prevJd);
  let plutoDiff = plutoLon - prevPlutoLon;
  if (plutoDiff > 180) plutoDiff -= 360;
  if (plutoDiff < -180) plutoDiff += 360;

  planets.push({
    name: "pluto",
    longitude: plutoLon,
    isRetrograde: plutoDiff < 0,
    sign: getSignFromLongitude(plutoLon),
    signDegree: getSignDegree(plutoLon),
    dms: formatDMS(getSignDegree(plutoLon)),
  });

  // === CHIRON ===
  const chironLon = calculateChironLongitude(jd);
  const prevChironLon = calculateChironLongitude(prevJd);
  let chironDiff = chironLon - prevChironLon;
  if (chironDiff > 180) chironDiff -= 360;
  if (chironDiff < -180) chironDiff += 360;

  planets.push({
    name: "chiron",
    longitude: chironLon,
    isRetrograde: chironDiff < 0,
    sign: getSignFromLongitude(chironLon),
    signDegree: getSignDegree(chironLon),
    dms: formatDMS(getSignDegree(chironLon)),
  });

  return planets;
}

/**
 * Legacy function signature for compatibility
 */
export function calculatePlanetaryPositions(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  _latitude: number,
  _longitude: number
): PlanetaryPosition[] {
  // Calculate Julian Day
  const jd = dateToJD(year, month, day, hour, minute, second);
  return calculatePlanetaryPositionsFromJD(jd);
}

/**
 * Convert date components to Julian Day
 */
function dateToJD(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): number {
  // Adjust for January/February
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  const dayFraction = (hour + minute / 60 + second / 3600) / 24;

  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    dayFraction +
    B -
    1524.5;

  return jd;
}

/**
 * Calculate Pluto's geocentric longitude (simplified model)
 * Based on Meeus approximation
 */
function calculatePlutoLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;

  // Mean longitude
  const L = 238.9286 + 144.96 * T;

  // Mean anomaly
  const M = 238.9286 + 144.96 * T - 224.075;
  const Mrad = (M * Math.PI) / 180;

  // Equation of center (simplified)
  const e = 0.2488;
  const C =
    (2 * e - 0.25 * e * e * e) * Math.sin(Mrad) +
    1.25 * e * e * Math.sin(2 * Mrad) +
    (13 / 12) * e * e * e * Math.sin(3 * Mrad);

  // True longitude
  const trueLon = L + (C * 180) / Math.PI;

  return normalize360(trueLon);
}

/**
 * Calculate Chiron's geocentric longitude (simplified model)
 */
function calculateChironLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;

  // Chiron orbital period ~50.7 years
  // Mean longitude at J2000: ~7° Capricorn (277°)
  const n = 360 / 50.7; // degrees per year
  const L = 277 + n * T * 100;

  // Eccentricity correction
  const e = 0.3786;
  const M = L - 209; // Longitude of perihelion
  const Mrad = (M * Math.PI) / 180;

  const C =
    2 * e * Math.sin(Mrad) * (180 / Math.PI) +
    1.25 * e * e * Math.sin(2 * Mrad) * (180 / Math.PI);

  return normalize360(L + C);
}

/**
 * Calculate True North Node longitude
 * Based on the mean longitude of the Moon's ascending node with corrections
 */
export function calculateNorthNode(jd: number): number {
  // Use astronomia's trueNode function
  const trueNodeRad = moonposition.trueNode(jd);
  return normalize360(toDegrees(trueNodeRad));
}

/**
 * Calculate Mean Black Moon Lilith (lunar apogee)
 */
export function calculateLilith(jd: number): number {
  // Use astronomia's perigee function and add 180° for apogee
  const perigeeRad = moonposition.perigee(jd);
  return normalize360(toDegrees(perigeeRad) + 180);
}
