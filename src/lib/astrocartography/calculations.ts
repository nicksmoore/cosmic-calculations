/**
 * Astrocartography Calculations
 * Converts natal chart data into map projection lines
 */

import { ACGLine, ACGData, PlanetEquatorial, PLANET_COLORS } from "./types";
import { NatalChartData } from "@/data/natalChartData";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Calculate Greenwich Sidereal Time from birth data
 */
export function calculateGST(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: number
): number {
  // Convert to UTC
  const utcHour = hour - timezone + minute / 60;
  
  // Calculate Julian Day
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + utcHour / 24 + B - 1524.5;
  
  // Calculate GST using IAU formula
  const T = (JD - 2451545.0) / 36525.0;
  const gst = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
  
  return ((gst % 360) + 360) % 360;
}

/**
 * Convert ecliptic coordinates to equatorial (RA/Dec)
 * @param longitude Ecliptic longitude in degrees
 * @param latitude Ecliptic latitude in degrees (usually ~0 for planets)
 * @param obliquity Earth's axial tilt (~23.44°)
 */
export function eclipticToEquatorial(
  longitude: number,
  latitude: number = 0,
  obliquity: number = 23.44
): { ra: number; dec: number } {
  const L = longitude * DEG_TO_RAD;
  const B = latitude * DEG_TO_RAD;
  const eps = obliquity * DEG_TO_RAD;
  
  // Right Ascension
  const sinRA = Math.sin(L) * Math.cos(eps) - Math.tan(B) * Math.sin(eps);
  const cosRA = Math.cos(L);
  let ra = Math.atan2(sinRA, cosRA) * RAD_TO_DEG;
  ra = ((ra % 360) + 360) % 360;
  
  // Declination
  const sinDec = Math.sin(B) * Math.cos(eps) + Math.cos(B) * Math.sin(eps) * Math.sin(L);
  const dec = Math.asin(sinDec) * RAD_TO_DEG;
  
  return { ra, dec };
}

/**
 * Calculate MC longitude for a planet
 * MC = where planet is at zenith (culminating)
 */
export function calculateMCLongitude(ra: number, gst: number): number {
  const mcLong = ra - gst;
  return ((mcLong % 360) + 360) % 360 - 180; // Convert to -180 to 180
}

/**
 * Calculate rising/setting latitude for a given longitude
 * Solves the horizon equation for where planet rises/sets
 */
export function calculateHorizonLatitude(
  longitude: number,
  ra: number,
  dec: number,
  gst: number,
  isRising: boolean
): number | null {
  // Local Hour Angle
  const lha = gst + longitude - ra;
  const lhaRad = lha * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  
  // For rising/setting, altitude = 0
  // sin(alt) = sin(dec)*sin(lat) + cos(dec)*cos(lat)*cos(lha) = 0
  // tan(lat) = -cos(lha) / tan(dec)
  
  if (Math.abs(dec) < 0.01) {
    // Planet near equator - rises/sets at all latitudes
    return isRising ? 0 : null;
  }
  
  const cosLHA = Math.cos(lhaRad);
  const tanDec = Math.tan(decRad);
  
  // Check if solution exists
  if (tanDec === 0) return null;
  
  const tanLat = -cosLHA / tanDec;
  
  // Clamp to valid range
  if (Math.abs(tanLat) > 1000) return null;
  
  let lat = Math.atan(tanLat) * RAD_TO_DEG;
  
  // Adjust for rising vs setting hemisphere
  if (isRising) {
    // Rising in eastern sky
    if (Math.sin(lhaRad) > 0) lat = -lat;
  } else {
    // Setting in western sky
    if (Math.sin(lhaRad) < 0) lat = -lat;
  }
  
  // Clamp to valid latitudes
  if (lat < -85 || lat > 85) return null;
  
  return lat;
}

/**
 * Generate MC/IC vertical lines (constant longitude)
 */
function generateMCICLines(
  planet: PlanetEquatorial,
  gst: number
): ACGLine[] {
  const mcLong = calculateMCLongitude(planet.rightAscension, gst);
  const icLong = ((mcLong + 180) % 360) - 180;
  
  const lines: ACGLine[] = [];
  
  // MC line (vertical from -85 to 85 latitude)
  lines.push({
    planet: planet.name,
    planetSymbol: planet.symbol,
    lineType: "MC",
    coordinates: [
      [mcLong, -85],
      [mcLong, 85],
    ],
    color: PLANET_COLORS[planet.name] || "#FFFFFF",
  });
  
  // IC line (opposite side)
  lines.push({
    planet: planet.name,
    planetSymbol: planet.symbol,
    lineType: "IC",
    coordinates: [
      [icLong, -85],
      [icLong, 85],
    ],
    color: PLANET_COLORS[planet.name] || "#FFFFFF",
  });
  
  return lines;
}

/**
 * Generate ASC/DSC curved lines
 */
function generateASCDSCLines(
  planet: PlanetEquatorial,
  gst: number
): ACGLine[] {
  const lines: ACGLine[] = [];
  
  // Generate points along longitude range
  const ascPoints: [number, number][] = [];
  const dscPoints: [number, number][] = [];
  
  for (let lng = -180; lng <= 180; lng += 2) {
    const ascLat = calculateHorizonLatitude(
      lng,
      planet.rightAscension,
      planet.declination,
      gst,
      true
    );
    
    const dscLat = calculateHorizonLatitude(
      lng,
      planet.rightAscension,
      planet.declination,
      gst,
      false
    );
    
    if (ascLat !== null && Math.abs(ascLat) <= 85) {
      ascPoints.push([lng, ascLat]);
    }
    
    if (dscLat !== null && Math.abs(dscLat) <= 85) {
      dscPoints.push([lng, dscLat]);
    }
  }
  
  // Split into continuous segments (handle wrap-around)
  const splitIntoSegments = (points: [number, number][]): [number, number][][] => {
    if (points.length < 2) return [];
    
    const segments: [number, number][][] = [];
    let currentSegment: [number, number][] = [points[0]];
    
    for (let i = 1; i < points.length; i++) {
      const prevLat = points[i - 1][1];
      const currLat = points[i][1];
      
      // Check for discontinuity (large lat jump)
      if (Math.abs(currLat - prevLat) > 30) {
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        currentSegment = [points[i]];
      } else {
        currentSegment.push(points[i]);
      }
    }
    
    if (currentSegment.length >= 2) {
      segments.push(currentSegment);
    }
    
    return segments;
  };
  
  const ascSegments = splitIntoSegments(ascPoints);
  const dscSegments = splitIntoSegments(dscPoints);
  
  ascSegments.forEach((segment) => {
    lines.push({
      planet: planet.name,
      planetSymbol: planet.symbol,
      lineType: "ASC",
      coordinates: segment,
      color: PLANET_COLORS[planet.name] || "#FFFFFF",
    });
  });
  
  dscSegments.forEach((segment) => {
    lines.push({
      planet: planet.name,
      planetSymbol: planet.symbol,
      lineType: "DSC",
      coordinates: segment,
      color: PLANET_COLORS[planet.name] || "#FFFFFF",
    });
  });
  
  return lines;
}

/**
 * Main function: Calculate all ACG lines from natal chart data
 */
export function calculateAstrocartography(
  chartData: NatalChartData,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number,
  birthMinute: number,
  timezone: number
): ACGData {
  const gst = calculateGST(birthYear, birthMonth, birthDay, birthHour, birthMinute, timezone);
  
  // Convert natal planets to equatorial coordinates
  const planets: PlanetEquatorial[] = chartData.planets.map((p) => {
    const { ra, dec } = eclipticToEquatorial(p.longitude);
    return {
      name: p.name,
      symbol: p.symbol,
      rightAscension: ra,
      declination: dec,
      longitude: p.longitude,
    };
  });
  
  // Generate all lines
  const lines: ACGLine[] = [];
  
  planets.forEach((planet) => {
    // MC and IC lines
    lines.push(...generateMCICLines(planet, gst));
    
    // ASC and DSC lines
    lines.push(...generateASCDSCLines(planet, gst));
  });
  
  return { lines, planets, gst };
}

/**
 * Calculate relocated chart angles for a clicked location
 */
export function getRelocatedAngles(
  planets: PlanetEquatorial[],
  gst: number,
  clickLat: number,
  clickLng: number
): { planetName: string; mcDistance: number; ascDistance: number }[] {
  return planets.map((planet) => {
    const mcLong = calculateMCLongitude(planet.rightAscension, gst);
    const mcDistance = Math.abs(clickLng - mcLong);
    
    const ascLat = calculateHorizonLatitude(
      clickLng,
      planet.rightAscension,
      planet.declination,
      gst,
      true
    );
    
    const ascDistance = ascLat !== null ? Math.abs(clickLat - ascLat) : 999;
    
    return {
      planetName: planet.name,
      mcDistance: mcDistance > 180 ? 360 - mcDistance : mcDistance,
      ascDistance,
    };
  });
}
