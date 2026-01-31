import { motion } from "framer-motion";

export type ZodiacSystem = "tropical" | "sidereal";

interface ZodiacSystemSelectorProps {
  value: ZodiacSystem;
  onChange: (system: ZodiacSystem) => void;
}

const zodiacSystems: { id: ZodiacSystem; name: string; description: string }[] = [
  {
    id: "tropical",
    name: "Western",
    description: "Tropical zodiac based on seasons, starting at Spring Equinox",
  },
  {
    id: "sidereal",
    name: "Vedic",
    description: "Sidereal zodiac (Lahiri ayanamsa) based on fixed stars",
  },
];

const ZodiacSystemSelector = ({ value, onChange }: ZodiacSystemSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">Zodiac:</span>
      <div className="flex rounded-lg bg-secondary/50 p-0.5">
        {zodiacSystems.map((system) => (
          <motion.button
            key={system.id}
            onClick={() => onChange(system.id)}
            className={`px-3 py-1 rounded-md text-xs transition-all ${
              value === system.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
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

export default ZodiacSystemSelector;
