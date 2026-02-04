import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { zodiacSigns, Planet, House, NatalChartData } from "@/data/natalChartData";
import { HouseSystem } from "./ChartDashboard";
import AspectLines from "./AspectLines";
import { useIsMobile } from "@/hooks/use-mobile";
import { toRomanNumeral } from "@/lib/utils/romanNumerals";

interface NatalChartWheelProps {
  onSelectPlanet: (planet: Planet | null) => void;
  onSelectHouse: (house: House | null) => void;
  selectedPlanet: Planet | null;
  selectedHouse: House | null;
  houseSystem: HouseSystem;
  chartData: NatalChartData;
}

const NatalChartWheel = ({ 
  onSelectPlanet, 
  onSelectHouse, 
  selectedPlanet, 
  selectedHouse,
  houseSystem,
  chartData,
}: NatalChartWheelProps) => {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const isMobile = useIsMobile();

  // Use smaller size on mobile for better fit
  const size = isMobile ? 360 : 800;
  const center = size / 2;
  const outerRadius = size / 2 - (isMobile ? 10 : 20);
  const zodiacInnerRadius = outerRadius - (isMobile ? 32 : 60);
  // House number ring sits just inside the zodiac ring
  const houseNumberOuterRadius = zodiacInnerRadius - (isMobile ? 4 : 8);
  const houseNumberInnerRadius = houseNumberOuterRadius - (isMobile ? 20 : 36);
  // House wedges fill the remaining space
  const houseOuterRadius = houseNumberInnerRadius - (isMobile ? 2 : 4);
  const houseInnerRadius = isMobile ? 45 : 90;

  // Rotate the whole wheel so the Ascendant is on the left (180°), matching the 3D orientation.
  const rotationDeg = useMemo(() => {
    const asc = chartData.angles.ascendant.longitude;
    return 180 - asc;
  }, [chartData.angles.ascendant.longitude]);

  const getSignColor = (element: string) => {
    switch (element) {
      case "Fire": return "hsl(15, 85%, 55%)";
      case "Earth": return "hsl(45, 60%, 40%)";
      case "Air": return "hsl(200, 70%, 55%)";
      case "Water": return "hsl(260, 60%, 50%)";
      default: return "hsl(var(--muted))";
    }
  };

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = polarToCartesian(startAngle, outerRadius);
    const end = polarToCartesian(endAngle, outerRadius);
    const innerStart = polarToCartesian(endAngle, innerRadius);
    const innerEnd = polarToCartesian(startAngle, innerRadius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
      `Z`,
    ].join(" ");
  };

  // Group planets by proximity and offset overlapping ones
  const planetPositions = useMemo(() => {
    const baseRadius = (houseOuterRadius + houseInnerRadius) / 2 + (isMobile ? 10 : 20);
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Sort planets by longitude
    const sortedPlanets = [...chartData.planets].sort((a, b) => a.longitude - b.longitude);
    
    // Track used positions to avoid overlap - use multiple rings
    const usedPositions: { angle: number; radius: number }[] = [];
    const minAngleSeparation = isMobile ? 15 : 10; // degrees - tighter for larger chart
    const ringOffsets = isMobile ? [0, -20, 20, -40, 40] : [0, -40, 40, -80, 80, -120]; // Fewer rings on mobile
    
    sortedPlanets.forEach((planet) => {
      let finalRadius = baseRadius;
      const finalAngle = planet.longitude;
      
      // Find a ring that doesn't overlap
      for (const offset of ringOffsets) {
        const testRadius = baseRadius + offset;
        let hasOverlap = false;
        
        for (const used of usedPositions) {
          const angleDiff = Math.abs(finalAngle - used.angle);
          const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);
          
          if (normalizedDiff < minAngleSeparation && Math.abs(testRadius - used.radius) < (isMobile ? 15 : 30)) {
            hasOverlap = true;
            break;
          }
        }
        
        if (!hasOverlap) {
          finalRadius = testRadius;
          break;
        }
      }
      
      usedPositions.push({ angle: finalAngle, radius: finalRadius });
      
      const rad = ((finalAngle - 90) * Math.PI) / 180;
      positions[planet.name] = {
        x: center + finalRadius * Math.cos(rad),
        y: center + finalRadius * Math.sin(rad),
      };
    });
    
    return positions;
  }, [chartData.planets, center, houseOuterRadius, houseInnerRadius, isMobile]);

  const getPlanetPosition = (planetName: string) => {
    return planetPositions[planetName] || { x: center, y: center };
  };

  // Houses go counterclockwise in traditional astrology (1→2→3 moves right to left visually)
  // The wheel is rotated so Ascendant is on the left, so we need to reverse the arc direction
  const getHouseAngles = (houseNumber: number) => {
    const houses = chartData.houses;
    const idx = houses.findIndex((h) => h.number === houseNumber);
    const current = houses[idx];
    const next = houses[(idx + 1) % houses.length];
    const start = current?.cusp ?? 0;
    let end = next?.cusp ?? ((start + 30) % 360);
    // Ensure end is ahead of start for arc calculation.
    if (end <= start) end += 360;
    // Reverse the angles so houses progress counterclockwise (right to left visually)
    return { startAngle: 360 - end, endAngle: 360 - start };
  };

  return (
    <div className="flex justify-center items-center w-full">
      <motion.svg 
        width="100%" 
        height="auto"
        viewBox={`0 0 ${size} ${size}`} 
        className="drop-shadow-2xl max-w-full"
        style={{ maxWidth: size, maxHeight: size }}
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8 }}
      >
        <defs>
          <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="goldGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="hsl(45, 100%, 50%)" floodOpacity="0.6" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="nebulaGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(275, 80%, 30%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(275, 60%, 15%)" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* Background with nebula effect */}
        <circle cx={center} cy={center} r={outerRadius} fill="url(#nebulaGrad)" />
        <circle 
          cx={center} 
          cy={center} 
          r={outerRadius} 
          fill="none" 
          stroke="hsl(275, 40%, 30%)" 
          strokeWidth="2" 
        />

        <g transform={`rotate(${rotationDeg} ${center} ${center})`}>
          {/* Zodiac signs outer ring */}
          {zodiacSigns.map((sign, i) => {
            const startAngle = i * 30;
            const endAngle = (i + 1) * 30;
            const midAngle = startAngle + 15;
            const labelPos = polarToCartesian(midAngle, (outerRadius + zodiacInnerRadius) / 2);

            return (
              <g key={sign.name}>
                <path
                  d={describeArc(startAngle, endAngle, zodiacInnerRadius, outerRadius)}
                  fill={getSignColor(sign.element)}
                  fillOpacity={0.25}
                  stroke="hsl(275, 30%, 25%)"
                  strokeWidth="1"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground"
                  style={{ fontSize: isMobile ? "12px" : "18px" }}
                >
                  {sign.symbol}
                </text>
              </g>
            );
          })}

          {/* Inner circle background */}
          <circle 
            cx={center} 
            cy={center} 
            r={houseOuterRadius} 
            fill="hsl(235, 25%, 8%)" 
            stroke="hsl(275, 30%, 25%)" 
            strokeWidth="1" 
          />

          {/* House number ring - similar to zodiac ring */}
          {chartData.houses.map((house) => {
            const { startAngle, endAngle } = getHouseAngles(house.number);
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const labelPos = polarToCartesian(midAngle, (houseNumberOuterRadius + houseNumberInnerRadius) / 2);

            return (
              <g key={`house-number-${house.number}`}>
                <path
                  d={describeArc(startAngle, endAngle, houseNumberInnerRadius, houseNumberOuterRadius)}
                  fill="hsl(235, 25%, 12%)"
                  fillOpacity={0.6}
                  stroke="hsl(275, 30%, 25%)"
                  strokeWidth="1"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground font-medium"
                  style={{ fontSize: isMobile ? "8px" : "12px" }}
                >
                  {toRomanNumeral(house.number)}
                </text>
              </g>
            );
          })}

          {/* House wedge segments for selection/interaction */}
          {chartData.houses.map((house) => {
            const { startAngle, endAngle } = getHouseAngles(house.number);
            const isSelected = selectedHouse?.number === house.number;
            const isHovered = hoveredHouse === house.number;

            return (
              <motion.path
                key={`house-wedge-${house.number}`}
                d={describeArc(startAngle, endAngle, houseInnerRadius, houseOuterRadius)}
                fill={isSelected ? "hsl(45, 100%, 50%)" : isHovered ? "hsl(275, 80%, 40%)" : "transparent"}
                fillOpacity={isSelected ? 0.25 : isHovered ? 0.15 : 0}
                stroke="hsl(275, 30%, 25%)"
                strokeWidth="1"
                className="cursor-pointer"
                onClick={() => onSelectHouse(isSelected ? null : house)}
                onMouseEnter={() => setHoveredHouse(house.number)}
                onMouseLeave={() => setHoveredHouse(null)}
                initial={false}
                animate={{ d: describeArc(startAngle, endAngle, houseInnerRadius, houseOuterRadius) }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            );
          })}

          {/* Center circle */}
          <circle 
            cx={center} 
            cy={center} 
            r={houseInnerRadius} 
            fill="hsl(235, 25%, 7%)" 
            stroke="hsl(275, 40%, 35%)" 
            strokeWidth="2" 
          />

          {/* Aspect Lines - drawn in center area */}
          <AspectLines 
            planets={chartData.planets}
            center={center}
            innerRadius={houseInnerRadius}
            planetPositions={planetPositions}
          />

        {/* Planets positioned by calculated longitude with overlap prevention */}
        {chartData.planets.map((planet) => {
          const pos = getPlanetPosition(planet.name);
          const isSelected = selectedPlanet?.name === planet.name;
          const isHovered = hoveredPlanet === planet.name;
          
          // Calculate degree label position (slightly offset from planet)
          const degreeLabel = `${Math.floor(planet.degree)}°${planet.signSymbol}`;
          const retroLabel = planet.isRetrograde ? " Rx" : "";

          return (
              <motion.g
                key={planet.name}
                className="cursor-pointer"
                onClick={() => onSelectPlanet(isSelected ? null : planet)}
                onMouseEnter={() => setHoveredPlanet(planet.name)}
                onMouseLeave={() => setHoveredPlanet(null)}
                filter={isSelected ? "url(#goldGlow)" : isHovered ? "url(#planetGlow)" : undefined}
                initial={false}
                animate={{ 
                  x: pos.x - center,
                  y: pos.y - center,
                }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                style={{ transformOrigin: `${center}px ${center}px` }}
              >
                <motion.circle
                  cx={center}
                  cy={center}
                  r={isSelected || isHovered ? (isMobile ? 14 : 20) : (isMobile ? 11 : 16)}
                  fill={isSelected ? "hsl(45, 100%, 50%)" : "hsl(235, 20%, 15%)"}
                  stroke={isSelected ? "hsl(45, 100%, 60%)" : isHovered ? "hsl(275, 80%, 50%)" : "hsl(275, 40%, 35%)"}
                  strokeWidth={isSelected || isHovered ? 2 : 1.5}
                  initial={false}
                  animate={{ r: isSelected || isHovered ? (isMobile ? 14 : 20) : (isMobile ? 11 : 16) }}
                  transition={{ duration: 0.2 }}
                />
                <text
                  x={center}
                  y={center}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={isSelected ? "fill-accent-foreground" : "fill-foreground"}
                  style={{ fontSize: isMobile ? "10px" : "15px" }}
                >
                  {planet.symbol}
                </text>
                {/* Degree label below planet - hide on mobile for clarity */}
                {!isMobile && (
                  <text
                    x={center}
                    y={center + 30}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: "9px", fontWeight: 500 }}
                  >
                    {degreeLabel}{retroLabel}
                  </text>
                )}
              </motion.g>
            );
          })}
        </g>

        {/* Center text */}
        <text
          x={center}
          y={center - (isMobile ? 6 : 12)}
          textAnchor="middle"
          className="fill-foreground font-serif"
          style={{ fontSize: isMobile ? "10px" : "14px", fontWeight: 500 }}
        >
          {houseSystem.charAt(0).toUpperCase() + houseSystem.slice(1).replace("-", " ")}
        </text>
        <text
          x={center}
          y={center + (isMobile ? 6 : 12)}
          textAnchor="middle"
          className="fill-accent"
          style={{ fontSize: isMobile ? "8px" : "11px", fontWeight: 500 }}
        >
          House System
        </text>
      </motion.svg>
    </div>
  );
};

export default NatalChartWheel;
