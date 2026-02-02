import { useMemo } from "react";
import { motion } from "framer-motion";
import { NatalChartData } from "@/data/natalChartData";
import {
  calculateTransits,
  getMostSignificantTransit,
  getAspectDescription,
  TransitPlanet,
  TransitAspect,
  ZODIAC_SIGNS,
} from "@/lib/astrocartography/transits";
import {
  getTransitInterpretation,
  PLANET_ARCHETYPES,
} from "@/lib/astrocartography/interpretations";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TodaysPlanetaryBarProps {
  chartData: NatalChartData;
}

const IntensityIcon = ({ intensity }: { intensity: "strong" | "moderate" | "mild" }) => {
  if (intensity === "strong") return <TrendingUp className="h-3 w-3 text-primary" />;
  if (intensity === "moderate") return <Minus className="h-3 w-3 text-muted-foreground" />;
  return <TrendingDown className="h-3 w-3 text-muted-foreground/50" />;
};

const AspectInterpretation = ({ aspect }: { aspect: TransitAspect }) => {
  const interpretation = getTransitInterpretation(
    aspect.transitPlanet,
    aspect.natalPlanet,
    aspect.aspectType,
    aspect.orb
  );

  return (
    <div className="space-y-2 border-t border-border/30 pt-2 mt-2">
      <div className="flex items-center gap-2">
        <IntensityIcon intensity={interpretation.intensity} />
        <p className="text-sm font-medium text-primary">{interpretation.headline}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {interpretation.description}
      </p>
      <div className="bg-primary/5 rounded-md p-2 border border-primary/10">
        <p className="text-xs text-foreground/80">
          <span className="font-medium">💡 </span>
          {interpretation.advice}
        </p>
      </div>
    </div>
  );
};

const PlanetChip = ({ planet, natalPlanets }: { planet: TransitPlanet; natalPlanets: { name: string; sign: string }[] }) => {
  const hasActiveAspects = planet.aspects.length > 0 || planet.activatesACG;
  const signInfo = ZODIAC_SIGNS[planet.sign] || { symbol: "?", name: planet.sign };
  const archetype = PLANET_ARCHETYPES[planet.name];

  // Find if transit planet is in same sign as natal planet
  const natalPlanet = natalPlanets.find((n) => n.name === planet.name);
  const isReturn = natalPlanet && natalPlanet.sign === planet.sign;

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
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
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <span style={{ color: planet.color }}>{planet.symbol}</span>
                {planet.name} in {planet.sign}
                {planet.isRetrograde && (
                  <span className="text-xs bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">
                    Retrograde
                  </span>
                )}
              </h4>
              <p className="text-sm text-muted-foreground">
                {planet.degree.toFixed(1)}° {planet.sign}
              </p>
            </div>
            {isReturn && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                ✨ Return
              </span>
            )}
          </div>

          {/* Archetype info */}
          {archetype && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">
                {archetype.keyword}: {archetype.energy}
              </p>
              <p className="text-xs text-muted-foreground">
                Themes: {archetype.themes.slice(0, 4).join(", ")}
              </p>
            </div>
          )}

          {/* Active aspects with interpretations */}
          {planet.aspects.length > 0 && (
            <div>
              <p className="text-xs font-medium text-primary mb-2">
                Aspects to Your Natal Chart:
              </p>
              {planet.aspects.slice(0, 2).map((aspect, i) => (
                <div key={i}>
                  <p className="text-xs text-muted-foreground">
                    {getAspectDescription(aspect)} ({aspect.orb.toFixed(1)}° orb)
                  </p>
                  <AspectInterpretation aspect={aspect} />
                </div>
              ))}
            </div>
          )}

          {/* ACG activation */}
          {planet.activatesACG && (
            <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
              <p className="text-xs text-primary">
                ✨ This transit is activating your Astrocartography lines! Check the Map view for enhanced locations.
              </p>
            </div>
          )}

          {/* No aspects message */}
          {planet.aspects.length === 0 && !planet.activatesACG && (
            <p className="text-xs text-muted-foreground italic">
              Currently transiting without major aspects to your natal chart.
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const TodaysPlanetaryBar = ({ chartData }: TodaysPlanetaryBarProps) => {
  const natalPlanets = useMemo(() => {
    return chartData.planets.map((p) => ({
      name: p.name,
      longitude: p.longitude,
      sign: p.sign,
      signDegree: p.degree,
      isRetrograde: p.isRetrograde ?? false,
    }));
  }, [chartData]);

  const transits = useMemo(() => {
    return calculateTransits(
      natalPlanets,
      chartData.angles?.ascendant?.longitude,
      chartData.angles?.midheaven?.longitude
    );
  }, [chartData, natalPlanets]);

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
      className="w-full glass-panel border border-border/30 rounded-xl backdrop-blur-md mb-8"
    >
      {/* Header Row */}
      <div className="flex items-center px-4 py-3 gap-4 border-b border-border/20">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="text-sm">
            <span className="text-foreground font-medium">Today's Cosmic Weather</span>
            <span className="text-xs text-muted-foreground ml-2">{dateString}</span>
          </div>
        </div>

        {/* Significant transit callout */}
        {significantTransit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 ml-auto"
          >
            <span className="text-xs font-medium text-primary">
              ✨ {getAspectDescription(significantTransit)}
            </span>
          </motion.div>
        )}
      </div>

      {/* Scrollable planets */}
      <div className="px-4 py-3">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-3 pb-2">
            {transits.planets.map((planet) => (
              <PlanetChip 
                key={planet.name} 
                planet={planet} 
                natalPlanets={natalPlanets.map((p) => ({ name: p.name, sign: p.sign }))}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>

      {/* Mobile significant transit */}
      {significantTransit && (
        <div className="md:hidden px-4 pb-3">
          <div className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2 border border-primary/30">
            ✨ {getAspectDescription(significantTransit)}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TodaysPlanetaryBar;
