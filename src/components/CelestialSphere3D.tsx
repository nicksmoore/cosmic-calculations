import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Text, Html, Ring } from "@react-three/drei";
import * as THREE from "three";
import { zodiacSigns, Planet, NatalChartData, House } from "@/data/natalChartData";
import { HouseSystem } from "./ChartDashboard";

interface CelestialSphere3DProps {
  onSelectPlanet: (planet: Planet | null) => void;
  selectedPlanet: Planet | null;
  houseSystem: HouseSystem;
  chartData: NatalChartData;
}

// Aspect definitions with orbs
const ASPECT_DEFINITIONS: Record<string, { symbol: string; angle: number; color: string; orb: number }> = {
  conjunction: { symbol: "☌", angle: 0, color: "#FFD700", orb: 8 },
  opposition: { symbol: "☍", angle: 180, color: "#FF4444", orb: 8 },
  trine: { symbol: "△", angle: 120, color: "#4169E1", orb: 8 },
  square: { symbol: "□", angle: 90, color: "#FF4500", orb: 8 },
  sextile: { symbol: "⚹", angle: 60, color: "#32CD32", orb: 6 },
  quincunx: { symbol: "⚻", angle: 150, color: "#9932CC", orb: 3 },
};

// Planet colors
const PLANET_COLORS: Record<string, string> = {
  Sun: "#FFD700", Moon: "#E8E8E8", Mercury: "#87CEEB", Venus: "#FF69B4",
  Mars: "#FF4500", Jupiter: "#FFA500", Saturn: "#DAA520", 
  Uranus: "#00CED1", Neptune: "#4169E1", Pluto: "#9932CC",
};

// Element colors
const ELEMENT_COLORS: Record<string, string> = {
  Fire: "#FF6B35", Earth: "#4A7C59", Air: "#7EC8E3", Water: "#5C4B9B",
};

// Convert longitude to 3D position on sphere
// The Ascendant is placed on the LEFT (west) of the chart
const longitudeToPosition = (longitude: number, ascendantLongitude: number, radius: number, elevation: number = 0) => {
  // Rotate so Ascendant is at 180° (pointing left in traditional chart orientation)
  const adjustedLongitude = longitude - ascendantLongitude + 180;
  const theta = (adjustedLongitude * Math.PI) / 180;
  const phi = (elevation * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(theta) * Math.cos(phi),
    radius * Math.sin(phi),
    -radius * Math.sin(theta) * Math.cos(phi)
  );
};

// Format degree display
const formatDegree = (degree: number): string => {
  const deg = Math.floor(degree);
  const min = Math.floor((degree - deg) * 60);
  return `${deg}°${min.toString().padStart(2, '0')}'`;
};

// ============= PLANET ORB COMPONENT =============
const PlanetOrb = ({ 
  planet, 
  position, 
  isSelected, 
  onClick 
}: { 
  planet: Planet; 
  position: THREE.Vector3; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = PLANET_COLORS[planet.name] || "#FFFFFF";

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 0.5 + position.x) * 0.012;
      if (isSelected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
        meshRef.current.scale.setScalar(scale);
      } else {
        meshRef.current.scale.setScalar(hovered ? 1.3 : 1);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.055, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1 : hovered ? 0.6 : 0.4}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      
      <Ring args={[0.07, 0.10, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.2} side={THREE.DoubleSide} />
      </Ring>

      {(hovered || isSelected) && (
        <Html position={[0, 0.16, 0]} center style={{ pointerEvents: "none" }}>
          <div className="px-3 py-2 rounded-lg bg-card/95 backdrop-blur-md border border-border shadow-xl text-xs whitespace-nowrap min-w-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl" style={{ color }}>{planet.symbol}</span>
              <span className="font-serif font-medium text-foreground">{planet.name}</span>
              {planet.isRetrograde && <span className="text-orange-400 text-[10px]">Rx</span>}
            </div>
            <div className="text-muted-foreground font-mono text-[10px]">
              {formatDegree(planet.degree)} {planet.signSymbol} {planet.sign}
            </div>
            <div className="text-muted-foreground/70 text-[10px] mt-0.5">
              House {planet.house}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// ============= ZODIAC WHEEL (outer ring) =============
const ZodiacWheel = ({ radius, ascendantLongitude }: { radius: number; ascendantLongitude: number }) => {
  return (
    <group>
      {zodiacSigns.map((sign, i) => {
        const signStart = sign.startDegree;
        const signEnd = signStart + 30;
        
        // Convert to adjusted positions
        const startPos = longitudeToPosition(signStart, ascendantLongitude, radius, 0);
        const endPos = longitudeToPosition(signEnd, ascendantLongitude, radius, 0);
        const midPos = longitudeToPosition(signStart + 15, ascendantLongitude, radius + 0.08, 0);
        const labelPos = longitudeToPosition(signStart + 15, ascendantLongitude, radius + 0.20, 0);
        
        // Arc points
        const points: THREE.Vector3[] = [];
        for (let j = 0; j <= 15; j++) {
          const deg = signStart + (30 * j / 15);
          points.push(longitudeToPosition(deg, ascendantLongitude, radius, 0));
        }

        return (
          <group key={sign.name}>
            <Line
              points={points}
              color={ELEMENT_COLORS[sign.element]}
              lineWidth={4}
              transparent
              opacity={0.85}
            />
            
            {/* Sign glyph */}
            <Text
              position={midPos}
              fontSize={0.11}
              color={ELEMENT_COLORS[sign.element]}
              anchorX="center"
              anchorY="middle"
            >
              {sign.symbol}
            </Text>
            
            {/* Sign name (smaller, further out) */}
            <Text
              position={labelPos}
              fontSize={0.045}
              color="#777777"
              anchorX="center"
              anchorY="middle"
            >
              {sign.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

// ============= HOUSE CUSPS =============
const HouseCusps = ({ 
  radius, 
  houses, 
  ascendantLongitude 
}: { 
  radius: number; 
  houses: House[];
  ascendantLongitude: number;
}) => {
  return (
    <group>
      {houses.map((house, i) => {
        const cuspPos = longitudeToPosition(house.cusp, ascendantLongitude, 0.25, 0);
        const outerPos = longitudeToPosition(house.cusp, ascendantLongitude, radius - 0.02, 0);
        
        // House number label position (middle of house)
        const nextCusp = houses[(i + 1) % 12].cusp;
        let midCusp = (house.cusp + nextCusp) / 2;
        if (nextCusp < house.cusp) midCusp = (house.cusp + nextCusp + 360) / 2;
        const labelPos = longitudeToPosition(midCusp, ascendantLongitude, 0.55, 0);

        const isAngular = [1, 4, 7, 10].includes(house.number);

        return (
          <group key={house.number}>
            {/* House cusp line */}
            <Line
              points={[cuspPos, outerPos]}
              color={isAngular ? "#8B7EB8" : "#4B3D7A"}
              lineWidth={isAngular ? 2 : 1}
              transparent
              opacity={isAngular ? 0.8 : 0.4}
            />
            
            {/* House number */}
            <Text
              position={labelPos}
              fontSize={0.07}
              color="#9B8FC8"
              anchorX="center"
              anchorY="middle"
            >
              {house.number}
            </Text>
            
            {/* Sign on cusp (small) */}
            <Html position={[outerPos.x * 0.85, 0.02, outerPos.z * 0.85]} center style={{ pointerEvents: "none" }}>
              <span className="text-[8px] text-muted-foreground/60">{house.signSymbol}</span>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// ============= ANGLES (AC/IC/DC/MC) =============
const ChartAngles = ({ 
  radius, 
  angles, 
  ascendantLongitude 
}: { 
  radius: number; 
  angles: NatalChartData["angles"];
  ascendantLongitude: number;
}) => {
  const angleData = [
    { key: "AC", label: "Ascendant", data: angles.ascendant, color: "#FF6B6B" },
    { key: "IC", label: "Imum Coeli", data: angles.imumCoeli, color: "#4ECDC4" },
    { key: "DC", label: "Descendant", data: angles.descendant, color: "#FF6B6B" },
    { key: "MC", label: "Medium Coeli", data: angles.midheaven, color: "#FFE66D" },
  ];

  return (
    <group>
      {angleData.map(({ key, label, data, color }) => {
        const innerPos = longitudeToPosition(data.longitude, ascendantLongitude, 0.15, 0);
        const outerPos = longitudeToPosition(data.longitude, ascendantLongitude, radius + 0.30, 0);
        const labelPos = longitudeToPosition(data.longitude, ascendantLongitude, radius + 0.42, 0);

        return (
          <group key={key}>
            <Line
              points={[innerPos, outerPos]}
              color={color}
              lineWidth={3}
              transparent
              opacity={0.95}
            />
            
            <Html position={[labelPos.x, 0.05, labelPos.z]} center>
              <div 
                className="px-2 py-1 rounded font-bold text-xs"
                style={{ 
                  backgroundColor: `${color}25`, 
                  color: color,
                  border: `1px solid ${color}60`
                }}
              >
                <div>{key}</div>
                <div className="text-[9px] font-normal opacity-80">
                  {formatDegree(data.degree)} {data.signSymbol}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// ============= ASPECT LINES =============
const AspectLines = ({ 
  planets,
  ascendantLongitude,
  planetRadius,
}: { 
  planets: Planet[];
  ascendantLongitude: number;
  planetRadius: number;
}) => {
  const aspects = useMemo(() => {
    const lines: { start: THREE.Vector3; end: THREE.Vector3; color: string; symbol: string; type: string }[] = [];
    
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const p1 = planets[i];
        const p2 = planets[j];
        
        let angularDist = Math.abs(p1.longitude - p2.longitude);
        if (angularDist > 180) angularDist = 360 - angularDist;
        
        for (const [type, data] of Object.entries(ASPECT_DEFINITIONS)) {
          if (Math.abs(angularDist - data.angle) <= data.orb) {
            const pos1 = longitudeToPosition(p1.longitude, ascendantLongitude, planetRadius, (p1.house % 4) * 3);
            const pos2 = longitudeToPosition(p2.longitude, ascendantLongitude, planetRadius, (p2.house % 4) * 3);
            
            lines.push({
              start: pos1,
              end: pos2,
              color: data.color,
              symbol: data.symbol,
              type,
            });
            break;
          }
        }
      }
    }
    return lines;
  }, [planets, ascendantLongitude, planetRadius]);

  return (
    <group>
      {aspects.map((aspect, i) => {
        const midpoint = new THREE.Vector3().addVectors(aspect.start, aspect.end).multiplyScalar(0.5);
        
        return (
          <group key={i}>
            <Line
              points={[aspect.start, new THREE.Vector3(0, 0, 0), aspect.end]}
              color={aspect.color}
              lineWidth={aspect.type === "opposition" || aspect.type === "square" ? 1.5 : 1}
              transparent
              opacity={0.45}
              dashed={aspect.type === "sextile" || aspect.type === "quincunx"}
              dashSize={0.04}
              gapSize={0.02}
            />
          </group>
        );
      })}
    </group>
  );
};

// ============= GLASS SPHERE =============
const GlassSphere = ({ radius }: { radius: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshPhysicalMaterial
        color="#1a1040"
        transparent
        opacity={0.06}
        metalness={0.1}
        roughness={0}
        transmission={0.95}
        thickness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// ============= MAIN SCENE =============
const Scene = ({ 
  onSelectPlanet, 
  selectedPlanet, 
  houseSystem,
  chartData,
}: CelestialSphere3DProps) => {
  const sphereRadius = 1.5;
  const planetRadius = 1.1;
  const ascendantLongitude = chartData.angles.ascendant.longitude;

  const planetPositions = useMemo(() => {
    return chartData.planets.map((planet) => {
      // Slight elevation variation based on house for visual separation
      const elevation = ((planet.house - 1) % 4) * 4 - 6;
      
      return {
        planet,
        position: longitudeToPosition(planet.longitude, ascendantLongitude, planetRadius, elevation),
      };
    });
  }, [chartData, ascendantLongitude]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 10, 10]} intensity={0.7} color="#FFE4B5" />
      <pointLight position={[-10, -10, -10]} intensity={0.35} color="#6B4C9A" />
      <pointLight position={[0, 12, 0]} intensity={0.4} color="#FFFFFF" />

      {/* Glass sphere */}
      <GlassSphere radius={sphereRadius} />

      {/* House cusps */}
      <HouseCusps radius={sphereRadius} houses={chartData.houses} ascendantLongitude={ascendantLongitude} />

      {/* Zodiac wheel */}
      <ZodiacWheel radius={sphereRadius + 0.02} ascendantLongitude={ascendantLongitude} />

      {/* Chart angles */}
      <ChartAngles radius={sphereRadius} angles={chartData.angles} ascendantLongitude={ascendantLongitude} />

      {/* Aspect lines */}
      <AspectLines 
        planets={chartData.planets} 
        ascendantLongitude={ascendantLongitude}
        planetRadius={planetRadius}
      />

      {/* Planets */}
      {planetPositions.map(({ planet, position }) => (
        <PlanetOrb
          key={planet.name}
          planet={planet}
          position={position}
          isSelected={selectedPlanet?.name === planet.name}
          onClick={() => onSelectPlanet(selectedPlanet?.name === planet.name ? null : planet)}
        />
      ))}

      {/* Center core */}
      <mesh>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color="#0f0a20" emissive="#4B0082" emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.06, 32, 32]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.35} />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={6}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.15}
      />
    </>
  );
};

// ============= MAIN COMPONENT =============
const CelestialSphere3D = (props: CelestialSphere3DProps) => {
  return (
    <div className="relative w-full h-[550px] md:h-[650px] rounded-xl overflow-hidden glass-panel">
      <Canvas
        camera={{ position: [0, 1.8, 3.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene {...props} />
      </Canvas>
      
      {/* Legend - Aspects */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 rounded-lg text-xs space-y-1.5">
        <div className="text-muted-foreground font-medium mb-2">Aspects</div>
        {Object.entries(ASPECT_DEFINITIONS).slice(0, 5).map(([name, data]) => (
          <div key={name} className="flex items-center gap-2">
            <span style={{ color: data.color }} className="text-sm w-4">{data.symbol}</span>
            <span className="text-muted-foreground capitalize text-[10px]">{name}</span>
          </div>
        ))}
      </div>
      
      {/* Angles info */}
      <div className="absolute bottom-4 right-4 glass-panel p-3 rounded-lg text-xs space-y-1">
        <div className="text-muted-foreground font-medium mb-2">Chart Angles</div>
        <div className="flex items-center gap-2">
          <span className="text-[#FF6B6B] font-bold">AC</span>
          <span className="text-muted-foreground">
            {formatDegree(props.chartData.angles.ascendant.degree)} {props.chartData.angles.ascendant.signSymbol}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#FFE66D] font-bold">MC</span>
          <span className="text-muted-foreground">
            {formatDegree(props.chartData.angles.midheaven.degree)} {props.chartData.angles.midheaven.signSymbol}
          </span>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute top-4 right-4 glass-panel px-3 py-2 rounded-lg text-xs text-muted-foreground">
        Drag to rotate • Scroll to zoom • Click planets
      </div>
      
      {/* Chart info */}
      <div className="absolute top-4 left-4 glass-panel px-3 py-2 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rising:</span>
          <span className="text-foreground font-medium">
            {props.chartData.angles.ascendant.signSymbol} {props.chartData.angles.ascendant.sign}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-muted-foreground">System:</span>
          <span className="text-foreground capitalize">{props.houseSystem}</span>
        </div>
      </div>
    </div>
  );
};

export default CelestialSphere3D;
