/**
 * Main ephemeris calculation module
 * Re-exports all functionality and provides the main calculation interface
 * Uses ephemeris-moshier for Swiss-Ephemeris-grade planetary positions
 * Uses astronomia for precise sidereal time and nutation
 */

// Re-export types
export * from "./types";

// Re-export house utilities
export { calculateHouses, findHouse } from "./houses";

// Re-export aspect calculations
export { calculateAspects } from "./aspects";

// Re-export astronomia helpers for tests
export { 
  calculateJulianDay, 
  calculateLST, 
  calculateTrueObliquity as calculateObliquity 
} from "./astronomia-helpers";

// Local imports for the main calculation functions
import {
  calculatePlanetaryPositions,
  formatDMS,
  getSignFromLongitude,
  getSignDegree,
  normalize360,
  calculateNorthNode,
  calculateLilith,
} from "./moshier";

import { calculateJulianDay } from "./astronomia-helpers";
import { calculateHouses, findHouse } from "./houses";

import {
  ChartCalculation,
  HouseSystemType,
  BirthDataInput,
  PlanetaryPosition,
} from "./types";

// Re-export specific utilities that are commonly needed
export { formatDMS } from "./moshier";
export { ZODIAC_SIGNS } from "./types";

/**
 * Calculate a complete natal chart
 * Uses ephemeris-moshier for accurate planetary positions
 * and astronomia for precise house calculations
 */
export function calculateChart(
  input: BirthDataInput,
  houseSystem: HouseSystemType = "placidus"
): ChartCalculation {
  const {
    year,
    month,
    day,
    hour,
    minute,
    second = 0,
    latitude,
    longitude,
    timezone = 0,
  } = input;

  // Adjust for timezone to get UTC
  let utcHour = hour - timezone;
  let utcDay = day;
  let utcMonth = month;
  let utcYear = year;
  
  // Handle day rollover
  if (utcHour < 0) {
    utcHour += 24;
    utcDay -= 1;
    if (utcDay < 1) {
      utcMonth -= 1;
      if (utcMonth < 1) {
        utcMonth = 12;
        utcYear -= 1;
      }
      // Get days in previous month
      utcDay = new Date(utcYear, utcMonth, 0).getDate();
    }
  } else if (utcHour >= 24) {
    utcHour -= 24;
    utcDay += 1;
    const daysInMonth = new Date(utcYear, utcMonth, 0).getDate();
    if (utcDay > daysInMonth) {
      utcDay = 1;
      utcMonth += 1;
      if (utcMonth > 12) {
        utcMonth = 1;
        utcYear += 1;
      }
    }
  }

  // Calculate Julian Day for UTC
  const jd = calculateJulianDay(utcYear, utcMonth, utcDay, utcHour, minute, second);
  
  // Calculate T (centuries from J2000)
  const T = (jd - 2451545.0) / 36525.0;

  // Get planetary positions using Moshier's ephemeris
  const planets = calculatePlanetaryPositions(
    utcYear,
    utcMonth,
    utcDay,
    utcHour,
    minute,
    second,
    latitude,
    longitude
  );

  // Add North Node
  const northNodeLong = calculateNorthNode(jd);
  planets.push({
    name: "northNode",
    longitude: northNodeLong,
    isRetrograde: true, // North Node is always retrograde
    sign: getSignFromLongitude(northNodeLong),
    signDegree: getSignDegree(northNodeLong),
    dms: formatDMS(getSignDegree(northNodeLong)),
  });

  // South Node is opposite North Node
  const southNodeLong = normalize360(northNodeLong + 180);
  planets.push({
    name: "southNode",
    longitude: southNodeLong,
    isRetrograde: true,
    sign: getSignFromLongitude(southNodeLong),
    signDegree: getSignDegree(southNodeLong),
    dms: formatDMS(getSignDegree(southNodeLong)),
  });

  // Mean Black Moon Lilith
  const lilithLong = calculateLilith(jd);
  planets.push({
    name: "lilith",
    longitude: lilithLong,
    isRetrograde: false,
    sign: getSignFromLongitude(lilithLong),
    signDegree: getSignDegree(lilithLong),
    dms: formatDMS(getSignDegree(lilithLong)),
  });

  // Calculate houses using astronomia's precise algorithms
  const { cusps, angles } = calculateHouses(jd, latitude, longitude, houseSystem);

  return {
    julianDay: jd,
    localSiderealTime: 0, // Calculated internally
    obliquity: 0, // Calculated internally
    angles: {
      ascendant: angles.ascendant,
      midheaven: angles.midheaven,
      descendant: angles.descendant,
      imumCoeli: angles.imumCoeli,
    },
    houseCusps: cusps,
    planets,
    houseSystem,
  };
}

/**
 * Find which house a planet is in
 */
export function getPlanetHouse(
  planetLongitude: number,
  houseCusps: number[]
): number {
  return findHouse(planetLongitude, houseCusps);
}

/**
 * Calculate aspects for a chart
 */
export function getChartAspects(
  planets: PlanetaryPosition[],
  options?: {
    includeMajor?: boolean;
    includeMinor?: boolean;
  }
) {
  const { calculateAspects } = require("./aspects");
  return calculateAspects(planets, options);
}
