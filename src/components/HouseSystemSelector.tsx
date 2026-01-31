import { motion } from "framer-motion";
import { HouseSystem } from "./ChartDashboard";

interface HouseSystemSelectorProps {
  value: HouseSystem;
  onChange: (system: HouseSystem) => void;
}

const houseSystems: { id: HouseSystem; name: string; description: string }[] = [
  {
    id: "placidus",
    name: "Placidus",
    description: "Most widely used, time-based divisions",
  },
  {
    id: "whole-sign",
    name: "Whole Sign",
    description: "Ancient system, each sign = one house",
  },
  {
    id: "equal",
    name: "Equal",
    description: "30° per house from Ascendant",
  },
];

const HouseSystemSelector = ({ value, onChange }: HouseSystemSelectorProps) => {
  return (
    <div className="glass-panel rounded-xl p-4 max-w-2xl mx-auto">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
        House System
      </h3>
      <div className="flex flex-wrap justify-center gap-2">
        {houseSystems.map((system) => (
          <motion.button
            key={system.id}
            onClick={() => onChange(system.id)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              value === system.id
                ? "bg-accent text-accent-foreground gold-glow"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={system.description}
          >
            {system.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HouseSystemSelector;
