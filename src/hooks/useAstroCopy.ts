import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NatalChartData, Planet } from "@/data/natalChartData";
import { DailyTransitsRow } from "@/hooks/useDailyTransits";
import { MAJOR_ASPECTS } from "@/lib/ephemeris/types";

export interface ForecastCopy {
  summary: string;
  details: Array<{ title: string; meaning: string }>;
}

export interface TransitEnergyCopy {
  summary: string;
}

export interface HouseDescriptionCopy {
  summary: string;
  constellationInfluence: string;
  associatedAspects: string;
  strengths: string;
  challenges: string;
  advice: string;
  planetsInHouse: string;
}

interface HousePayload {
  number: number;
  sign: string;
  theme: string;
  ruler: string;
  planets: string[];
  aspects: string[];
  rulerAspects: string[];
}

interface AspectSummary {
  point1: string;
  point2: string;
  aspectName: string;
  orb: number;
}

const HOUSE_RULERS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Pluto",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

function calculateMajorAspects(planets: Planet[]): AspectSummary[] {
  const aspects: AspectSummary[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const diff = Math.abs(p1.longitude - p2.longitude);
      const distance = diff > 180 ? 360 - diff : diff;

      for (const aspectType of MAJOR_ASPECTS) {
        const orb = Math.abs(distance - aspectType.angle);
        if (orb <= aspectType.orb) {
          aspects.push({
            point1: p1.name,
            point2: p2.name,
            aspectName: aspectType.name,
            orb: Number(orb.toFixed(1)),
          });
          break;
        }
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}

function localSignFallback(sign: string, placementLabel: string) {
  const context = placementLabel || `placement in ${sign}`;
  const signMeta: Record<string, { element: string; modality: string; polarity: string }> = {
    Aries: { element: "Fire", modality: "Cardinal", polarity: "Masculine" },
    Taurus: { element: "Earth", modality: "Fixed", polarity: "Feminine" },
    Gemini: { element: "Air", modality: "Mutable", polarity: "Masculine" },
    Cancer: { element: "Water", modality: "Cardinal", polarity: "Feminine" },
    Leo: { element: "Fire", modality: "Fixed", polarity: "Masculine" },
    Virgo: { element: "Earth", modality: "Mutable", polarity: "Feminine" },
    Libra: { element: "Air", modality: "Cardinal", polarity: "Masculine" },
    Scorpio: { element: "Water", modality: "Fixed", polarity: "Feminine" },
    Sagittarius: { element: "Fire", modality: "Mutable", polarity: "Masculine" },
    Capricorn: { element: "Earth", modality: "Cardinal", polarity: "Feminine" },
    Aquarius: { element: "Air", modality: "Fixed", polarity: "Masculine" },
    Pisces: { element: "Water", modality: "Mutable", polarity: "Feminine" },
  }[sign];
  const signature = signMeta
    ? `${sign} carries ${signMeta.element} element, ${signMeta.modality.toLowerCase()} modality, and ${signMeta.polarity.toLowerCase()} polarity, which shapes how this placement initiates, sustains, and responds. `
    : "";
  return `${context} suggests ${sign} themes are central here: your instincts are strong, your preferences are clear, and you move fastest when your values are aligned. ${signature}This placement can be a major strength when you stay intentional and grounded. Its challenge is overcommitting to one approach too quickly, so periodic reflection helps you use this energy with more precision and consistency.`;
}

function cleanSignExplanation(raw: string, sign: string) {
  const text = raw.trim();
  const cleanedPrefix = text
    .replace(new RegExp(`^${sign}\\s+interpretation\\s*[:\\-]\\s*`, "i"), "")
    .replace(/^interpretation\s*[:\-]\s*/i, "");
  return cleanedPrefix.trim();
}

export function useSignExplanation(sign: string | null, placementLabel: string, enabled = true) {
  return useQuery<string | null>({
    queryKey: ["astro-copy-sign-v2", sign, placementLabel],
    enabled: !!sign && enabled,
    staleTime: 30 * 24 * 60 * 60 * 1000,
    retry: 2,
    queryFn: async () => {
      if (!sign) return null;
      const { data, error } = await supabase.functions.invoke("astro-copy", {
        body: {
          type: "sign-explanation",
          sign,
          placementLabel,
        },
      });
      if (error || !data?.explanation) return localSignFallback(sign, placementLabel);
      const cleaned = cleanSignExplanation(String(data.explanation), sign);
      return cleaned || localSignFallback(sign, placementLabel);
    },
  });
}

function chartPayload(chartData: NatalChartData | null) {
  if (!chartData) return { planets: [], houses: [] };
  const aspects = calculateMajorAspects(chartData.planets);
  const aspectsByHouse: Record<number, string[]> = {};
  const addAspectToHouse = (house: number, text: string) => {
    aspectsByHouse[house] = aspectsByHouse[house] ?? [];
    if (!aspectsByHouse[house].includes(text)) aspectsByHouse[house].push(text);
  };

  for (const aspect of aspects) {
    const p1 = chartData.planets.find((p) => p.name === aspect.point1);
    const p2 = chartData.planets.find((p) => p.name === aspect.point2);
    if (!p1 || !p2) continue;
    const text = `${aspect.point1} ${aspect.aspectName.toLowerCase()} ${aspect.point2} (${aspect.orb}° orb)`;
    addAspectToHouse(p1.house, text);
    addAspectToHouse(p2.house, text);
  }

  return {
    planets: chartData.planets.map((p) => ({
      name: p.name,
      sign: p.sign,
      house: p.house,
      degree: p.degree,
      longitude: p.longitude,
    })),
    houses: chartData.houses.map((h) => ({
      number: h.number,
      sign: h.sign,
      theme: h.theme,
      ruler: HOUSE_RULERS[h.sign] ?? "",
      planets: chartData.planets
        .filter((p) => p.house === h.number)
        .map((p) => `${p.name} in ${p.sign}`),
      aspects: aspectsByHouse[h.number] ?? [],
      rulerAspects: (() => {
        const ruler = HOUSE_RULERS[h.sign];
        if (!ruler) return [];
        return aspects
          .filter((a) => a.point1 === ruler || a.point2 === ruler)
          .slice(0, 6)
          .map((a) => `${a.point1} ${a.aspectName.toLowerCase()} ${a.point2} (${a.orb}° orb)`);
      })(),
    })),
  };
}

function buildLocalHouseDescription(house: HousePayload): HouseDescriptionCopy {
  const planetsLine = house.planets.length
    ? house.planets.join(", ")
    : `No natal planets are placed in House ${house.number}, so ${house.sign} on the cusp and ${house.ruler || "the house ruler"} become the main expression channel.`;
  const aspectsLine = house.aspects.length
    ? house.aspects.slice(0, 5).join("; ")
    : house.rulerAspects.length
      ? `Ruler aspects: ${house.rulerAspects.slice(0, 4).join("; ")}`
      : "No major aspect cluster is concentrated here, so this house expresses more through steady baseline patterns and timing windows.";

  return {
    summary: `House ${house.number} (${house.theme}) is filtered through ${house.sign}, which means this life area tends to operate with ${house.sign} pacing, instincts, and priorities. ${house.ruler ? `${house.ruler} rules this house, so any major transits or natal patterns to ${house.ruler} strongly influence outcomes here.` : "The house ruler strongly influences how this area unfolds over time."} ${house.planets.length ? `Because ${planetsLine}, this house is highly active and personalized in your chart.` : "Even as an empty house, it remains highly relevant because cusp sign and ruler condition still shape your lived experience."}`,
    constellationInfluence: `${house.sign} sets the tone for ${house.theme.toLowerCase()}. Its element/modality signature affects whether this domain feels fast-moving, stabilizing, strategic, or adaptive over time. In practice, this sign colors what you prioritize first, what feels emotionally safe, and where you naturally push for growth.`,
    associatedAspects: aspectsLine,
    strengths: `Your strongest leverage in ${house.theme.toLowerCase()} is consistency with your chart’s natural style here. When you align decisions with ${house.sign} priorities and respect timing from ${house.ruler || "the ruler"}, results are more sustainable and less forced.`,
    challenges: `Stress in this house usually shows up as overcorrecting, avoiding discomfort, or repeating familiar cycles. ${house.planets.length ? `Because ${house.planets.map((p) => p.split(" ")[0]).join(", ")} are involved, this area can feel emotionally immediate.` : "With no planets in-house, challenges can be subtle and emerge as blind spots rather than obvious events."}`,
    advice: `Track one concrete metric related to ${house.theme.toLowerCase()} each week, compare it with major mood/decision shifts, and adjust based on outcomes. Use the aspect pattern to identify where to stay flexible versus where to commit.`,
    planetsInHouse: planetsLine,
  };
}

function isSpecificHouseText(text: string, house: HousePayload) {
  const lower = text.toLowerCase();
  const mentionsSign = lower.includes(house.sign.toLowerCase());
  const mentionsRuler = !house.ruler || lower.includes(house.ruler.toLowerCase());
  const mentionsPlanet = house.planets.length === 0
    || house.planets.some((p) => lower.includes(p.split(" ")[0].toLowerCase()));
  return mentionsSign && (mentionsRuler || mentionsPlanet);
}

function coerceHouseCopy(raw: unknown, fallback: HouseDescriptionCopy, house: HousePayload): HouseDescriptionCopy {
  if (!raw) return fallback;

  if (typeof raw === "string") {
    const summary = raw.trim();
    if (!summary || !isSpecificHouseText(summary, house)) return fallback;
    return { ...fallback, summary };
  }

  if (typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const merged: HouseDescriptionCopy = {
    summary: String(obj.summary ?? "").trim() || fallback.summary,
    constellationInfluence: String(obj.constellationInfluence ?? "").trim() || fallback.constellationInfluence,
    associatedAspects: String(obj.associatedAspects ?? "").trim() || fallback.associatedAspects,
    strengths: String(obj.strengths ?? "").trim() || fallback.strengths,
    challenges: String(obj.challenges ?? "").trim() || fallback.challenges,
    advice: String(obj.advice ?? "").trim() || fallback.advice,
    planetsInHouse: String(obj.planetsInHouse ?? "").trim() || fallback.planetsInHouse,
  };

  const whole = `${merged.summary} ${merged.constellationInfluence} ${merged.associatedAspects} ${merged.planetsInHouse}`;
  return isSpecificHouseText(whole, house) ? merged : fallback;
}

function transitPayload(daily: DailyTransitsRow | null) {
  if (!daily) return { dominantTransit: "", transits: [] };
  return {
    dominantTransit: daily.dominant_transit,
    transits: daily.transits.map((t) => ({
      display_name: t.display_name,
      vibe: t.vibe,
      orb: t.orb,
      aspect: t.aspect,
      transiting_planet: t.transiting_planet,
      target_planet: t.target_planet,
    })),
  };
}

export function useForecastCopy(daily: DailyTransitsRow | null) {
  const payload = transitPayload(daily);
  return useQuery<ForecastCopy | null>({
    queryKey: ["astro-copy-forecast", daily?.date, daily?.dominant_transit],
    enabled: !!daily,
    staleTime: 12 * 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("astro-copy", {
        body: { type: "forecast", ...payload },
      });
      if (error || !data?.forecast) return null;
      return data.forecast as ForecastCopy;
    },
  });
}

export function useTransitEnergyCopy(daily: DailyTransitsRow | null) {
  const payload = transitPayload(daily);
  return useQuery<TransitEnergyCopy | null>({
    queryKey: ["astro-copy-transit-energy", daily?.date, daily?.dominant_transit],
    enabled: !!daily,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 2,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("astro-copy", {
        body: { type: "transit-energy", ...payload },
      });
      if (error || !data?.summary) return null;
      return { summary: String(data.summary) };
    },
  });
}

export function useHouseDescriptions(chartData: NatalChartData | null) {
  const payload = chartPayload(chartData);
  const localFallback = Object.fromEntries(
    payload.houses.map((house) => [String(house.number), buildLocalHouseDescription(house)])
  ) as Record<string, HouseDescriptionCopy>;

  return useQuery<Record<string, HouseDescriptionCopy | string> | null>({
    queryKey: [
      "astro-copy-houses-v5",
      JSON.stringify(payload.houses),
      JSON.stringify(payload.planets.map((p) => [p.name, p.house, p.sign, p.longitude])),
    ],
    enabled: !!chartData,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("astro-copy", {
        body: { type: "houses", ...payload },
      });
      if (error || !data?.houseDescriptions) return localFallback;

      const aiDescriptions = data.houseDescriptions as Record<string, unknown>;
      const merged = Object.fromEntries(
        payload.houses.map((house) => {
          const key = String(house.number);
          return [key, coerceHouseCopy(aiDescriptions[key], localFallback[key], house)];
        })
      ) as Record<string, HouseDescriptionCopy>;

      return merged;
    },
  });
}

export async function fetchCurrentVibeCopy(
  chartData: NatalChartData,
  daily: DailyTransitsRow
): Promise<string | null> {
  const { planets } = chartPayload(chartData);
  const { dominantTransit, transits } = transitPayload(daily);
  const { data, error } = await supabase.functions.invoke("astro-copy", {
    body: {
      type: "vibe",
      planets,
      dominantTransit,
      transits,
    },
  });
  if (error || !data?.vibe) return null;
  return String(data.vibe);
}
