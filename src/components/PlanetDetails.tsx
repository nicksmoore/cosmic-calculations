import { motion } from "framer-motion";
import { Planet } from "@/data/natalChartData";

interface PlanetDetailsProps {
  planet: Planet;
}

const PlanetDetails = ({ planet }: PlanetDetailsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-3xl gold-glow">
          {planet.symbol}
        </div>
        <div>
          <h3 className="text-2xl font-serif text-ethereal">{planet.name}</h3>
          <p className="text-sm text-muted-foreground">{planet.degree}</p>
        </div>
      </div>

      {/* Placement Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sign</p>
          <p className="text-lg font-serif text-foreground">{planet.sign}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">House</p>
          <p className="text-lg font-serif text-foreground">{planet.house}</p>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 rounded-lg cosmic-border">
        <p className="text-sm leading-relaxed text-foreground/90">
          {planet.description}
        </p>
      </div>
    </motion.div>
  );
};

export default PlanetDetails;
