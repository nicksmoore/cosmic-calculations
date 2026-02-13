import { useMemo } from "react";
import { Planet } from "@/data/natalChartData";
import { MAJOR_ASPECTS, Aspect } from "@/lib/ephemeris/types";

interface SynastryAspectLinesProps {
  natalPlanets: Planet[];
  partnerPlanets: Planet[];
  center: number;
  natalPositions: Record<string, { x: number; y: number }>;
  partnerPositions: Record<string, { x: number; y: number }>;
}

function calculateSynastryAspects(natal: Planet[], partner: Planet[]): Aspect[] {
  const aspects: Aspect[] = [];

  for (const p1 of natal) {
    for (const p2 of partner) {
      const diff = Math.abs(p1.longitude - p2.longitude);
      const distance = diff > 180 ? 360 - diff : diff;

      for (const aspectType of MAJOR_ASPECTS) {
        const orb = Math.abs(distance - aspectType.angle);
        if (orb <= aspectType.orb) {
          aspects.push({
            point1: p1.name,
            point2: `partner_${p2.name}`,
            type: aspectType,
            angle: distance,
            orb,
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

function getAspectStyle(aspectName: string): { color: string; dashArray?: string; opacity: number } {
  switch (aspectName.toLowerCase()) {
    case "conjunction":
      return { color: "hsl(330, 80%, 60%)", opacity: 0.7 };
    case "opposition":
      return { color: "hsl(0, 70%, 55%)", opacity: 0.5, dashArray: "6,3" };
    case "trine":
      return { color: "hsl(280, 70%, 60%)", opacity: 0.6 };
    case "square":
      return { color: "hsl(20, 80%, 50%)", opacity: 0.5, dashArray: "4,4" };
    case "sextile":
      return { color: "hsl(200, 70%, 55%)", opacity: 0.5 };
    default:
      return { color: "hsl(0, 0%, 50%)", dashArray: "4,4", opacity: 0.3 };
  }
}

const SynastryAspectLines = ({
  natalPlanets,
  partnerPlanets,
  center,
  natalPositions,
  partnerPositions,
}: SynastryAspectLinesProps) => {
  const aspects = useMemo(
    () => calculateSynastryAspects(natalPlanets, partnerPlanets),
    [natalPlanets, partnerPlanets]
  );

  return (
    <g className="synastry-aspect-lines">
      {aspects.map((aspect, index) => {
        const pos1 = natalPositions[aspect.point1] || { x: center, y: center };
        const partnerName = aspect.point2.replace("partner_", "");
        const pos2 = partnerPositions[partnerName] || { x: center, y: center };
        const style = getAspectStyle(aspect.type.name);

        return (
          <line
            key={`syn-${aspect.point1}-${partnerName}-${index}`}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke={style.color}
            strokeWidth={1.2}
            strokeOpacity={style.opacity}
            strokeDasharray={style.dashArray}
            className="pointer-events-none"
          />
        );
      })}
    </g>
  );
};

export default SynastryAspectLines;
