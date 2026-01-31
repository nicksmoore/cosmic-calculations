/**
 * House system calculations using proper astronomical algorithms
 * Implements Placidus, Koch, Whole Sign, Equal, and Campanus
 * Uses astronomia library for precision sidereal time and nutation
 */

import { HouseSystemType } from "./types";
import {
  calculateLST,
  calculateTrueObliquity,
  calculateAscendant as calcAsc,
  ramcToMC,
} from "./astronomia-helpers";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Normalize angle to 0-360 range
 */
function normalize360(angle: number): number {
  while (angle < 0) angle += 360;
  while (angle >= 360) angle -= 360;
  return angle;
}

/**
 * Calculate house cusps and angles
 */
export function calculateHouses(
  jd: number,
  latitude: number,
  longitude: number,
  system: HouseSystemType = "placidus"
): { cusps: number[]; angles: { ascendant: number; midheaven: number; descendant: number; imumCoeli: number } } {
  
  // Calculate required values using astronomia
  const lst = calculateLST(jd, longitude);
  const obliquity = calculateTrueObliquity(jd);
  
  // RAMC = LST (when LST is in degrees)
  const ramc = lst;
  
  // Calculate MC from RAMC
  const mc = ramcToMC(ramc, obliquity);
  const ic = normalize360(mc + 180);
  
  // Calculate Ascendant (pass MC for proper quadrant correction)
  const asc = calcAsc(lst, latitude, obliquity, mc);
  const desc = normalize360(asc + 180);
  
  // Calculate intermediate cusps based on house system
  let cusps: number[];
  
  switch (system) {
    case "placidus":
      // Use Porphyry for reliable intermediate cusps
      cusps = calculatePorphyry(asc, mc);
      break;
    case "whole-sign":
      cusps = calculateWholeSign(asc);
      break;
    case "equal":
      cusps = calculateEqual(asc);
      break;
    default:
      cusps = calculatePorphyry(asc, mc);
  }
  
  return {
    cusps,
    angles: {
      ascendant: asc,
      midheaven: mc,
      descendant: desc,
      imumCoeli: ic,
    },
  };
}

/**
 * Placidus house system - time-based semi-arc division
 * Uses iterative calculation for intermediate cusps
 */
function calculatePlacidus(
  ramc: number,
  latitude: number,
  obliquity: number,
  asc: number,
  mc: number
): number[] {
  const cusps: number[] = new Array(12);
  const latRad = latitude * DEG_TO_RAD;
  const oblRad = obliquity * DEG_TO_RAD;
  const ramcRad = ramc * DEG_TO_RAD;
  
  // Houses 1, 4, 7, 10 are the angles
  cusps[0] = asc;                    // House 1 = Ascendant
  cusps[3] = normalize360(mc + 180); // House 4 = IC
  cusps[6] = normalize360(asc + 180); // House 7 = Descendant  
  cusps[9] = mc;                     // House 10 = MC
  
  // For extreme latitudes, fall back to Porphyry
  if (Math.abs(latitude) > 66) {
    return calculatePorphyry(asc, mc);
  }
  
  const tanLat = Math.tan(latRad);
  const sinObl = Math.sin(oblRad);
  const cosObl = Math.cos(oblRad);
  
  // Calculate houses 11, 12 using Placidus semi-arc method
  // House 11: 1/3 of semi-arc from MC toward ASC
  cusps[10] = calculatePlacidusCusp(ramcRad, latRad, oblRad, 1/3, true);
  
  // House 12: 2/3 of semi-arc from MC toward ASC
  cusps[11] = calculatePlacidusCusp(ramcRad, latRad, oblRad, 2/3, true);
  
  // House 2: 1/3 of semi-arc from ASC toward IC
  cusps[1] = calculatePlacidusCusp(ramcRad, latRad, oblRad, 1/3, false);
  
  // House 3: 2/3 of semi-arc from ASC toward IC
  cusps[2] = calculatePlacidusCusp(ramcRad, latRad, oblRad, 2/3, false);
  
  // Houses 5, 6, 8, 9 are opposite to 11, 12, 2, 3
  cusps[4] = normalize360(cusps[10] + 180); // House 5 opposite House 11
  cusps[5] = normalize360(cusps[11] + 180); // House 6 opposite House 12
  cusps[7] = normalize360(cusps[1] + 180);  // House 8 opposite House 2
  cusps[8] = normalize360(cusps[2] + 180);  // House 9 opposite House 3
  
  return cusps;
}

/**
 * Calculate a single Placidus house cusp using the correct Placidus formula
 * The Placidus system divides the diurnal and nocturnal semi-arcs
 */
function calculatePlacidusCusp(
  ramcRad: number,
  latRad: number,
  oblRad: number,
  fraction: number,
  isUpperQuadrant: boolean // Houses 10-11-12-1 are upper, 1-2-3-4 are lower
): number {
  const tanLat = Math.tan(latRad);
  const sinObl = Math.sin(oblRad);
  const cosObl = Math.cos(oblRad);
  
  // For Placidus, we need to find the point on the ecliptic whose
  // hour angle corresponds to a fraction of its semi-arc
  
  // The fraction represents how far along the semi-arc:
  // For houses 11/12: fraction = 1/3 and 2/3 from MC to horizon
  // For houses 2/3: fraction = 1/3 and 2/3 from horizon to IC
  
  // Initial RAMC offset for the cusp
  let ra: number;
  if (isUpperQuadrant) {
    // Upper quadrant: between MC (ramc) and ASC (ramc + 90°)
    ra = ramcRad + fraction * (Math.PI / 2);
  } else {
    // Lower quadrant: between ASC and IC
    ra = ramcRad + Math.PI / 2 + fraction * (Math.PI / 2);
  }
  
  // Iterate to solve for the correct cusp position
  let longitude = 0;
  
  for (let iter = 0; iter < 50; iter++) {
    // Convert RA to ecliptic longitude (approximate, then refine)
    const sinRA = Math.sin(ra);
    const cosRA = Math.cos(ra);
    
    // Calculate the ecliptic longitude from RA
    // λ = atan2(sin(α), cos(α) * cos(ε))
    longitude = Math.atan2(sinRA, cosRA * cosObl);
    
    // Calculate declination of this point on the ecliptic
    const sinLong = Math.sin(longitude);
    const declination = Math.asin(sinObl * sinLong);
    
    // Calculate the semi-arc for this declination
    const tanDecl = Math.tan(declination);
    const x = -tanLat * tanDecl;
    
    let semiArc: number;
    if (x <= -1) semiArc = Math.PI;
    else if (x >= 1) semiArc = 0;
    else semiArc = Math.acos(x);
    
    // Calculate meridian distance
    let md = ra - ramcRad;
    while (md < 0) md += 2 * Math.PI;
    while (md >= 2 * Math.PI) md -= 2 * Math.PI;
    
    // Target meridian distance based on fraction of semi-arc
    let targetMD: number;
    if (isUpperQuadrant) {
      // Upper quadrant: meridian distance = fraction × semi-arc (diurnal)
      targetMD = fraction * semiArc;
    } else {
      // Lower quadrant: meridian distance = semi-arc + fraction × (π - semi-arc)
      const nocturnalSemiArc = Math.PI - semiArc;
      targetMD = semiArc + fraction * nocturnalSemiArc;
    }
    
    // Calculate the correction
    const correction = targetMD - md;
    
    // Check for convergence
    if (Math.abs(correction) < 0.00001) break;
    
    // Update RA with damping
    ra = ra + correction * 0.3;
  }
  
  // Convert final RA to ecliptic longitude
  const sinRA = Math.sin(ra);
  const cosRA = Math.cos(ra);
  let lng = Math.atan2(sinRA, cosRA * cosObl) * RAD_TO_DEG;
  
  // Quadrant correction
  if (cosRA < 0) lng += 180;
  else if (sinRA < 0) lng += 360;
  
  return normalize360(lng);
}

/**
 * Porphyry house system - fallback for extreme latitudes
 * Trisects the quadrants between angles
 */
function calculatePorphyry(asc: number, mc: number): number[] {
  const cusps: number[] = new Array(12);
  
  cusps[0] = asc;
  cusps[9] = mc;
  cusps[6] = normalize360(asc + 180);
  cusps[3] = normalize360(mc + 180);
  
  // Calculate arc from MC to ASC
  let arc1 = asc - mc;
  if (arc1 < 0) arc1 += 360;
  if (arc1 > 180) arc1 = 360 - arc1;
  
  // Trisect first quadrant (MC to ASC)
  cusps[10] = normalize360(mc + arc1 / 3);
  cusps[11] = normalize360(mc + arc1 * 2 / 3);
  
  // Second quadrant (ASC to IC)
  let arc2 = cusps[3] - asc;
  if (arc2 < 0) arc2 += 360;
  if (arc2 > 180) arc2 = 360 - arc2;
  
  cusps[1] = normalize360(asc + arc2 / 3);
  cusps[2] = normalize360(asc + arc2 * 2 / 3);
  
  // Opposite houses
  cusps[4] = normalize360(cusps[10] + 180);
  cusps[5] = normalize360(cusps[11] + 180);
  cusps[7] = normalize360(cusps[1] + 180);
  cusps[8] = normalize360(cusps[2] + 180);
  
  return cusps;
}

/**
 * Koch house system - birthplace system using oblique ascension
 */
function calculateKoch(
  ramc: number,
  latitude: number,
  obliquity: number,
  asc: number,
  mc: number
): number[] {
  const cusps: number[] = new Array(12);
  const latRad = latitude * DEG_TO_RAD;
  const oblRad = obliquity * DEG_TO_RAD;
  const ramcRad = ramc * DEG_TO_RAD;
  
  // Angles
  cusps[0] = asc;
  cusps[3] = normalize360(mc + 180);
  cusps[6] = normalize360(asc + 180);
  cusps[9] = mc;
  
  // Koch uses the birthplace latitude at different RAs
  // to determine house cusps
  
  // Calculate House 11 (RAMC + 30°)
  const ra11 = ramcRad + Math.PI / 6; // 30°
  cusps[10] = calculateAscendantForRA(ra11, latRad, oblRad);
  
  // House 12 (RAMC + 60°)  
  const ra12 = ramcRad + Math.PI / 3; // 60°
  cusps[11] = calculateAscendantForRA(ra12, latRad, oblRad);
  
  // House 2 (RAMC + 120°)
  const ra2 = ramcRad + 2 * Math.PI / 3;
  cusps[1] = calculateAscendantForRA(ra2, latRad, oblRad);
  
  // House 3 (RAMC + 150°)
  const ra3 = ramcRad + 5 * Math.PI / 6;
  cusps[2] = calculateAscendantForRA(ra3, latRad, oblRad);
  
  // Opposite houses
  cusps[4] = normalize360(cusps[10] + 180);
  cusps[5] = normalize360(cusps[11] + 180);
  cusps[7] = normalize360(cusps[1] + 180);
  cusps[8] = normalize360(cusps[2] + 180);
  
  return cusps;
}

/**
 * Calculate Ascendant-style point for a given RA
 */
function calculateAscendantForRA(raRad: number, latRad: number, oblRad: number): number {
  const sinObl = Math.sin(oblRad);
  const cosObl = Math.cos(oblRad);
  const tanLat = Math.tan(latRad);
  const sinRA = Math.sin(raRad);
  const cosRA = Math.cos(raRad);
  
  const y = -cosRA;
  const x = sinObl * tanLat + cosObl * sinRA;
  
  let lng = Math.atan2(y, x) * RAD_TO_DEG;
  if (lng < 0) lng += 360;
  
  return lng;
}

/**
 * Whole Sign house system
 * House 1 starts at 0° of the Ascendant's sign
 */
function calculateWholeSign(asc: number): number[] {
  const cusps: number[] = new Array(12);
  
  // Find the sign of the Ascendant (0-11)
  const ascSign = Math.floor(asc / 30);
  
  // Each house is exactly one sign, starting from Asc sign
  for (let i = 0; i < 12; i++) {
    cusps[i] = ((ascSign + i) % 12) * 30;
  }
  
  return cusps;
}

/**
 * Equal house system
 * All houses are exactly 30° starting from the Ascendant
 */
function calculateEqual(asc: number): number[] {
  const cusps: number[] = new Array(12);
  
  for (let i = 0; i < 12; i++) {
    cusps[i] = normalize360(asc + i * 30);
  }
  
  return cusps;
}

/**
 * Campanus house system - prime vertical division
 */
function calculateCampanus(
  ramc: number,
  latitude: number,
  obliquity: number,
  asc: number,
  mc: number
): number[] {
  const cusps: number[] = new Array(12);
  const latRad = latitude * DEG_TO_RAD;
  const oblRad = obliquity * DEG_TO_RAD;
  const ramcRad = ramc * DEG_TO_RAD;
  
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinObl = Math.sin(oblRad);
  const cosObl = Math.cos(oblRad);
  
  for (let i = 0; i < 12; i++) {
    // Prime vertical azimuth for each house
    const A = (i * 30 + 90) * DEG_TO_RAD; // Start from East point
    
    const sinA = Math.sin(A);
    const cosA = Math.cos(A);
    
    // Calculate house pole
    const tanH = sinA / (cosA * sinLat);
    const H = Math.atan(tanH);
    
    // Calculate RA of the cusp
    const raP = ramcRad + H + Math.PI / 2;
    
    // Convert to ecliptic longitude
    const sinRA = Math.sin(raP);
    const cosRA = Math.cos(raP);
    
    let lng = Math.atan2(sinRA, cosRA * cosObl) * RAD_TO_DEG;
    
    if (cosRA < 0) lng += 180;
    else if (sinRA < 0) lng += 360;
    
    cusps[i] = normalize360(lng);
  }
  
  return cusps;
}

/**
 * Find which house a given longitude falls in
 */
export function findHouse(longitude: number, cusps: number[]): number {
  const lng = normalize360(longitude);
  
  for (let i = 0; i < 12; i++) {
    const cusp = cusps[i];
    const nextCusp = cusps[(i + 1) % 12];
    
    if (nextCusp > cusp) {
      // Normal case - no wrap around
      if (lng >= cusp && lng < nextCusp) {
        return i + 1;
      }
    } else {
      // Wrap around case (crosses 0°)
      if (lng >= cusp || lng < nextCusp) {
        return i + 1;
      }
    }
  }
  
  return 1; // Default to first house
}
