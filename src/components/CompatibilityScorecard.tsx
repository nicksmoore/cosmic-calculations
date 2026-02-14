import { useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Star, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Planet } from "@/data/natalChartData";
import {
  calculateCompatibility,
  findCelebrityCrush,
  CompatibilityResult,
  CelebrityCrush,
} from "@/lib/synastry/compatibility";

interface CompatibilityScorecardProps {
  natalPlanets: Planet[];
  partnerPlanets: Planet[];
  partnerName: string;
  userName: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 45) return "text-amber-400";
  return "text-rose-400";
}

function progressGradient(score: number): string {
  if (score >= 70) return "bg-gradient-to-r from-emerald-500 to-teal-400";
  if (score >= 45) return "bg-gradient-to-r from-amber-500 to-yellow-400";
  return "bg-gradient-to-r from-rose-500 to-pink-400";
}

const CompatibilityScorecard = ({
  natalPlanets,
  partnerPlanets,
  partnerName,
  userName,
}: CompatibilityScorecardProps) => {
  const result: CompatibilityResult = useMemo(
    () => calculateCompatibility(natalPlanets, partnerPlanets),
    [natalPlanets, partnerPlanets]
  );

  const crush: CelebrityCrush = useMemo(
    () => findCelebrityCrush(natalPlanets),
    [natalPlanets]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 mt-8"
    >
      {/* Overall Score */}
      <div className="glass-panel rounded-xl p-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-pink-400">
          <Heart className="h-5 w-5 fill-current" />
          <h2 className="font-serif text-xl">
            {userName} &amp; {partnerName}
          </h2>
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <div className={`text-5xl font-bold ${scoreColor(result.overall)}`}>
          {result.overall}%
        </div>
        <p className="text-muted-foreground text-sm">Overall Cosmic Compatibility</p>
      </div>

      {/* Category Breakdown */}
      <div className="glass-panel rounded-xl p-5 space-y-5">
        <h3 className="font-serif text-base text-foreground flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Compatibility Breakdown
        </h3>

        {result.categories.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">{cat.emoji}</span>
                <span className="font-medium text-foreground">{cat.label}</span>
              </span>
              <span className={`font-bold ${scoreColor(cat.score)}`}>
                {cat.score}%
              </span>
            </div>

            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                className={`h-full rounded-full ${progressGradient(cat.score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${cat.score}%` }}
                transition={{ duration: 0.8, delay: 0.15 * i }}
              />
            </div>

            <p className="text-xs text-muted-foreground">{cat.description}</p>
            {cat.aspects.length > 0 && (
              <p className="text-xs text-muted-foreground/70 italic">
                {cat.aspects.join(" • ")}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Celebrity Crush */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-panel rounded-xl p-5 space-y-3"
      >
        <h3 className="font-serif text-base text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          Your Celebrity Crush Match
        </h3>

        <div className="flex items-center gap-4">
          <div className="text-4xl">{crush.celebrity.imageEmoji}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{crush.celebrity.name}</p>
            <p className="text-xs text-muted-foreground">
              Born {crush.celebrity.birthDate}
            </p>
            <p className="text-xs text-pink-300 mt-1">{crush.topAspect}</p>
          </div>
          <div className={`text-2xl font-bold ${scoreColor(crush.score)}`}>
            {crush.score}%
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CompatibilityScorecard;
