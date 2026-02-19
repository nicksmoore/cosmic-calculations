import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import { useDailyTransits } from "@/hooks/useDailyTransits";
import { CollectiveTransit } from "@/lib/transitEngine";

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

function CollectiveForecastSheet({
  transits,
  onClose,
}: {
  transits: CollectiveTransit[];
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        className="relative w-full glass-panel rounded-t-2xl p-6 pb-10 max-h-[70vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-serif text-ethereal mb-4">Collective Forecast</h3>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close forecast"
        >
          ✕
        </button>
        {transits.length === 0 && (
          <p className="text-muted-foreground text-sm">A quiet cosmic day — ideal for inner reflection.</p>
        )}
        {transits.map((t) => (
          <div key={t.transit_key} className="mb-4 pb-4 border-b border-border/30 last:border-0">
            <p className="font-medium text-sm">{t.display_name}</p>
            <p className="text-muted-foreground text-xs mt-1">{t.vibe}</p>
            <p className="text-muted-foreground text-xs">
              Orb: {t.orb.toFixed(1)}° · {t.is_applying ? "Applying" : "Separating"}
            </p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function DailyHookCard() {
  const { data, isLoading } = useDailyTransits();
  const [showSheet, setShowSheet] = useState(false);
  const countdown = useCountdown(data?.aspect_precision ?? null);

  if (isLoading) {
    return <div className="h-24 rounded-xl glass-panel animate-pulse mb-6" />;
  }

  if (!data) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden mb-6 cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #1a0533 0%, #0d1b4b 50%, #0a2a1a 100%)",
          boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
        }}
        role="button"
        tabIndex={0}
        aria-label="Open collective forecast"
        onClick={() => setShowSheet(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowSheet(true); } }}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-yellow-300 text-xs uppercase tracking-widest font-medium">
              Today's Energy
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-serif text-white">
            {data.dominant_transit}
          </h2>

          {data.description && (
            <p className="text-purple-200 text-sm mt-1 line-clamp-1">{data.description}</p>
          )}

          {data.aspect_precision && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-purple-200">
                <span>Peak Intensity</span>
                <span className="font-mono">{countdown || "—"}</span>
              </div>
              <ProgressBar targetIso={data.aspect_precision} />
            </div>
          )}

          <div className="flex items-center gap-1 mt-3 text-purple-300 text-xs">
            <span>Tap for full forecast</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSheet && (
          <CollectiveForecastSheet
            transits={data.transits}
            onClose={() => setShowSheet(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
