import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useDailyTransits } from "@/hooks/useDailyTransits";
import { useForecastCopy, useTransitEnergyCopy } from "@/hooks/useAstroCopy";
import { getMoonPhase } from "@/lib/moonPhase";
import { formatTransitDuration } from "@/lib/formatTransitDuration";

function useCountdown(targetIso: string | null) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetIso) {
      setTimeLeft("");
      return;
    }

    const tick = () => {
      const ms = new Date(targetIso).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft("Now");
        return;
      }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, "0")}m`);
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return timeLeft;
}

function ProgressBar({ targetIso }: { targetIso: string | null }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    const windowMs = 24 * 3_600_000;
    const start = target - windowMs;

    const tick = () => {
      const now = Date.now();
      const p = Math.min(1, Math.max(0, (now - start) / windowMs));
      setProgress(p);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
    <div className="h-1 rounded-full bg-white/20 mt-3 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-yellow-300"
        style={{ width: `${progress * 100}%` }}
        animate={{ boxShadow: progress > 0.7 ? "0 0 8px 2px #fde047" : "none" }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}

export default function DailyHookCard() {
  const { data, isLoading } = useDailyTransits();
  const { data: forecast } = useForecastCopy(data ?? null);
  const { data: transitEnergy } = useTransitEnergyCopy(data ?? null);
  const countdown = useCountdown(data?.aspect_precision ?? null);
  const moonPhase = useMemo(() => getMoonPhase(), []);

  if (isLoading) {
    return <div className="h-24 rounded-xl glass-panel animate-pulse mb-6" />;
  }

  if (!data) return null;

  const fallbackEnergyParagraph = (() => {
    const top = (data.transits ?? []).slice(0, 4);
    if (top.length === 0) {
      return "Today feels subtle but meaningful. Small adjustments and steady attention can create more momentum than pushing hard.";
    }
    const names = top.map((t) => t.display_name).join(", ");
    return `Today's transits are working together through ${names}. The overall tone is a blend of tension and opportunity, so clear priorities and emotionally honest communication will carry the day.`;
  })();

  const energyParagraph =
    transitEnergy?.summary?.trim()
    || forecast?.summary?.trim()
    || fallbackEnergyParagraph;

  const cleanedEnergyParagraph = (() => {
    const raw = energyParagraph.trim();
    const sentences = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length < 2) return raw;

    const opener = sentences[0].toLowerCase();
    const looksLikeTransitList =
      /(conjunct|conjunction|opposition|trine|square|sextile|quincunx|transit|aspects?)/.test(opener) &&
      (opener.includes(",") || opener.includes(" and ") || opener.startsWith("today"));

    return looksLikeTransitList ? sentences.slice(1).join(" ") : raw;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl overflow-hidden mb-6"
      style={{
        background: "linear-gradient(135deg, #1a0533 0%, #12063d 40%, #1c0a4a 100%)",
        boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
      }}
      aria-label="Today's full collective forecast"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-yellow-300 text-xs uppercase tracking-widest font-medium">
              Today's Energy
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-purple-200/80" title={moonPhase.name}>
            <span className="text-base leading-none">{moonPhase.emoji}</span>
            <span className="hidden sm:inline">{moonPhase.name}</span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-serif text-white">
          {data.dominant_transit}
        </h2>

        <p className="text-purple-100 text-sm sm:text-base mt-2 leading-relaxed">
          {cleanedEnergyParagraph}
        </p>

        {forecast?.details?.length ? (
          <div className="mt-4 space-y-3">
            {forecast.details.map((d, idx) => (
              <div key={`${d.title}-${idx}`} className="border-t border-white/15 pt-3">
                <p className="text-white text-sm font-medium">{d.title}</p>
                <p className="text-purple-200 text-sm mt-1">{d.meaning}</p>
              </div>
            ))}
          </div>
        ) : null}

        {data.transits?.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs uppercase tracking-widest text-purple-300/60 mb-2">Active Transits</p>
            {data.transits.map((t) => {
              const dur = formatTransitDuration(t.duration_days ?? null);
              return (
                <div
                  key={t.transit_key}
                  className="flex items-center justify-between text-xs text-purple-100/80"
                >
                  <span className="truncate pr-2">{t.display_name}</span>
                  <span className="shrink-0 text-purple-300/60 font-mono">
                    {dur ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {data.aspect_precision && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-purple-200">
              <span>Peak Intensity</span>
              <span className="font-mono">{countdown || "—"}</span>
            </div>
            <ProgressBar targetIso={data.aspect_precision} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
