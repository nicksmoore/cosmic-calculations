import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, Send, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NatalChartData } from "@/data/natalChartData";
import { useDailyInsight } from "@/hooks/useDailyInsight";
import { useDailyTransits } from "@/hooks/useDailyTransits";

function VibeBar() {
  const { data: dailyTransits } = useDailyTransits();

  const score = useMemo(() => {
    if (!dailyTransits?.transits?.length) return 50;
    let total = 0;
    for (const t of dailyTransits.transits) {
      switch (t.aspect) {
        case "Trine":      total += 1; break;
        case "Sextile":    total += 1; break;
        case "Square":     total -= 1; break;
        case "Opposition": total -= 1; break;
        // Conjunction and others: 0
      }
    }
    const max = dailyTransits.transits.length;
    return Math.round(((total + max) / (2 * max)) * 100);
  }, [dailyTransits]);

  const hasPluto = dailyTransits?.transits.some(t =>
    t.transiting_planet === "Pluto" || t.target_planet === "Pluto"
  );

  const label =
    hasPluto   ? "Transformative" :
    score >= 75 ? "Smooth" :
    score >= 50 ? "Active" :
    "Electric";

  return (
    <div className="mt-4 pt-4 border-t border-border/20">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span>← Smooth</span>
        <span className="font-medium text-foreground">{label}</span>
        <span>Electric →</span>
      </div>
      <div className="h-2 rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: `linear-gradient(to right, hsl(var(--accent)), ${score < 40 ? "#f97316" : score < 60 ? "#eab308" : "#34d399"})`,
          }}
        />
      </div>
    </div>
  );
}

interface DailyInsightPanelProps {
  chartData: NatalChartData;
}

const EXAMPLE_QUESTIONS = [
  "When is the best time for me to sign a contract?",
  "Is this a good week to start a new project?",
  "When should I have a difficult conversation?",
  "What's the best day this month for a first date?",
];

const DailyInsightPanel = ({ chartData }: DailyInsightPanelProps) => {
  const {
    insight,
    isLoading,
    fetchInsight,
    askLifeEvent,
    lifeEventAnswer,
    isLoadingLifeEvent,
  } = useDailyInsight(chartData);

  const [question, setQuestion] = useState("");
  const [showLifeEvents, setShowLifeEvents] = useState(false);

  // Auto-fetch insight on first mount
  useEffect(() => {
    if (!insight && !isLoading) {
      fetchInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAsk = () => {
    if (!question.trim()) return;
    askLifeEvent(question.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-panel rounded-xl overflow-hidden mb-8"
    >
      {/* Daily Insight */}
      <div className="p-5 border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Today's Personalized Insight
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsight}
            disabled={isLoading}
            className="h-7 w-7 p-0"
            title="Refresh insight"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isLoading && !insight ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 py-4"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Reading the stars…</span>
            </motion.div>
          ) : insight ? (
            <motion.p
              key="insight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm leading-relaxed text-foreground/90"
            >
              {insight}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Life Events Search */}
      <div className="p-5">
        <button
          onClick={() => setShowLifeEvents(!showLifeEvents)}
          className="flex items-center gap-2 text-sm font-serif text-foreground hover:text-primary transition-colors mb-3 w-full text-left"
        >
          <Search className="h-4 w-4 text-primary" />
          Ask About Life Timing
        </button>

        <AnimatePresence>
          {showLifeEvents && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Example chips */}
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQuestion(q);
                      askLifeEvent(q);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Custom question input */}
              <div className="flex gap-2">
                <Input
                  placeholder="When should I…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  className="h-9 text-sm glass-panel border-border/50"
                  maxLength={200}
                />
                <Button
                  size="sm"
                  onClick={handleAsk}
                  disabled={isLoadingLifeEvent || !question.trim()}
                  className="h-9 px-3 gap-1"
                >
                  {isLoadingLifeEvent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Answer */}
              <AnimatePresence mode="wait">
                {isLoadingLifeEvent && !lifeEventAnswer ? (
                  <motion.div
                    key="le-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 py-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Consulting the cosmos…</span>
                  </motion.div>
                ) : lifeEventAnswer ? (
                  <motion.div
                    key="le-answer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm leading-relaxed text-foreground/90 bg-primary/5 rounded-lg p-3 border border-primary/20"
                  >
                    {lifeEventAnswer}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <VibeBar />
      </div>
    </motion.div>
  );
};

export default DailyInsightPanel;
