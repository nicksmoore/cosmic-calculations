import { useMemo } from "react";
import { motion } from "framer-motion";
import { NatalChartData } from "@/data/natalChartData";
import {
  calculateTransits,
  getMostSignificantTransit,
  getAspectDescription,
  TransitPlanet,
  ZODIAC_SIGNS,
} from "@/lib/astrocartography/transits";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

interface TodaysPlanetaryBarProps {
  chartData: NatalChartData;
}

const PlanetChip = ({ planet }: { planet: TransitPlanet }) => {
  const hasActiveAspects = planet.aspects.length > 0 || planet.activatesACG;
  const signInfo = ZODIAC_SIGNS[planet.sign] || { symbol: "?", name: planet.sign };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.div
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-full 
              backdrop-blur-sm border transition-all cursor-pointer
              ${hasActiveAspects 
                ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/20" 
                : "bg-background/40 border-border/30 hover:border-border/50"
              }
            `}
            animate={hasActiveAspects ? {
              boxShadow: [
                "0 0 10px rgba(var(--primary), 0.2)",
                "0 0 20px rgba(var(--primary), 0.4)",
                "0 0 10px rgba(var(--primary), 0.2)",
              ],
            } : undefined}
            transition={hasActiveAspects ? {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            } : undefined}
          >
            {/* Planet symbol with color */}
            <span
              className="text-lg font-medium"
              style={{ color: planet.color }}
            >
              {planet.symbol}
            </span>

            {/* Sign info */}
            <div className="flex items-center gap-0.5">
              <span className="text-sm text-foreground/80">{signInfo.symbol}</span>
              <span className="text-xs text-muted-foreground">
                {Math.floor(planet.degree)}°
              </span>
            </div>

            {/* Retrograde indicator */}
            {planet.isRetrograde && (
              <span className="text-xs text-amber-500 font-medium">℞</span>
            )}

            {/* Active indicator */}
            {hasActiveAspects && (
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">
              {planet.name} in {planet.sign}
              {planet.isRetrograde && " (Retrograde)"}
            </p>
            <p className="text-xs text-muted-foreground">
              {planet.degree.toFixed(1)}° {planet.sign}
            </p>
            {planet.aspects.length > 0 && (
              <div className="pt-1 border-t border-border/50">
                <p className="text-xs font-medium text-primary mb-1">Active Aspects:</p>
                {planet.aspects.slice(0, 3).map((aspect, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {getAspectDescription(aspect)} ({aspect.orb.toFixed(1)}° orb)
                  </p>
                ))}
              </div>
            )}
            {planet.activatesACG && (
              <p className="text-xs text-primary pt-1">
                ✨ Activating your ACG lines!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const TodaysPlanetaryBar = ({ chartData }: TodaysPlanetaryBarProps) => {
  const transits = useMemo(() => {
    const natalPlanets = chartData.planets.map((p) => ({
      name: p.name,
      longitude: p.longitude,
      sign: p.sign,
      signDegree: p.degree,
      isRetrograde: p.isRetrograde ?? false,
    }));

    return calculateTransits(
      natalPlanets,
      chartData.angles?.ascendant?.longitude,
      chartData.angles?.midheaven?.longitude
    );
  }, [chartData]);

  const significantTransit = useMemo(
    () => getMostSignificantTransit(transits),
    [transits]
  );

  const dateString = transits.date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full glass-panel border-b border-border/30 backdrop-blur-md"
    >
      <div className="flex items-center px-4 py-2 gap-4">
        {/* Date & Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="text-sm">
            <span className="text-muted-foreground">Today's Transits</span>
            <span className="text-xs text-muted-foreground/70 ml-2">{dateString}</span>
          </div>
        </div>

        {/* Scrollable planets */}
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-2 pb-2">
            {transits.planets.map((planet) => (
              <PlanetChip key={planet.name} planet={planet} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>

        {/* Significant transit callout */}
        {significantTransit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 shrink-0"
          >
            <span className="text-xs font-medium text-primary">
              {getAspectDescription(significantTransit)}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default TodaysPlanetaryBar;
