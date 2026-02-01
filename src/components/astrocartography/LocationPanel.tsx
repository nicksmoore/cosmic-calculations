import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";
import { LineType, PLANET_COLORS, LINE_SYMBOLS } from "@/lib/astrocartography";

interface LocationPanelProps {
  location: {
    lng: number;
    lat: number;
    nearbyLines: { planet: string; lineType: LineType; distance: number }[];
  };
  onClose: () => void;
}

const LocationPanel = ({ location, onClose }: LocationPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-4 left-4 right-4 z-10 glass-panel p-4 rounded-xl max-w-md mx-auto border border-border/30"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">
            {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {location.nearbyLines.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-2">
            Planetary influences at this location:
          </p>
          {location.nearbyLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className="w-2 h-2 rounded-full ring-1 ring-white/20"
                style={{ 
                  backgroundColor: PLANET_COLORS[line.planet],
                  boxShadow: `0 0 6px ${PLANET_COLORS[line.planet]}80`,
                }}
              />
              <span className="font-medium">{line.planet}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {LINE_SYMBOLS[line.lineType]}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {line.distance.toFixed(1)}° orb
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No major planetary lines nearby. This location has neutral energy—a blank canvas for your own intentions.
        </p>
      )}
    </motion.div>
  );
};

export default LocationPanel;
