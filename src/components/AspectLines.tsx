import { useMemo } from "react";
import { Planet } from "@/data/natalChartData";
import { Aspect, MAJOR_ASPECTS } from "@/lib/ephemeris/types";

interface AspectLinesProps {
  planets: Planet[];
  center: number;
  innerRadius: number;
  planetPositions: Record<string, { x: number; y: number }>;
}

// Calculate aspects between planets
function calculateAspects(planets: Planet[]): Aspect[] {
  const aspects: Aspect[] = [];
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      const diff = Math.abs(planet1.longitude - planet2.longitude);
      const distance = diff > 180 ? 360 - diff : diff;
      
      for (const aspectType of MAJOR_ASPECTS) {
        const orb = Math.abs(distance - aspectType.angle);
        if (orb <= aspectType.orb) {
          aspects.push({
            point1: planet1.name.toLowerCase(),
            point2: planet2.name.toLowerCase(),
            type: aspectType,
            angle: distance,
            orb,
          });
          break; // Only one aspect per pair
        }
      }
    }
  }
  
  return aspects.sort((a, b) => a.orb - b.orb);
}

// Get color and style for aspect type
function getAspectStyle(aspectName: string): { color: string; dashArray?: string; opacity: number } {
  switch (aspectName.toLowerCase()) {
    case "conjunction":
      return { color: "hsl(45, 100%, 50%)", opacity: 0.7 }; // Gold
    case "opposition":
      return { color: "hsl(0, 80%, 55%)", opacity: 0.6 }; // Red
    case "trine":
      return { color: "hsl(210, 90%, 60%)", opacity: 0.7 }; // Blue - harmonious
    case "square":
      return { color: "hsl(0, 70%, 50%)", opacity: 0.6 }; // Red - challenging
    case "sextile":
      return { color: "hsl(140, 70%, 50%)", opacity: 0.5 }; // Green
    default:
      return { color: "hsl(0, 0%, 50%)", dashArray: "4,4", opacity: 0.3 };
  }
}

const AspectLines = ({ planets, center, innerRadius, planetPositions }: AspectLinesProps) => {
  const aspects = useMemo(() => calculateAspects(planets), [planets]);
  
  // Get position for a planet name
  const getPos = (name: string) => {
    const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
    return planetPositions[capitalName] || { x: center, y: center };
  };
  
  return (
    <g className="aspect-lines">
      {aspects.map((aspect, index) => {
        const pos1 = getPos(aspect.point1);
        const pos2 = getPos(aspect.point2);
        const style = getAspectStyle(aspect.type.name);
        
        // Only draw lines within the inner circle area
        return (
          <line
            key={`${aspect.point1}-${aspect.point2}-${index}`}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke={style.color}
            strokeWidth={aspect.type.name === "Conjunction" ? 2 : 1.5}
            strokeOpacity={style.opacity}
            strokeDasharray={style.dashArray}
            className="pointer-events-none"
          />
        );
      })}
    </g>
  );
};

export default AspectLines;
export { calculateAspects };
