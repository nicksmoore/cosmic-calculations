import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
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

const houseExplanations: Record<HouseSystem, { title: string; explanation: string }> = {
  placidus: {
    title: "Placidus House System",
    explanation: "The most popular house system in modern Western astrology. It divides the sky based on the time it takes for a point on the ecliptic to rise from the horizon to the midheaven. House sizes vary based on latitude and season, making each chart uniquely tied to its birth location. Best for precise timing and predictive work.",
  },
  "whole-sign": {
    title: "Whole Sign House System",
    explanation: "The oldest house system, used in Hellenistic and Vedic astrology. Each zodiac sign equals one complete house, starting with the rising sign as the 1st house. This creates equal 30° houses that are easy to interpret. Favored by traditional astrologers for its simplicity and historical authenticity.",
  },
  equal: {
    title: "Equal House System",
    explanation: "Each house spans exactly 30°, starting from the degree of the Ascendant. Unlike Whole Sign, the houses don't align with sign boundaries. This system works well at extreme latitudes where Placidus can create distorted house sizes. Popular in European astrology traditions.",
  },
};

const HouseSystemSelector = ({ value, onChange }: HouseSystemSelectorProps) => {
  return (
    <div className="glass-panel rounded-xl p-4 max-w-2xl mx-auto space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground text-center">
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

      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-secondary/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-foreground mb-1">
                {houseExplanations[value].title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {houseExplanations[value].explanation}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HouseSystemSelector;
