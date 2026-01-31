/**
 * Sidereal time calculations
 * Based on IAU 1982 coefficients from Meeus Chapter 12
 */

import { J2000 } from "./julian";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Normalize angle to 0-360 degrees
 */
export function normalize360(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Normalize angle to 0-24 hours
 */
export function normalize24(hours: number): number {
  return ((hours % 24) + 24) % 24;
}

/**
 * Calculate Greenwich Mean Sidereal Time
 * Returns time in degrees (0-360)
 */
export function calculateGMST(jd: number): number {
  const T = (jd - J2000) / 36525.0;

  // IAU 1982 formula (Meeus eq. 12.4)
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - J2000) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;

  return normalize360(gmst);
}

/**
 * Calculate Local Sidereal Time
 * @param jd Julian Day
 * @param longitude Observer's longitude (positive East)
 * @returns LST in degrees (0-360)
 */
export function calculateLST(jd: number, longitude: number): number {
  const gmst = calculateGMST(jd);
  return normalize360(gmst + longitude);
}

/**
 * Calculate the obliquity of the ecliptic (Earth's axial tilt)
 * Using the Laskar formula for higher precision
 * @param jd Julian Day
 * @returns Obliquity in degrees
 */
export function calculateObliquity(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const U = T / 100;

  // Laskar formula (Meeus eq. 22.3)
  const eps0 =
    23 * 3600 +
    26 * 60 +
    21.448 -
    4680.93 * U -
    1.55 * U * U +
    1999.25 * U * U * U -
    51.38 * U * U * U * U -
    249.67 * Math.pow(U, 5) -
    39.05 * Math.pow(U, 6) +
    7.12 * Math.pow(U, 7) +
    27.87 * Math.pow(U, 8) +
    5.79 * Math.pow(U, 9) +
    2.45 * Math.pow(U, 10);

  return eps0 / 3600; // Convert arcseconds to degrees
}

/**
 * Calculate nutation in longitude and obliquity
 * @param jd Julian Day
 * @returns [nutationLongitude, nutationObliquity] in degrees
 */
export function calculateNutation(jd: number): [number, number] {
  const T = (jd - J2000) / 36525.0;

  // Mean elongation of Moon from Sun
  const D =
    (297.85036 + 445267.11148 * T - 0.0019142 * T * T + (T * T * T) / 189474) *
    DEG_TO_RAD;

  // Mean anomaly of Sun (Earth)
  const M =
    (357.52772 + 35999.0503 * T - 0.0001603 * T * T - (T * T * T) / 300000) *
    DEG_TO_RAD;

  // Mean anomaly of Moon
  const Mp =
    (134.96298 + 477198.867398 * T + 0.0086972 * T * T + (T * T * T) / 56250) *
    DEG_TO_RAD;

  // Moon's argument of latitude
  const F =
    (93.27191 + 483202.017538 * T - 0.0036825 * T * T + (T * T * T) / 327270) *
    DEG_TO_RAD;

  // Longitude of Moon's ascending node
  const omega =
    (125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000) *
    DEG_TO_RAD;

  // Simplified nutation (first few terms)
  const deltaPsi =
    (-17.2 * Math.sin(omega) -
      1.32 * Math.sin(2 * (F - D + omega)) -
      0.23 * Math.sin(2 * (F + omega)) +
      0.21 * Math.sin(2 * omega)) /
    3600;

  const deltaEps =
    (9.2 * Math.cos(omega) +
      0.57 * Math.cos(2 * (F - D + omega)) +
      0.1 * Math.cos(2 * (F + omega)) -
      0.09 * Math.cos(2 * omega)) /
    3600;

  return [deltaPsi, deltaEps];
}

/**
 * Calculate true obliquity (mean + nutation)
 */
export function calculateTrueObliquity(jd: number): number {
  const meanObliquity = calculateObliquity(jd);
  const [, deltaEps] = calculateNutation(jd);
  return meanObliquity + deltaEps;
}

/**
 * Convert degrees to radians
 */
export function toRadians(deg: number): number {
  return deg * DEG_TO_RAD;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(rad: number): number {
  return rad * RAD_TO_DEG;
}
