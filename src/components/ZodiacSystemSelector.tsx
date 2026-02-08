import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

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

const zodiacExplanations: Record<ZodiacSystem, { title: string; explanation: string }> = {
  tropical: {
    title: "Western (Tropical) Astrology",
    explanation: "The tropical zodiac is aligned with the seasons and Earth's relationship to the Sun. It begins at the Spring Equinox (0° Aries) and is the system used in Western astrology. This approach emphasizes psychological insights, personality traits, and life themes based on the Sun's apparent path through the sky.",
  },
  sidereal: {
    title: "Vedic (Sidereal) Astrology",
    explanation: "The sidereal zodiac is aligned with the actual fixed star constellations. Due to Earth's axial precession, it differs from the tropical zodiac by about 24° (the ayanamsa). Vedic astrology, rooted in ancient Indian traditions, uses this system and places greater emphasis on karma, destiny, and the Moon's placement.",
  },
};

const ZodiacSystemSelector = ({ value, onChange }: ZodiacSystemSelectorProps) => {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-center gap-2">
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

      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="glass-panel rounded-lg p-4 max-w-2xl mx-auto"
        >
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-foreground mb-1">
                {zodiacExplanations[value].title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {zodiacExplanations[value].explanation}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ZodiacSystemSelector;
