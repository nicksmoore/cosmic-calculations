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

function scoreCategoryFromLongitudes(
  natalLongs: Record<string, number>,
  partnerLongs: Record<string, number>,
  config: typeof CATEGORY_CONFIG[number],
): CompatibilityCategory {
  const aspectList: string[] = [];
  let total = 0;
  let maxPossible = 0;

  for (const n of config.pairs[0]) {
    const nLong = natalLongs[n];
    if (nLong == null) continue;
    for (const p of config.pairs[1]) {
      const pLong = partnerLongs[p];
      if (pLong == null) continue;
      maxPossible += 8;
      const dist = angleBetween(nLong, pLong);
      const result = aspectScore(dist);
      if (result) {
        total += result.weight;
        aspectList.push(`${n} ${result.name} ${p}`);
      }
    }
  }

  const score = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 50;
  return {
    label: config.label,
    emoji: config.emoji,
    description: config.description,
    score: Math.min(score, 100),
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

  return {
    celebrity: bestCeleb,
    score: Math.min(Math.round((bestScore / 30) * 100), 100),
    topAspect: bestAspect || "Cosmic intrigue ✨",
  };
}
