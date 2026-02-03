import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { Sparkles, ChevronRight } from "lucide-react";

interface TodaysPlanetaryBarProps {
  chartData: NatalChartData;
}

interface PlanetChipProps {
  planet: TransitPlanet;
  natalPlanets: { name: string; sign: string }[];
  onClick: () => void;
}

const PlanetChip = ({ planet, natalPlanets, onClick }: PlanetChipProps) => {
  const hasActiveAspects = planet.aspects.length > 0 || planet.activatesACG;
  const signInfo = ZODIAC_SIGNS[planet.sign] || { symbol: "?", name: planet.sign };

  // Find if transit planet is in same sign as natal planet
  const natalPlanet = natalPlanets.find((n) => n.name === planet.name);
  const isReturn = natalPlanet && natalPlanet.sign === planet.sign;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-full 
        backdrop-blur-sm border transition-all cursor-pointer
        hover:scale-105 active:scale-95
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
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
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
        <span className="text-xs text-warning font-medium">℞</span>
      )}

      {/* Return indicator */}
      {isReturn && (
        <span className="text-xs text-primary">✨</span>
      )}

      {/* Active indicator dot */}
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

      {/* Chevron hint */}
      <ChevronRight className="h-3 w-3 text-muted-foreground/50 ml-0.5" />
    </motion.button>
  );
};

const TodaysPlanetaryBar = ({ chartData }: TodaysPlanetaryBarProps) => {
  const navigate = useNavigate();

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

  const handlePlanetClick = (planet: TransitPlanet) => {
    navigate("/transit", {
      state: {
        planet,
        natalPlanets: natalPlanets.map((p) => ({ name: p.name, sign: p.sign })),
      },
    });
  };

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

      {/* Scrollable planets - click to navigate */}
      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground mb-2">Tap a planet to see what it means for you today</p>
        <ScrollArea className="w-full">
          <div className="flex items-center gap-3 pb-2">
            {transits.planets.map((planet) => (
              <PlanetChip 
                key={planet.name} 
                planet={planet} 
                natalPlanets={natalPlanets.map((p) => ({ name: p.name, sign: p.sign }))}
                onClick={() => handlePlanetClick(planet)}
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
