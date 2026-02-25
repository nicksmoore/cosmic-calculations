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
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TodaysPlanetaryBarProps {
  chartData: NatalChartData;
}

interface PlanetChipProps {
  planet: TransitPlanet;
  natalPlanets: { name: string; sign: string }[];
  onClick: () => void;
  center?: boolean;
}

function withSunCenteredOrder(planets: TransitPlanet[]): TransitPlanet[] {
  const sun = planets.find((planet) => planet.name === "Sun");
  if (!sun) return planets;
  return [sun, ...planets.filter((planet) => planet.name !== "Sun")];
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

const PlanetChip = ({ planet, natalPlanets, onClick, center = false }: PlanetChipProps) => {
  const hasActiveAspects = planet.aspects.length > 0 || planet.activatesACG;
  const gradient = PLANET_GRADIENTS[planet.name] ?? "from-primary/40 via-primary/25 to-transparent";
  const zodiacSymbol = ZODIAC_SIGNS[planet.sign]?.symbol ?? "✦";

  const natalPlanet = natalPlanets.find((n) => n.name === planet.name);
  const isReturn = natalPlanet && natalPlanet.sign === planet.sign;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative grid place-items-center rounded-full border transition-all cursor-pointer overflow-visible
        ${center ? "h-24 w-24 md:h-28 md:w-28" : "h-20 w-20 md:h-24 md:w-24"}
        hover:scale-[1.04] active:scale-[0.98]
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
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${center ? "opacity-100" : "opacity-90"}`} />
      <div className="absolute inset-[1px] rounded-full bg-background/70" />
      <div className="relative grid place-items-center">
        <motion.div
          className={`${center ? "h-14 w-14 md:h-16 md:w-16" : "h-12 w-12 md:h-14 md:w-14"} rounded-full border border-white/20 bg-black/20 grid place-items-center`}
          animate={hasActiveAspects ? { rotate: [0, 360] } : undefined}
          transition={hasActiveAspects ? { duration: 12, repeat: Infinity, ease: "linear" } : undefined}
        >
          <span className={`${center ? "text-[34px] md:text-[40px]" : "text-[28px] md:text-[33px]"} font-medium leading-none`} style={{ color: planet.color }}>
            {planet.symbol}
          </span>
        </motion.div>
      </div>

      {hasActiveAspects && (
        <motion.div
          className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-primary"
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

      <div className="absolute -right-1 bottom-1 h-6 w-6 md:h-7 md:w-7 rounded-full border border-border/50 bg-background/95 grid place-items-center text-xs md:text-sm shadow-sm">
        {zodiacSymbol}
      </div>

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs md:text-sm text-foreground/80">
        {planet.name}
        {planet.isRetrograde ? " ℞" : ""}
        {isReturn ? " ✨" : ""}
      </div>
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

  const orderedPlanets = withSunCenteredOrder(transits.planets).slice(0, 11);
  const centerPlanet = orderedPlanets.find((planet) => planet.name === "Sun") ?? orderedPlanets[0] ?? null;
  const ringPlanets = centerPlanet
    ? orderedPlanets.filter((planet) => planet.name !== centerPlanet.name)
    : [];

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
      <div className="flex items-center px-5 py-4 md:px-6 md:py-5 gap-4 border-b border-border/20 bg-black/10">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="text-base">
            <span className="text-foreground font-semibold">Today's Transits</span>
            <span className="text-sm text-muted-foreground ml-2">{dateString}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 w-7 p-0 shrink-0"
          title="Refresh transits"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>

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

      <div className="px-5 py-4 md:px-6 md:py-5">
        <p className="text-base text-muted-foreground mb-3">Tap a planet to open your personalized transit meaning</p>
        <div className="relative mx-auto h-[350px] w-[350px] md:h-[540px] md:w-[540px]">
          <div className="absolute inset-[14%] rounded-full border border-primary/20" />
          <div className="absolute inset-[20%] rounded-full border border-border/20" />

          {centerPlanet && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <PlanetChip
                planet={centerPlanet}
                natalPlanets={natalPlanets.map((p) => ({ name: p.name, sign: p.sign }))}
                onClick={() => handlePlanetClick(centerPlanet)}
                center
              />
            </div>
          )}

          {ringPlanets.map((planet, index) => {
            const angle = (-Math.PI / 2) + (index * (2 * Math.PI)) / Math.max(1, ringPlanets.length);
            const radiusPercent = 41;
            const x = 50 + Math.cos(angle) * radiusPercent;
            const y = 50 + Math.sin(angle) * radiusPercent;

            return (
              <div
                key={planet.name}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <PlanetChip
                  planet={planet}
                  natalPlanets={natalPlanets.map((p) => ({ name: p.name, sign: p.sign }))}
                  onClick={() => handlePlanetClick(planet)}
                />
              </div>
            );
          })}
        </div>
      </div>

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
