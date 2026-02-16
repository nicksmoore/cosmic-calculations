/**
 * Synastry compatibility scoring engine.
 * Based on Stefanie Caponi's "Guided Astrology Workbook" approach to aspect interpretation.
 */

import { Planet } from "@/data/natalChartData";
import { MAJOR_ASPECTS } from "@/lib/ephemeris/types";
import { CELEBRITIES, CelebrityData } from "@/data/celebrityBirthData";

// ── Aspect scoring ──────────────────────────────────────────────

function aspectScore(distance: number): { name: string; weight: number } | null {
  for (const a of MAJOR_ASPECTS) {
    const orb = Math.abs(distance - a.angle);
    if (orb <= a.orb) {
      // Tighter orb → higher weight; harmonious aspects score positively
      const tightness = 1 - orb / a.orb; // 0‑1
      let base: number;
      switch (a.name) {
        case "Conjunction": base = 8; break;
        case "Trine":       base = 7; break;
        case "Sextile":     base = 5; break;
        case "Opposition":  base = 3; break;  // tension but attraction
        case "Square":      base = 2; break;  // friction
        default:            base = 1;
      }
      return { name: a.name, weight: base * (0.5 + 0.5 * tightness) };
    }
  }
  return null;
}

function angleBetween(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return diff > 180 ? 360 - diff : diff;
}

// ── Category definitions ────────────────────────────────────────

export interface CompatibilityCategory {
  label: string;
  emoji: string;
  description: string;
  score: number;        // 0‑100
  aspects: string[];    // human‑readable aspect list
}

export interface CompatibilityResult {
  overall: number;
  categories: CompatibilityCategory[];
}

type PlanetPair = [string[], string[]]; // natal planets, partner planets

const CATEGORY_CONFIG: {
  label: string;
  emoji: string;
  description: string;
  pairs: PlanetPair;
}[] = [
  {
    label: "Communication",
    emoji: "💬",
    description: "How you talk, think, and connect intellectually",
    pairs: [["Mercury", "Sun", "Moon"], ["Mercury", "Sun", "Moon"]],
  },
  {
    label: "Romance",
    emoji: "💕",
    description: "Attraction, love language, and emotional chemistry",
    pairs: [["Venus", "Mars", "Moon"], ["Venus", "Mars", "Moon"]],
  },
  {
    label: "Long-term Stability",
    emoji: "🏔️",
    description: "Staying power, commitment, and shared growth",
    pairs: [["Saturn", "Jupiter", "Sun"], ["Saturn", "Jupiter", "Sun"]],
  },
  {
    label: "Passion & Drive",
    emoji: "🔥",
    description: "Physical chemistry, ambition, and shared energy",
    pairs: [["Mars", "Venus", "Pluto"], ["Mars", "Venus", "Pluto"]],
  },
  {
    label: "Emotional Bond",
    emoji: "🌊",
    description: "Intuition, empathy, and emotional safety",
    pairs: [["Moon", "Neptune", "Venus"], ["Moon", "Neptune", "Venus"]],
  },
];

function findPlanet(planets: Planet[], name: string): Planet | undefined {
  return planets.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

/** Sign-based elemental harmony (0-1) */
function elementalAffinity(long1: number, long2: number): number {
  const sign1 = Math.floor(((long1 % 360) + 360) % 360 / 30);
  const sign2 = Math.floor(((long2 % 360) + 360) % 360 / 30);
  const elements = ["Fire", "Earth", "Air", "Water"];
  const el1 = elements[sign1 % 4];
  const el2 = elements[sign2 % 4];

  if (el1 === el2) return 0.7; // same element
  // compatible elements: Fire-Air, Earth-Water
  if ((el1 === "Fire" && el2 === "Air") || (el1 === "Air" && el2 === "Fire")) return 0.5;
  if ((el1 === "Earth" && el2 === "Water") || (el1 === "Water" && el2 === "Earth")) return 0.5;
  return 0.2; // incompatible
}

function scoreCategoryFromLongitudes(
  natalLongs: Record<string, number>,
  partnerLongs: Record<string, number>,
  config: typeof CATEGORY_CONFIG[number],
): CompatibilityCategory {
  const aspectList: string[] = [];
  let pairCount = 0;
  let totalScore = 0;

  for (const n of config.pairs[0]) {
    const nLong = natalLongs[n];
    if (nLong == null) continue;
    for (const p of config.pairs[1]) {
      const pLong = partnerLongs[p];
      if (pLong == null) continue;
      pairCount++;

      const dist = angleBetween(nLong, pLong);
      const result = aspectScore(dist);

      if (result) {
        // Aspect found – score based on weight (max 8)
        totalScore += (result.weight / 8) * 100;
        aspectList.push(`${n} ${result.name} ${p}`);
      } else {
        // No major aspect – use elemental affinity as baseline
        totalScore += elementalAffinity(nLong, pLong) * 45;
      }
    }
  }

  const score = pairCount > 0 ? Math.round(totalScore / pairCount) : 50;
  return {
    label: config.label,
    emoji: config.emoji,
    description: config.description,
    score: Math.max(5, Math.min(score, 98)),
    aspects: aspectList,
  };
}

// ── Public API ───────────────────────────────────────────────────

export function calculateCompatibility(
  natalPlanets: Planet[],
  partnerPlanets: Planet[],
): CompatibilityResult {
  const natalLongs: Record<string, number> = {};
  const partnerLongs: Record<string, number> = {};

  for (const p of natalPlanets) natalLongs[p.name] = p.longitude;
  for (const p of partnerPlanets) partnerLongs[p.name] = p.longitude;

  const categories = CATEGORY_CONFIG.map((cfg) =>
    scoreCategoryFromLongitudes(natalLongs, partnerLongs, cfg)
  );

  const overall = Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  );

  return { overall, categories };
}

// ── Celebrity Crush ──────────────────────────────────────────────

export interface CelebrityCrush {
  celebrity: CelebrityData;
  score: number;
  topAspect: string;
}

export function findCelebrityCrush(natalPlanets: Planet[]): CelebrityCrush {
  const natalLongs: Record<string, number> = {};
  for (const p of natalPlanets) natalLongs[p.name] = p.longitude;

  let bestCeleb = CELEBRITIES[0];
  let bestScore = -1;
  let bestAspect = "";

  for (const celeb of CELEBRITIES) {
    // Focus on Venus-Venus, Venus-Mars, Moon-Venus for "crush" chemistry
    const crushPairs: [string, string][] = [
      ["Venus", "Venus"],
      ["Venus", "Mars"],
      ["Mars", "Venus"],
      ["Moon", "Venus"],
      ["Sun", "Venus"],
      ["Venus", "Moon"],
    ];

    let score = 0;
    let topAspectStr = "";
    let topWeight = 0;

    for (const [n, p] of crushPairs) {
      const nLong = natalLongs[n];
      const pLong = celeb.planetLongitudes[p];
      if (nLong == null || pLong == null) continue;

      const dist = angleBetween(nLong, pLong);
      const result = aspectScore(dist);
      if (result) {
        score += result.weight;
        if (result.weight > topWeight) {
          topWeight = result.weight;
          topAspectStr = `Your ${n} ${result.name} their ${p}`;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCeleb = celeb;
      bestAspect = topAspectStr;
    }
  }

  // Normalize: 6 crush pairs, max weight 8 each = 48 theoretical max
  return {
    celebrity: bestCeleb,
    score: Math.max(10, Math.min(Math.round((bestScore / 28) * 100), 98)),
    topAspect: bestAspect || "Cosmic intrigue ✨",
  };
}
