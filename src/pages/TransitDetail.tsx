import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StarField from "@/components/StarField";
import {
  TransitPlanet,
  TransitAspect,
  ZODIAC_SIGNS,
} from "@/lib/astrocartography/transits";
import {
  getTransitInterpretation,
  PLANET_ARCHETYPES,
} from "@/lib/astrocartography/interpretations";
import { formatTransitDuration } from "@/lib/formatTransitDuration";

interface TransitDetailState {
  planet: TransitPlanet;
  natalPlanets: { name: string; sign: string }[];
}

const IntensityBadge = ({ intensity }: { intensity: "strong" | "moderate" | "mild" }) => {
  if (intensity === "strong") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
        <TrendingUp className="h-3 w-3" />
        Strong
      </span>
    );
  }
  if (intensity === "moderate") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
        <Minus className="h-3 w-3" />
        Moderate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground/70 text-sm font-medium">
      <TrendingDown className="h-3 w-3" />
      Mild
    </span>
  );
};

const AspectCard = ({ aspect }: { aspect: TransitAspect }) => {
  const interpretation = getTransitInterpretation(
    aspect.transitPlanet,
    aspect.natalPlanet,
    aspect.aspectType,
    aspect.orb
  );

  const aspectSymbols: Record<string, string> = {
    conjunction: "☌",
    opposition: "☍",
    trine: "△",
    square: "□",
    sextile: "⚹",
  };

  return (
    <Card className="glass-panel border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">{aspectSymbols[aspect.aspectType]}</span>
              {interpretation.headline}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {aspect.transitPlanet} in {aspect.transitSign} {aspect.aspectType} your natal {aspect.natalPlanet} • {aspect.orb.toFixed(1)}° orb
              {aspect.durationDays != null && (
                <> • <span className="text-muted-foreground/60">{formatTransitDuration(aspect.durationDays)} window</span></>
              )}
            </p>
          </div>
          <IntensityBadge intensity={interpretation.intensity} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground/90 leading-relaxed">
          {interpretation.description}
        </p>
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <p className="text-sm font-medium text-primary mb-1">💡 Guidance</p>
          <p className="text-foreground/80">{interpretation.advice}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const TransitDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as TransitDetailState | null;

  if (!state?.planet) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <StarField />
        <div className="text-center space-y-4 relative z-10">
          <p className="text-muted-foreground">No transit data available.</p>
          <Button onClick={() => navigate("/")}>Return to Chart</Button>
        </div>
      </div>
    );
  }

  const { planet, natalPlanets } = state;
  const archetype = PLANET_ARCHETYPES[planet.name];
  const signInfo = ZODIAC_SIGNS[planet.sign] || {
    symbol: "?",
    name: planet.sign,
    element: "Unknown",
    modality: "Unknown",
    polarity: "Unknown",
  };

  // Check if this is a planetary return (transiting planet in same sign as natal)
  const natalPlanet = natalPlanets.find((n) => n.name === planet.name);
  const isReturn = natalPlanet && natalPlanet.sign === planet.sign;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chart
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className="text-6xl"
              style={{ color: planet.color }}
            >
              {planet.symbol}
            </span>
            <span className="text-4xl text-muted-foreground">{signInfo.symbol}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-serif text-ethereal mb-2">
            {planet.name} in {planet.sign}
            {planet.isRetrograde && (
              <span className="ml-2 text-amber-500 text-xl">℞ Retrograde</span>
            )}
          </h1>

          <p className="text-lg text-muted-foreground">
            Currently at {planet.degree.toFixed(1)}° {planet.sign}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-border/40 bg-card/50 px-2.5 py-1 text-[11px] uppercase tracking-wider text-foreground/90">
              Element: {signInfo.element}
            </span>
            <span className="rounded-full border border-border/40 bg-card/50 px-2.5 py-1 text-[11px] uppercase tracking-wider text-foreground/90">
              Modality: {signInfo.modality}
            </span>
            <span className="rounded-full border border-border/40 bg-card/50 px-2.5 py-1 text-[11px] uppercase tracking-wider text-foreground/90">
              Polarity: {signInfo.polarity}
            </span>
          </div>

          {isReturn && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary"
            >
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">{planet.name} Return Period</span>
            </motion.div>
          )}
        </motion.div>

        {/* Planet Archetype */}
        {archetype && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <Card className="glass-panel border-border/30 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span style={{ color: planet.color }}>{planet.symbol}</span>
                  About {planet.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Keyword</p>
                    <p className="font-medium text-lg">{archetype.keyword}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Energy</p>
                    <p className="font-medium">{archetype.energy}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {archetype.themes.map((theme) => (
                      <span
                        key={theme}
                        className="px-3 py-1 rounded-full bg-muted text-sm"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Aspects to Natal Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-serif text-center mb-6">
            {planet.aspects.length > 0 ? (
              <>How {planet.name} Affects Your Chart Today</>
            ) : (
              <>Current Transit</>
            )}
          </h2>

          {planet.aspects.length > 0 ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              {planet.aspects.map((aspect, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <AspectCard aspect={aspect} />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="glass-panel border-border/30 max-w-2xl mx-auto">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {planet.name} is currently transiting without making major aspects to your natal chart.
                </p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  This is a quieter period for {planet.name} themes in your life.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ACG Activation */}
        {planet.activatesACG && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 max-w-2xl mx-auto"
          >
            <Card className="glass-panel border-primary/30 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-primary mb-2">
                      Astrocartography Activation
                    </p>
                    <p className="text-foreground/80">
                      This transit is currently activating your {planet.name} astrocartography lines!
                      Check the Map view to see which locations on Earth are being energized by this transit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default TransitDetail;
