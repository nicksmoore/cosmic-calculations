import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NatalChartData } from "@/data/natalChartData";
import { DailyTransitsRow } from "@/hooks/useDailyTransits";

export interface ForecastCopy {
  summary: string;
  details: Array<{ title: string; meaning: string }>;
}

export interface TransitEnergyCopy {
  summary: string;
}

function chartPayload(chartData: NatalChartData | null) {
  if (!chartData) return { planets: [], houses: [] };
  return {
    planets: chartData.planets.map((p) => ({
      name: p.name,
      sign: p.sign,
      house: p.house,
      degree: p.degree,
    })),
    houses: chartData.houses.map((h) => ({
      number: h.number,
      sign: h.sign,
      theme: h.theme,
    })),
  };
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
  return useQuery<Record<string, string> | null>({
    queryKey: ["astro-copy-houses", JSON.stringify(payload.houses), JSON.stringify(payload.planets.map((p) => [p.name, p.house, p.sign]))],
    enabled: !!chartData,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("astro-copy", {
        body: { type: "houses", ...payload },
      });
      if (error || !data?.houseDescriptions) return null;
      return data.houseDescriptions as Record<string, string>;
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
