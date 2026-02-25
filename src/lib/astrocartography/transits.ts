/**
 * Transit Calculations for Today's Planetary Alignments
 * Calculates current planetary positions and aspects to natal chart
 */

import { calculateChart } from "@/lib/ephemeris";
import { PLANET_COLORS } from "./types";

// Planet symbols for display
export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  Chiron: "⚷",
};

// Zodiac signs with symbols
export const ZODIAC_SIGNS: Record<string, { symbol: string; name: string; element: string; modality: string; polarity: string }> = {
  Aries: { symbol: "♈", name: "Aries", element: "Fire", modality: "Cardinal", polarity: "Masculine" },
  Taurus: { symbol: "♉", name: "Taurus", element: "Earth", modality: "Fixed", polarity: "Feminine" },
  Gemini: { symbol: "♊", name: "Gemini", element: "Air", modality: "Mutable", polarity: "Masculine" },
  Cancer: { symbol: "♋", name: "Cancer", element: "Water", modality: "Cardinal", polarity: "Feminine" },
  Leo: { symbol: "♌", name: "Leo", element: "Fire", modality: "Fixed", polarity: "Masculine" },
  Virgo: { symbol: "♍", name: "Virgo", element: "Earth", modality: "Mutable", polarity: "Feminine" },
  Libra: { symbol: "♎", name: "Libra", element: "Air", modality: "Cardinal", polarity: "Masculine" },
  Scorpio: { symbol: "♏", name: "Scorpio", element: "Water", modality: "Fixed", polarity: "Feminine" },
  Sagittarius: { symbol: "♐", name: "Sagittarius", element: "Fire", modality: "Mutable", polarity: "Masculine" },
  Capricorn: { symbol: "♑", name: "Capricorn", element: "Earth", modality: "Cardinal", polarity: "Feminine" },
  Aquarius: { symbol: "♒", name: "Aquarius", element: "Air", modality: "Fixed", polarity: "Masculine" },
  Pisces: { symbol: "♓", name: "Pisces", element: "Water", modality: "Mutable", polarity: "Feminine" },
};

// Aspect types for transits
export type TransitAspectType = "conjunction" | "opposition" | "trine" | "square" | "sextile";

export interface TransitAspect {
  transitPlanet: string;
  transitSign: string;
  transitDegree: number;
  natalPlanet: string;
  natalSign: string;
  aspectType: TransitAspectType;
  orb: number;
  isExact: boolean;
  isBenefic: boolean;
  durationDays: number | null;
}

export interface TransitPlanet {
  name: string;
  symbol: string;
  sign: string;
  signSymbol: string;
  degree: number;
  color: string;
  isRetrograde: boolean;
  activatesACG: boolean; // If transiting planet aspects natal angles
  aspects: TransitAspect[];
}

export interface TransitsData {
  planets: TransitPlanet[];
  date: Date;
  activePlanetaryEnergies: string[]; // Planets with active aspects
}

// Simple planet position for natal chart comparison
interface SimplePosition {
  name: string;
  longitude: number;
  sign: string;
  signDegree: number;
  isRetrograde: boolean;
}

// Aspect orbs for transits
const ASPECT_ORBS: Record<TransitAspectType, number> = {
  conjunction: 8,
  opposition: 8,
  trine: 6,
  square: 6,
  sextile: 4,
};

// Approximate daily motion in degrees for each planet
const APPROX_DAILY_MOTION: Record<string, number> = {
  Sun: 1.0, Moon: 13.0, Mercury: 1.2, Venus: 1.2,
  Mars: 0.52, Jupiter: 0.083, Saturn: 0.033,
  Uranus: 0.012, Neptune: 0.006, Pluto: 0.004, Chiron: 0.05,
};

/** Exposed for testing. Total transit window in days (entry to exit). */
export function computePersonalTransitDuration(
  planet: string,
  aspectType: TransitAspectType,
): number | null {
  const speed = APPROX_DAILY_MOTION[planet];
  if (!speed) return null;
  const orbLimit = ASPECT_ORBS[aspectType];
  return (2 * orbLimit) / speed;
}

// Aspect angles
const ASPECT_ANGLES: Record<TransitAspectType, number> = {
  conjunction: 0,
  opposition: 180,
  trine: 120,
  square: 90,
  sextile: 60,
};

// Benefic aspects
const BENEFIC_ASPECTS: TransitAspectType[] = ["conjunction", "trine", "sextile"];

/**
 * Normalize angle to 0-360
 */
function normalize360(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculate the shortest angular distance between two points
 */
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalize360(a) - normalize360(b));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Find aspects between transit and natal positions
 */
function findAspects(
  transitPos: SimplePosition,
  natalPositions: SimplePosition[]
): TransitAspect[] {
  const aspects: TransitAspect[] = [];

  for (const natal of natalPositions) {
    for (const [aspectType, angle] of Object.entries(ASPECT_ANGLES)) {
      const orb = ASPECT_ORBS[aspectType as TransitAspectType];
      const distance = angularDistance(transitPos.longitude, natal.longitude);
      const diff = Math.abs(distance - angle);

      if (diff <= orb) {
        aspects.push({
          transitPlanet: transitPos.name,
          transitSign: transitPos.sign,
          transitDegree: transitPos.signDegree,
          natalPlanet: natal.name,
          natalSign: natal.sign,
          aspectType: aspectType as TransitAspectType,
          orb: diff,
          isExact: diff < 1,
          isBenefic: BENEFIC_ASPECTS.includes(aspectType as TransitAspectType),
          durationDays: computePersonalTransitDuration(transitPos.name, aspectType as TransitAspectType),
        });
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

/**
 * Convert planet name to display format
 */
function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Get current planetary positions
 */
export function getCurrentPlanetaryPositions(): SimplePosition[] {
  const now = new Date();
  
  // Calculate chart for current moment (using 0,0 as location doesn't affect planetary longitudes)
  const chart = calculateChart({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
    latitude: 0,
    longitude: 0,
    timezone: -now.getTimezoneOffset() / 60,
  });

  return chart.planets.map((p) => ({
    name: capitalize(p.name),
    longitude: p.longitude,
    sign: p.sign.name,
    signDegree: p.signDegree,
    isRetrograde: p.isRetrograde,
  }));
}

/**
 * Calculate today's transits relative to natal chart
 */
export function calculateTransits(
  natalPlanets: SimplePosition[],
  natalAscendant?: number,
  natalMidheaven?: number
): TransitsData {
  const now = new Date();
  const currentPositions = getCurrentPlanetaryPositions();

  // Filter to main planets for display
  const mainPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"];
  
  const transitPlanets: TransitPlanet[] = currentPositions
    .filter((p) => mainPlanets.includes(p.name))
    .map((pos) => {
      const aspects = findAspects(pos, natalPlanets);
      
      // Check if transit activates ACG angles
      let activatesACG = false;
      if (natalAscendant !== undefined) {
        const ascDist = angularDistance(pos.longitude, natalAscendant);
        if (ascDist < 8 || Math.abs(ascDist - 180) < 8) {
          activatesACG = true;
        }
      }
      if (natalMidheaven !== undefined) {
        const mcDist = angularDistance(pos.longitude, natalMidheaven);
        if (mcDist < 8 || Math.abs(mcDist - 180) < 8) {
          activatesACG = true;
        }
      }

      const signInfo = ZODIAC_SIGNS[pos.sign] || { symbol: "?", name: pos.sign };

      return {
        name: pos.name,
        symbol: PLANET_SYMBOLS[pos.name] || "?",
        sign: pos.sign,
        signSymbol: signInfo.symbol,
        degree: pos.signDegree,
        color: PLANET_COLORS[pos.name] || "#FFFFFF",
        isRetrograde: pos.isRetrograde || false,
        activatesACG,
        aspects,
      };
    });

  // Find planets with active aspects
  const activePlanetaryEnergies = transitPlanets
    .filter((p) => p.aspects.length > 0 || p.activatesACG)
    .map((p) => p.name);

  return {
    planets: transitPlanets,
    date: now,
    activePlanetaryEnergies,
  };
}

/**
 * Get a human-readable description of an aspect
 */
export function getAspectDescription(aspect: TransitAspect): string {
  const aspectNames: Record<TransitAspectType, string> = {
    conjunction: "conjunct",
    opposition: "opposite",
    trine: "trine",
    square: "square",
    sextile: "sextile",
  };

  return `${aspect.transitPlanet} ${aspectNames[aspect.aspectType]} your ${aspect.natalPlanet}`;
}

/**
 * Get the most significant transit for display
 */
export function getMostSignificantTransit(transits: TransitsData): TransitAspect | null {
  // Priority: conjunctions > oppositions > squares > trines > sextiles
  // And tighter orbs are more significant
  
  const allAspects: TransitAspect[] = [];
  for (const planet of transits.planets) {
    allAspects.push(...planet.aspects);
  }

  if (allAspects.length === 0) return null;

  // Sort by aspect type priority, then by orb
  const priority: Record<TransitAspectType, number> = {
    conjunction: 1,
    opposition: 2,
    square: 3,
    trine: 4,
    sextile: 5,
  };

  return allAspects.sort((a, b) => {
    const aPriority = priority[a.aspectType];
    const bPriority = priority[b.aspectType];
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.orb - b.orb;
  })[0];
}
