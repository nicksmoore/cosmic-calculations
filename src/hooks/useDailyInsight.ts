/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo } from "react";
import { NatalChartData } from "@/data/natalChartData";
import { calculateTransits, TransitsData } from "@/lib/astrocartography/transits";
import { toast } from "sonner";

const INSIGHT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-insight`;

interface UseDailyInsightReturn {
  insight: string;
  isLoading: boolean;
  fetchInsight: () => Promise<void>;
  askLifeEvent: (question: string) => Promise<void>;
  lifeEventAnswer: string;
  isLoadingLifeEvent: boolean;
}

function buildPayload(chartData: NatalChartData, transits: TransitsData | null) {
  const planets = chartData.planets.map((p) => ({
    name: p.name,
    sign: p.sign,
    house: p.house,
    degree: p.degree,
    isRetrograde: p.isRetrograde,
  }));

  const transitAspects = transits
    ? transits.planets.flatMap((tp) => tp.aspects)
    : [];

  return { planets, transits: transitAspects };
}

async function streamResponse(
  resp: Response,
  onDelta: (text: string) => void,
): Promise<void> {
  if (!resp.ok || !resp.body) {
    const body = await resp.text();
    let msg = "AI service error";
    try { msg = JSON.parse(body).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") return;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
}

export function useDailyInsight(
  chartData: NatalChartData | null,
): UseDailyInsightReturn {
  const [insight, setInsight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lifeEventAnswer, setLifeEventAnswer] = useState("");
  const [isLoadingLifeEvent, setIsLoadingLifeEvent] = useState(false);

  // Compute transits on the fly from chart data
  const transits = useMemo(() => {
    if (!chartData) return null;
    const natalPositions = chartData.planets.map((p) => ({
      name: p.name,
      longitude: p.longitude,
      sign: p.sign,
      signDegree: p.degree,
      isRetrograde: p.isRetrograde ?? false,
    }));
    return calculateTransits(
      natalPositions,
      chartData.angles?.ascendant?.longitude,
      chartData.angles?.midheaven?.longitude,
    );
  }, [chartData]);

  const fetchInsight = useCallback(async () => {
    if (!chartData) return;
    setIsLoading(true);
    setInsight("");

    try {
      const { planets, transits: transitAspects } = buildPayload(chartData, transits);
      const resp = await fetch(INSIGHT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: "daily", planets, transits: transitAspects }),
      });

      let full = "";
      await streamResponse(resp, (chunk) => {
        full += chunk;
        setInsight(full);
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to generate insight");
    } finally {
      setIsLoading(false);
    }
  }, [chartData, transits]);

  const askLifeEvent = useCallback(async (question: string) => {
    if (!chartData || !question.trim()) return;
    setIsLoadingLifeEvent(true);
    setLifeEventAnswer("");

    try {
      const { planets, transits: transitAspects } = buildPayload(chartData, transits);
      const resp = await fetch(INSIGHT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "life-event",
          planets,
          transits: transitAspects,
          question,
        }),
      });

      let full = "";
      await streamResponse(resp, (chunk) => {
        full += chunk;
        setLifeEventAnswer(full);
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to get answer");
    } finally {
      setIsLoadingLifeEvent(false);
    }
  }, [chartData, transits]);

  return { insight, isLoading, fetchInsight, askLifeEvent, lifeEventAnswer, isLoadingLifeEvent };
}
