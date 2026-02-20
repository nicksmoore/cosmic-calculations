// src/lib/calculateChartForProfile.ts
// Pure function version of useEphemeris — no React hooks.
// Used for batch chart calculation in useMatchFeed.
import { calculateChart as celestineCalculateChart } from "celestine";
import { NatalChartData, Planet, House, ChartAngles, zodiacSigns } from "@/data/natalChartData";
import { BirthData } from "@/components/intake/BirthDataForm";
import { formatDMS } from "@/hooks/useEphemeris";

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  Chiron: "⚷", NorthNode: "☊", SouthNode: "☋", Lilith: "⚸",
};

const PLANET_DESCRIPTIONS: Record<string, string> = {
  Sun: "Your core identity and conscious ego.",
  Moon: "Your emotional nature and subconscious patterns.",
  Mercury: "Your mind and communication style.",
  Venus: "Your values and approach to love.",
  Mars: "Your drive and assertive energy.",
  Jupiter: "Your growth and expansion.",
  Saturn: "Your discipline and life lessons.",
  Uranus: "Your individuality and rebellion.",
  Neptune: "Your spirituality and imagination.",
  Pluto: "Your transformation and power.",
};

const HOUSE_DATA: Record<number, { theme: string; description: string }> = {
  1: { theme: "Self & Identity", description: "Your persona and how you approach new beginnings." },
  2: { theme: "Values & Resources", description: "Your relationship with money and self-worth." },
  3: { theme: "Communication", description: "Short journeys, siblings, and everyday exchanges." },
  4: { theme: "Home & Roots", description: "Your private life and emotional foundation." },
  5: { theme: "Creativity & Joy", description: "Romance, children, and creative expression." },
  6: { theme: "Health & Service", description: "Daily routines and physical well-being." },
  7: { theme: "Partnerships", description: "Marriage and one-on-one relationships." },
  8: { theme: "Transformation", description: "Shared resources, intimacy, and hidden depths." },
  9: { theme: "Philosophy", description: "Higher education, travel, and the search for meaning." },
  10: { theme: "Career & Status", description: "Public reputation and ambitions." },
  11: { theme: "Community", description: "Friendships, groups, and humanitarian ideals." },
  12: { theme: "Spirituality", description: "The subconscious, solitude, and transcendence." },
};

const longitudeToSign = (longitude: number): { sign: typeof zodiacSigns[number]; degree: number } => {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized % 30;
  return { sign: zodiacSigns[signIndex], degree };
};

const findHouseForPlanet = (longitude: number, cusps: number[]): number => {
  const lng = ((longitude % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const cusp = cusps[i];
    const nextCusp = cusps[(i + 1) % 12];
    if (nextCusp > cusp) {
      if (lng >= cusp && lng < nextCusp) return i + 1;
    } else {
      if (lng >= cusp || lng < nextCusp) return i + 1;
    }
  }
  return 1;
};

export function calculateChartForProfile(birthData: BirthData): NatalChartData | null {
  if (!birthData.latitude || !birthData.longitude) return null;

  try {
    const [year, month, day] = birthData.birthDate.split("-").map(Number);
    const [hour, minute] = birthData.timeUnknown
      ? [12, 0]
      : birthData.birthTime.split(":").map(Number);

    const timezoneOffsetHours = (() => {
      const raw = birthData.timezone?.trim();
      if (!raw) return 0;
      const match = raw.match(/^UTC\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i);
      if (!match) return 0;
      const sign = match[1] === "-" ? -1 : 1;
      const hours = Number(match[2] ?? 0);
      const minutes = Number(match[3] ?? 0);
      return sign * (hours + minutes / 60);
    })();

    const celestineChart = celestineCalculateChart(
      {
        year, month, day, hour, minute, second: 0,
        timezone: timezoneOffsetHours,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
      },
      { houseSystem: "placidus" }
    );

    const adjustLongitude = (lon: number) => ((lon % 360) + 360) % 360;

    const ascLon  = adjustLongitude(celestineChart.angles.ascendant.longitude);
    const mcLon   = adjustLongitude(celestineChart.angles.midheaven.longitude);
    const descLon = adjustLongitude(celestineChart.angles.descendant.longitude);
    const icLon   = adjustLongitude(celestineChart.angles.imumCoeli.longitude);

    const ascSign  = longitudeToSign(ascLon);
    const mcSign   = longitudeToSign(mcLon);
    const descSign = longitudeToSign(descLon);
    const icSign   = longitudeToSign(icLon);

    const angles: ChartAngles = {
      ascendant:  { sign: ascSign.sign.name,  signSymbol: ascSign.sign.symbol,  degree: ascSign.degree,  longitude: ascLon },
      midheaven:  { sign: mcSign.sign.name,   signSymbol: mcSign.sign.symbol,   degree: mcSign.degree,   longitude: mcLon },
      descendant: { sign: descSign.sign.name, signSymbol: descSign.sign.symbol, degree: descSign.degree, longitude: descLon },
      imumCoeli:  { sign: icSign.sign.name,   signSymbol: icSign.sign.symbol,   degree: icSign.degree,   longitude: icLon },
    };

    const houseCusps = celestineChart.houses.cusps.map(c => adjustLongitude(c.longitude));

    const houses: House[] = houseCusps.map((cusp, index) => {
      const signInfo = longitudeToSign(cusp);
      const houseNum = index + 1;
      const houseInfo = HOUSE_DATA[houseNum];
      return {
        number: houseNum,
        sign: signInfo.sign.name,
        signSymbol: signInfo.sign.symbol,
        cusp,
        theme: houseInfo.theme,
        description: houseInfo.description,
      };
    });

    const mainPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];

    const planets: Planet[] = celestineChart.planets
      .filter(p => mainPlanets.includes(p.body))
      .map((p) => {
        const adjustedLon = adjustLongitude(p.longitude);
        const signInfo = longitudeToSign(adjustedLon);
        const house = findHouseForPlanet(adjustedLon, houseCusps);
        const dms = formatDMS(adjustedLon);
        return {
          name: p.body,
          symbol: PLANET_SYMBOLS[p.body] || "●",
          sign: signInfo.sign.name,
          signSymbol: signInfo.sign.symbol,
          house,
          degree: signInfo.degree,
          longitude: adjustedLon,
          isRetrograde: p.isRetrograde,
          description: PLANET_DESCRIPTIONS[p.body] || "",
          dms,
        };
      });

    return { angles, planets, houses };
  } catch {
    return null;
  }
}
