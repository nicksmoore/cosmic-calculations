import { Planet } from "@/data/natalChartData";
import { MAJOR_ASPECTS } from "@/lib/ephemeris/types";

export interface ChartBadge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  detail?: string;
}

function angDist(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function hasAspect(p1: Planet, p2: Planet, angle: number, orb: number) {
  return Math.abs(angDist(p1.longitude, p2.longitude) - angle) <= orb;
}

export function detectBadges(planets: Planet[]): ChartBadge[] {
  const badges: ChartBadge[] = [];

  // --- Stellium Holder ---
  const signCounts: Record<string, string[]> = {};
  const houseCounts: Record<number, string[]> = {};
  for (const p of planets) {
    (signCounts[p.sign] ??= []).push(p.name);
    (houseCounts[p.house] ??= []).push(p.name);
  }
  const stelliumSign = Object.entries(signCounts).find(([, v]) => v.length >= 3);
  const stelliumHouse = Object.entries(houseCounts).find(([, v]) => v.length >= 3);
  badges.push({
    id: "stellium",
    name: "Stellium Holder",
    emoji: "⭐",
    description: "3+ planets concentrated in one sign or house",
    unlocked: !!(stelliumSign || stelliumHouse),
    detail: stelliumSign
      ? `${stelliumSign[1].join(", ")} in ${stelliumSign[0]}`
      : stelliumHouse
      ? `${stelliumHouse[1].join(", ")} in House ${stelliumHouse[0]}`
      : undefined,
  });

  // --- Grand Trine Finder ---
  let grandTrineDetail: string | undefined;
  outer: for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      for (let k = j + 1; k < planets.length; k++) {
        if (
          hasAspect(planets[i], planets[j], 120, 8) &&
          hasAspect(planets[j], planets[k], 120, 8) &&
          hasAspect(planets[i], planets[k], 120, 8)
        ) {
          grandTrineDetail = `${planets[i].name}, ${planets[j].name}, ${planets[k].name}`;
          break outer;
        }
      }
    }
  }
  badges.push({
    id: "grand-trine",
    name: "Grand Trine Finder",
    emoji: "🔺",
    description: "Three planets in a perfect triangle of harmony",
    unlocked: !!grandTrineDetail,
    detail: grandTrineDetail,
  });

  // --- T-Square Titan ---
  let tSquareDetail: string | undefined;
  tsq: for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!hasAspect(planets[i], planets[j], 180, 8)) continue;
      for (let k = 0; k < planets.length; k++) {
        if (k === i || k === j) continue;
        if (
          hasAspect(planets[i], planets[k], 90, 7) &&
          hasAspect(planets[j], planets[k], 90, 7)
        ) {
          tSquareDetail = `${planets[k].name} apex, ${planets[i].name} ☍ ${planets[j].name}`;
          break tsq;
        }
      }
    }
  }
  badges.push({
    id: "t-square",
    name: "T-Square Titan",
    emoji: "⚡",
    description: "A dynamic tension pattern driving action",
    unlocked: !!tSquareDetail,
    detail: tSquareDetail,
  });

  // --- Night Owl / Early Bird ---
  const sun = planets.find((p) => p.name === "Sun");
  if (sun) {
    const isNight = sun.house >= 1 && sun.house <= 6;
    badges.push({
      id: "sect",
      name: isNight ? "Night Owl" : "Day Walker",
      emoji: isNight ? "🌙" : "☀️",
      description: isNight
        ? "Born with the Sun below the horizon (night chart)"
        : "Born with the Sun above the horizon (day chart)",
      unlocked: true,
    });
  }

  // --- Retrograde Rebel ---
  const retros = planets.filter((p) => p.isRetrograde);
  badges.push({
    id: "retrograde-rebel",
    name: "Retrograde Rebel",
    emoji: "🔄",
    description: "3+ retrograde planets — a deeply introspective soul",
    unlocked: retros.length >= 3,
    detail: retros.length >= 3 ? retros.map((p) => p.name).join(", ") : undefined,
  });

  // --- Grand Cross ---
  let gcDetail: string | undefined;
  gc: for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!hasAspect(planets[i], planets[j], 180, 8)) continue;
      for (let k = j + 1; k < planets.length; k++) {
        for (let l = k + 1; l < planets.length; l++) {
          if (
            hasAspect(planets[k], planets[l], 180, 8) &&
            hasAspect(planets[i], planets[k], 90, 7) &&
            hasAspect(planets[j], planets[l], 90, 7)
          ) {
            gcDetail = `${planets[i].name}, ${planets[j].name}, ${planets[k].name}, ${planets[l].name}`;
            break gc;
          }
        }
      }
    }
  }
  badges.push({
    id: "grand-cross",
    name: "Grand Cross Bearer",
    emoji: "✝️",
    description: "Four planets locked in a cross of dynamic tension",
    unlocked: !!gcDetail,
    detail: gcDetail,
  });

  // --- Elemental balance ---
  const elCounts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const p of planets) {
    const el = getElement(p.sign);
    if (el) elCounts[el]++;
  }
  const dominant = Object.entries(elCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominant[1] >= 4) {
    const elEmoji: Record<string, string> = { Fire: "🔥", Earth: "🌍", Air: "💨", Water: "🌊" };
    badges.push({
      id: "elemental",
      name: `${dominant[0]} Dominant`,
      emoji: elEmoji[dominant[0]] || "✨",
      description: `4+ planets in ${dominant[0]} signs — a powerful elemental emphasis`,
      unlocked: true,
      detail: `${dominant[1]} planets in ${dominant[0]}`,
    });
  }

  // --- Yod (Finger of God) ---
  let yodDetail: string | undefined;
  yodLoop: for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!hasAspect(planets[i], planets[j], 60, 6)) continue;
      for (let k = 0; k < planets.length; k++) {
        if (k === i || k === j) continue;
        if (
          hasAspect(planets[i], planets[k], 150, 3) &&
          hasAspect(planets[j], planets[k], 150, 3)
        ) {
          yodDetail = `${planets[k].name} apex, ${planets[i].name} ⚹ ${planets[j].name}`;
          break yodLoop;
        }
      }
    }
  }
  badges.push({
    id: "yod",
    name: "Finger of Fate",
    emoji: "👆",
    description: "A rare Yod pattern pointing to a fated mission",
    unlocked: !!yodDetail,
    detail: yodDetail,
  });

  return badges;
}

function getElement(sign: string): string | undefined {
  const map: Record<string, string> = {
    Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
    Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
    Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
  };
  return map[sign];
}
