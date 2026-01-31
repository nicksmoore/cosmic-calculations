/**
 * Type definitions for the ephemeris calculation engine
 */

// Zodiac signs
export const ZODIAC_SIGNS = [
  { name: "Aries", symbol: "♈", element: "fire", modality: "cardinal" },
  { name: "Taurus", symbol: "♉", element: "earth", modality: "fixed" },
  { name: "Gemini", symbol: "♊", element: "air", modality: "mutable" },
  { name: "Cancer", symbol: "♋", element: "water", modality: "cardinal" },
  { name: "Leo", symbol: "♌", element: "fire", modality: "fixed" },
  { name: "Virgo", symbol: "♍", element: "earth", modality: "mutable" },
  { name: "Libra", symbol: "♎", element: "air", modality: "cardinal" },
  { name: "Scorpio", symbol: "♏", element: "water", modality: "fixed" },
  { name: "Sagittarius", symbol: "♐", element: "fire", modality: "mutable" },
  { name: "Capricorn", symbol: "♑", element: "earth", modality: "cardinal" },
  { name: "Aquarius", symbol: "♒", element: "air", modality: "fixed" },
  { name: "Pisces", symbol: "♓", element: "water", modality: "mutable" },
] as const;

export type ZodiacSignName = typeof ZODIAC_SIGNS[number]["name"];

export interface ZodiacSign {
  name: ZodiacSignName;
  symbol: string;
  element: string;
  modality: string;
}

// House systems supported
export type HouseSystemType = 
  | "placidus" 
  | "whole-sign" 
  | "equal";

// Planet/body identifiers
export type PlanetName = 
  | "sun" 
  | "moon" 
  | "mercury" 
  | "venus" 
  | "mars" 
  | "jupiter" 
  | "saturn" 
  | "uranus" 
  | "neptune" 
  | "pluto"
  | "chiron"
  | "northNode"
  | "southNode"
  | "lilith";

// Degree-Minute-Second representation
export interface DMS {
  degrees: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

// Planetary position with full precision
export interface PlanetaryPosition {
  name: PlanetName;
  longitude: number;           // 0-360 ecliptic longitude
  latitude?: number;           // ecliptic latitude (if available)
  speed?: number;              // daily motion
  isRetrograde: boolean;
  sign: ZodiacSign;
  signDegree: number;          // 0-30 degree within sign
  dms: DMS;                    // Degree/minute/second within sign
}

// House cusp data
export interface HouseCusp {
  number: number;              // 1-12
  longitude: number;           // cusp longitude 0-360
  sign: ZodiacSign;
  signDegree: number;
  dms: DMS;
}

// Angular points
export interface ChartAngles {
  ascendant: number;
  midheaven: number;
  descendant: number;
  imumCoeli: number;
  vertex?: number;
}

// Complete calculation result
export interface ChartCalculation {
  julianDay: number;
  localSiderealTime: number;
  obliquity: number;
  angles: ChartAngles;
  houseCusps: number[];        // 12 cusp longitudes
  planets: PlanetaryPosition[];
  houseSystem: HouseSystemType;
}

// Birth data input
export interface BirthDataInput {
  year: number;
  month: number;               // 1-12
  day: number;
  hour: number;                // 0-23
  minute: number;              // 0-59
  second?: number;             // 0-59
  latitude: number;            // -90 to 90
  longitude: number;           // -180 to 180
  timezone?: number;           // offset in hours
}

// Aspect definitions
export interface AspectType {
  name: string;
  symbol: string;
  angle: number;
  orb: number;
}

export const MAJOR_ASPECTS: AspectType[] = [
  { name: "Conjunction", symbol: "☌", angle: 0, orb: 8 },
  { name: "Opposition", symbol: "☍", angle: 180, orb: 8 },
  { name: "Trine", symbol: "△", angle: 120, orb: 8 },
  { name: "Square", symbol: "□", angle: 90, orb: 7 },
  { name: "Sextile", symbol: "⚹", angle: 60, orb: 6 },
];

export const MINOR_ASPECTS: AspectType[] = [
  { name: "Quincunx", symbol: "⚻", angle: 150, orb: 3 },
  { name: "Semi-sextile", symbol: "⚺", angle: 30, orb: 2 },
  { name: "Semi-square", symbol: "∠", angle: 45, orb: 2 },
  { name: "Sesquiquadrate", symbol: "⚼", angle: 135, orb: 2 },
  { name: "Quintile", symbol: "Q", angle: 72, orb: 2 },
  { name: "Bi-quintile", symbol: "bQ", angle: 144, orb: 2 },
];

// Calculated aspect between two points
export interface Aspect {
  point1: string;
  point2: string;
  type: AspectType;
  angle: number;
  orb: number;
  isApplying?: boolean;
}
