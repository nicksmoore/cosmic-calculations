import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PLANET_COLORS } from "@/lib/astrocartography";

interface MapLegendProps {
  allPlanets: string[];
  onClose: () => void;
}

const MapLegend = ({ allPlanets, onClose }: MapLegendProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 z-10 glass-panel p-4 rounded-xl max-w-[320px] max-h-[85vh] overflow-y-auto border border-border/30"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">Astrocartography Guide</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 text-xs">
        {/* What is Astrocartography */}
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">What is this?</span> These lines show where each planet in your birth chart was rising, setting, or at its highest/lowest point. Living or traveling near a line activates that planet's energy in your life.
          </p>
        </div>

        {/* Planet Colors */}
        <div>
          <p className="text-muted-foreground mb-2 font-medium">Planet Colors</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {allPlanets.map((planet) => (
              <div key={planet} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20"
                  style={{ 
                    backgroundColor: PLANET_COLORS[planet],
                    boxShadow: `0 0 8px ${PLANET_COLORS[planet]}80`,
                  }}
                />
                <span className="text-foreground">{planet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Types */}
        <div>
          <p className="text-muted-foreground mb-2 font-medium">Line Styles</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-primary rounded shadow-[0_0_8px_var(--primary)]" />
              <span>Solid = MC/IC lines (vertical)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 rounded" style={{ background: 'repeating-linear-gradient(90deg, hsl(var(--primary)) 0, hsl(var(--primary)) 3px, transparent 3px, transparent 5px)' }} />
              <span>Dashed = ASC/DSC lines (curved)</span>
            </div>
          </div>
        </div>

        {/* Line Meanings */}
        <div>
          <p className="text-muted-foreground mb-2 font-medium">What Each Line Means</p>
          <div className="space-y-2">
            <div className="p-2 rounded bg-muted/50">
              <p className="font-mono text-foreground">MC (Midheaven)</p>
              <p className="text-muted-foreground">Career, public image, reputation. Where you may find professional success or recognition.</p>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <p className="font-mono text-foreground">IC (Imum Coeli)</p>
              <p className="text-muted-foreground">Home, family, roots. Where you may feel a deep sense of belonging or emotional connection.</p>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <p className="font-mono text-foreground">ASC (Ascendant)</p>
              <p className="text-muted-foreground">Self-expression, identity. Where you may feel most "yourself" or experience personal growth.</p>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <p className="font-mono text-foreground">DSC (Descendant)</p>
              <p className="text-muted-foreground">Relationships, partnerships. Where you may attract significant connections or collaborations.</p>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-2 rounded-lg bg-accent/30 border border-accent/40">
          <p className="font-medium text-foreground mb-1">💡 Quick Tips</p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Click anywhere on the globe to explore</li>
            <li>Use filters to focus on specific planets</li>
            <li>The closer to a line, the stronger the effect</li>
            <li>Lines glow to show their cosmic energy</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default MapLegend;
