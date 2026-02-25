import { calculateChart } from "celestine";

// ---- Types ----

export interface TransitTag {
  transit_key: string;
  transiting_planet: string;
  aspect: string;
  natal_point: string;
  display_name: string;
  orb: number;
  is_primary: boolean;
  is_personal: boolean;
  is_applying: boolean;
}

export interface CollectiveTransit {
  transit_key: string;
  display_name: string;
  transiting_planet: string;
  aspect: string;
  target_planet: string;
  orb: number;
  is_applying: boolean;
  aspect_precision: string | null;
  vibe: string;
  duration_days: number | null;
}

export interface DailyTransitData {
  dominant_transit: string;
  transit_key: string;
  description: string;
  aspect_precision: string | null;
  transits: CollectiveTransit[];
}

// ---- Constants ----

const MAJOR_ASPECTS: Array<{ name: string; abbr: string; angle: number; orb: number }> = [
  { name: "conjunction",  abbr: "cnj", angle:   0, orb: 6 },
  { name: "opposition",  abbr: "opp", angle: 180, orb: 6 },
  { name: "square",      abbr: "sq",  angle:  90, orb: 6 },
  { name: "trine",       abbr: "tri", angle: 120, orb: 6 },
  { name: "sextile",     abbr: "sxt", angle:  60, orb: 4 },
];

const COLLECTIVE_ORB = 1;

const PLANET_WEIGHT: Record<string, number> = {
  Saturn: 3, Uranus: 3, Neptune: 3, Pluto: 3,
  Jupiter: 2, Mars: 2,
  Sun: 1, Moon: 1, Mercury: 1, Venus: 1,
};

const ASPECT_VIBES: Record<string, Record<string, string>> = {
  conjunction: {
    default: "Energies merge and amplify.",
    "Pluto-Saturn": "Pressure to restructure at the deepest level.",
    "Saturn-Pluto": "Pressure to restructure at the deepest level.",
    "Jupiter-Uranus": "Sudden expansion and unexpected breakthroughs.",
    "Uranus-Jupiter": "Sudden expansion and unexpected breakthroughs.",
  },
  opposition: { default: "Tension between polarities seeking integration." },
  square: { default: "Friction drives growth through challenge." },
  trine: { default: "Harmonious flow and natural ease." },
  sextile: { default: "Opportunity awaits those who reach for it." },
};

// ---- Helpers ----

function angularDiff(a: number, b: number): number {
  const diff = Math.abs(((a - b) + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

function isApplying(
  transitLonNow: number,
  transitLonNext: number,
  natalLon: number,
  aspectAngle: number,
): boolean {
  const orbNow = Math.abs(angularDiff(transitLonNow, natalLon) - aspectAngle);
  const orbNext = Math.abs(angularDiff(transitLonNext, natalLon) - aspectAngle);
  return orbNext < orbNow;
}

function buildTransitKey(planet: string, aspectAbbr: string, natalPoint: string): string {
  return `${planet.toLowerCase()}_${aspectAbbr}_${natalPoint.toLowerCase().replace(/\s+/g, "_")}`;
}

function getPlanetPositions(date: Date): Map<string, { lon: number; isRetrograde: boolean }> {
  const chart = calculateChart(
    {
      year:     date.getUTCFullYear(),
      month:    date.getUTCMonth() + 1,
      day:      date.getUTCDate(),
      hour:     12,
      minute:   0,
      second:   0,
      timezone: 0,
      latitude: 0,
      longitude: 0,
    },
    { houseSystem: "whole-sign" }
  );

  const positions = new Map<string, { lon: number; isRetrograde: boolean }>();
  for (const p of chart.planets) {
    positions.set(p.body, { lon: p.longitude, isRetrograde: p.isRetrograde });
  }
  return positions;
}

// ---- Public API ----

/** Exposed for testing. Computes remaining days for a collective transit. */
export function computeCollectiveDuration(orb: number, orbChange: number): number | null {
  if (Math.abs(orbChange) <= 0.001) return null;
  const days = orbChange > 0
    ? (orb + COLLECTIVE_ORB) / orbChange
    : (COLLECTIVE_ORB - orb) / Math.abs(orbChange);
  return Math.min(Math.max(0, days), 365);
}

export function getPersonalTransits(
  natalPlanets: Array<{ name: string; longitude: number }>,
  natalAngles: { ascendant: { longitude: number }; midheaven: { longitude: number } },
): TransitTag[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const posToday = getPlanetPositions(today);
  const posTomorrow = getPlanetPositions(tomorrow);

  const natalPoints: Array<{ name: string; longitude: number }> = [
    ...natalPlanets,
    { name: "Ascendant", longitude: natalAngles.ascendant.longitude },
    { name: "Midheaven", longitude: natalAngles.midheaven.longitude },
  ];

  const tags: TransitTag[] = [];

  for (const [transitPlanetName, todayPos] of posToday.entries()) {
    const tomorrowPos = posTomorrow.get(transitPlanetName);
    if (!tomorrowPos) continue;

    for (const natalPoint of natalPoints) {
      for (const aspect of MAJOR_ASPECTS) {
        const diff = angularDiff(todayPos.lon, natalPoint.longitude);
        const orb = Math.abs(diff - aspect.angle);
        if (orb > aspect.orb) continue;

        const applying = isApplying(
          todayPos.lon,
          tomorrowPos.lon,
          natalPoint.longitude,
          aspect.angle,
        );

        const transitKey = buildTransitKey(transitPlanetName, aspect.abbr, natalPoint.name);

        tags.push({
          transit_key:       transitKey,
          transiting_planet: transitPlanetName,
          aspect:            aspect.name,
          natal_point:       natalPoint.name,
          display_name:      `${transitPlanetName} ${aspect.name} ${natalPoint.name}`,
          orb:               Math.round(orb * 100) / 100,
          is_primary:        orb <= 3,
          is_personal:       true,
          is_applying:       applying,
        });
      }
    }
  }

  tags.sort((a, b) => {
    if (a.is_applying !== b.is_applying) return a.is_applying ? -1 : 1;
    return a.orb - b.orb;
  });

  return tags.slice(0, 5);
}

export function getDailyCollectiveTransits(): DailyTransitData {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const posToday = getPlanetPositions(today);
  const posTomorrow = getPlanetPositions(tomorrow);

  const collectiveTransits: CollectiveTransit[] = [];
  const planetNames = Array.from(posToday.keys());

  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planetA = planetNames[i];
      const planetB = planetNames[j];
      const posA = posToday.get(planetA)!;
      const posB = posToday.get(planetB)!;
      const posANext = posTomorrow.get(planetA)!;
      if (!posANext) continue;

      for (const aspect of MAJOR_ASPECTS) {
        const diff = angularDiff(posA.lon, posB.lon);
        const orb = Math.abs(diff - aspect.angle);
        if (orb > COLLECTIVE_ORB) continue;

        const applying = isApplying(posA.lon, posANext.lon, posB.lon, aspect.angle);
        const transitKey = `${planetA.toLowerCase()}_${aspect.abbr}_${planetB.toLowerCase()}`;

        const orbNow = Math.abs(angularDiff(posA.lon, posB.lon) - aspect.angle);
        const orbNext = Math.abs(angularDiff(posANext.lon, posB.lon) - aspect.angle);
        const orbChange = orbNow - orbNext;
        const hoursToExact = orbChange > 0 ? (orbNow / orbChange) * 24 : null;
        const aspectPrecision = hoursToExact !== null
          ? new Date(Date.now() + hoursToExact * 3_600_000).toISOString()
          : null;

        const vibeKey = [planetA, planetB].sort().join('-');
        const vibe = ASPECT_VIBES[aspect.name]?.[vibeKey]
          ?? ASPECT_VIBES[aspect.name]?.default
          ?? "Cosmic energies in dialogue.";

        collectiveTransits.push({
          transit_key:       transitKey,
          display_name:      `${planetA} ${aspect.name} ${planetB}`,
          transiting_planet: planetA,
          aspect:            aspect.name,
          target_planet:     planetB,
          orb:               Math.round(orb * 100) / 100,
          is_applying:       applying,
          aspect_precision:  aspectPrecision,
          vibe,
          duration_days:     computeCollectiveDuration(orb, orbChange),
        });
      }
    }
  }

  if (collectiveTransits.length === 0) {
    return {
      dominant_transit: "Moon in Flow",
      transit_key:      "moon_flow",
      description:      "A quiet day cosmically. Good for reflection.",
      aspect_precision: null,
      transits:         [],
    };
  }

  const scored = collectiveTransits.map(t => ({
    t,
    score: (PLANET_WEIGHT[t.transiting_planet] ?? 1) * (PLANET_WEIGHT[t.target_planet] ?? 1),
  }));
  scored.sort((a, b) => b.score - a.score || a.t.orb - b.t.orb);
  const dominant = scored[0].t;

  return {
    dominant_transit: dominant.display_name,
    transit_key:      dominant.transit_key,
    description:      dominant.vibe,
    aspect_precision: dominant.aspect_precision,
    transits:         collectiveTransits,
  };
}
