import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { NatalChartData } from "@/data/natalChartData";
import {
  getMostSignificantTransit,
  getAspectDescription,
  TransitPlanet,
  ZODIAC_SIGNS,
} from "@/lib/astrocartography/transits";
import { useTransitRefresh } from "@/hooks/useTransitRefresh";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sparkles, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TodaysPlanetaryBarProps {
  chartData: NatalChartData;
}

interface PlanetChipProps {
  planet: TransitPlanet;
  natalPlanets: { name: string; sign: string }[];
  onClick: () => void;
}

const PLANET_GRADIENTS: Record<string, string> = {
  Sun: "from-amber-300/45 via-orange-400/35 to-yellow-300/20",
  Moon: "from-cyan-200/45 via-sky-300/30 to-blue-200/20",
  Mercury: "from-emerald-300/45 via-teal-300/30 to-cyan-200/20",
  Venus: "from-pink-300/45 via-rose-300/30 to-fuchsia-200/20",
  Mars: "from-rose-400/45 via-red-400/30 to-orange-300/20",
  Jupiter: "from-indigo-300/40 via-violet-300/30 to-sky-200/20",
  Saturn: "from-slate-300/40 via-zinc-300/30 to-stone-200/20",
  Uranus: "from-cyan-300/45 via-blue-300/30 to-indigo-200/20",
  Neptune: "from-violet-300/45 via-indigo-300/30 to-blue-200/20",
  Pluto: "from-fuchsia-400/45 via-purple-400/30 to-indigo-300/20",
  Chiron: "from-lime-300/40 via-emerald-300/30 to-cyan-200/20",
};

const PlanetChip = ({ planet, natalPlanets, onClick }: PlanetChipProps) => {
  const hasActiveAspects = planet.aspects.length > 0 || planet.activatesACG;
  const signInfo = ZODIAC_SIGNS[planet.sign] || {
    symbol: "?",
    name: planet.sign,
    element: "Unknown",
    modality: "Unknown",
    polarity: "Unknown",
  };
  const gradient = PLANET_GRADIENTS[planet.name] ?? "from-primary/40 via-primary/25 to-transparent";

  // Find if transit planet is in same sign as natal planet
  const natalPlanet = natalPlanets.find((n) => n.name === planet.name);
  const isReturn = natalPlanet && natalPlanet.sign === planet.sign;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center gap-2.5 px-4 py-3 md:px-5.5 md:py-3.5 rounded-2xl 
        border transition-all cursor-pointer overflow-hidden
        hover:scale-[1.02] active:scale-[0.98]
        ${hasActiveAspects 
          ? "bg-background/80 border-primary/45 shadow-[0_10px_40px_-20px_hsl(var(--primary))]"
          : "bg-background/70 border-border/40 hover:border-border/60"
        }
      `}
      animate={hasActiveAspects ? {
        boxShadow: [
          "0 8px 30px -18px hsl(var(--primary) / 0.3)",
          "0 12px 44px -16px hsl(var(--primary) / 0.55)",
          "0 8px 30px -18px hsl(var(--primary) / 0.3)",
        ],
      } : undefined}
      transition={hasActiveAspects ? {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      } : undefined}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-[1px] rounded-[15px] bg-background/70" />
      <div className="relative flex items-center gap-2">
        <motion.div
          className="relative h-11 w-11 md:h-[52px] md:w-[52px] rounded-full border border-white/20 bg-black/20 grid place-items-center"
          animate={hasActiveAspects ? { rotate: [0, 360] } : undefined}
          transition={hasActiveAspects ? { duration: 12, repeat: Infinity, ease: "linear" } : undefined}
        >
          <span className="text-[22px] md:text-[28px] font-medium leading-none" style={{ color: planet.color }}>
            {planet.symbol}
          </span>
        </motion.div>

        <div className="text-left leading-tight">
          <p className="text-sm md:text-base font-semibold text-foreground/95">{planet.name}</p>
          <div className="flex items-center gap-1 text-sm md:text-base text-foreground/80">
            <span>{signInfo.symbol}</span>
            <span>{Math.floor(planet.degree)}°</span>
            {planet.isRetrograde && <span className="text-amber-500 font-semibold">℞</span>}
            {isReturn && <span className="text-primary">✨</span>}
          </div>
          <p className="text-sm text-foreground/65 hidden md:block">
            {signInfo.element} • {signInfo.modality} • {signInfo.polarity}
          </p>
        </div>
      </div>

      {hasActiveAspects && (
        <motion.div
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary"
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

      <ChevronRight className="relative h-[18px] w-[18px] text-muted-foreground/60 ml-auto" />
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

  // Use the transit refresh hook for automatic daily updates
  const { transits, lastRefreshed, refresh } = useTransitRefresh({
    natalPlanets,
    ascendantLongitude: chartData.angles?.ascendant?.longitude,
    midheavenLongitude: chartData.angles?.midheaven?.longitude,
  });

  const significantTransit = useMemo(
    () => transits ? getMostSignificantTransit(transits) : null,
    [transits]
  );

  const dateString = useMemo(() => {
    return lastRefreshed.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [lastRefreshed]);

  const handlePlanetClick = useCallback((planet: TransitPlanet) => {
    navigate("/transit", {
      state: {
        planet,
        natalPlanets: natalPlanets.map((p) => ({ name: p.name, sign: p.sign })),
      },
    });
  }, [navigate, natalPlanets]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (!transits) return null;

  const mercuryIsRetrograde = transits.planets.find(p => p.name === "Mercury")?.isRetrograde === true;

  const desktopPlanets = transits.planets.slice(0, 11);
  const desktopTopRow = desktopPlanets.slice(0, 5);
  const desktopBottomRow = desktopPlanets.slice(5);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full border rounded-2xl backdrop-blur-xl mb-8 overflow-hidden ${
        mercuryIsRetrograde
          ? "bg-gradient-to-br from-amber-500/15 via-background/70 to-background/85 border-amber-500/30"
          : "bg-gradient-to-br from-background/85 via-background/65 to-background/85 border-border/30"
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center px-5 py-4 md:px-6 md:py-5 gap-4 border-b border-border/20 bg-black/10">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="text-base">
            <span className="text-foreground font-semibold">Today's Transits</span>
            <span className="text-sm text-muted-foreground ml-2">{dateString}</span>
          </div>
        </div>

        {/* Refresh button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 w-7 p-0 shrink-0"
          title="Refresh transits"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>

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

      {/* Planets - wrap on desktop, horizontal scroll on mobile */}
      <div className="px-5 py-4 md:px-6 md:py-5">
        <p className="text-base text-muted-foreground mb-3">Tap a planet to open your personalized transit meaning</p>
        <div className="md:hidden">
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
        <div className="hidden md:flex md:flex-col md:gap-3">
          <div className="flex items-center justify-center gap-3">
            {desktopTopRow.map((planet) => (
              <PlanetChip
                key={planet.name}
                planet={planet}
                natalPlanets={natalPlanets.map((p) => ({ name: p.name, sign: p.sign }))}
                onClick={() => handlePlanetClick(planet)}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-3">
            {desktopBottomRow.map((planet) => (
              <PlanetChip
                key={planet.name}
                planet={planet}
                natalPlanets={natalPlanets.map((p) => ({ name: p.name, sign: p.sign }))}
                onClick={() => handlePlanetClick(planet)}
              />
            ))}
          </div>
        </div>
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
