import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { NatalChartData } from "@/data/natalChartData";
import { BirthData } from "@/components/intake/BirthDataForm";
import {
  calculateAstrocartography,
  getRelocatedAngles,
  ACGData,
  ACGLine,
  LineType,
  PLANET_COLORS,
  LINE_SYMBOLS,
  BENEFIT_CATEGORIES,
} from "@/lib/astrocartography";
import { getACGLineInterpretation, LINE_TYPE_MEANINGS } from "@/lib/astrocartography/interpretations";
import MapControls from "./astrocartography/MapControls";
import MapLegend from "./astrocartography/MapLegend";
import LocationPanel from "./astrocartography/LocationPanel";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, X } from "lucide-react";

interface AstrocartographyMapProps {
  chartData: NatalChartData;
  birthData: BirthData;
}

const ALL_PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"
];

const LINE_TYPES: LineType[] = ["MC", "IC", "ASC", "DSC"];

// Idle spin config
const IDLE_TIMEOUT = 5000; // Start spinning after 5s of no interaction
const SPIN_SPEED = 0.3; // Degrees per frame (slow, elegant)

const AstrocartographyMap = ({ chartData, birthData }: AstrocartographyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const spinAnimation = useRef<number | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lng: number;
    lat: number;
    nearbyLines: { planet: string; lineType: LineType; distance: number }[];
  } | null>(null);
  const [hoveredLine, setHoveredLine] = useState<{
    planet: string;
    lineType: LineType;
    x: number;
    y: number;
  } | null>(null);
  
  // Filters
  const [visiblePlanets, setVisiblePlanets] = useState<Set<string>>(new Set(ALL_PLANETS));
  const [visibleLineTypes, setVisibleLineTypes] = useState<Set<LineType>>(new Set(LINE_TYPES));
  const [showLegend, setShowLegend] = useState(true);

  // Calculate ACG data
  const acgData = useMemo<ACGData | null>(() => {
    if (!chartData || !birthData) return null;

    const [year, month, day] = birthData.birthDate.split("-").map(Number);
    const [hour, minute] = birthData.timeUnknown
      ? [12, 0]
      : birthData.birthTime.split(":").map(Number);

    const timezone = (() => {
      const raw = birthData.timezone?.trim();
      if (!raw) return 0;
      const match = raw.match(/^UTC\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i);
      if (!match) return 0;
      const sign = match[1] === "-" ? -1 : 1;
      const hours = Number(match[2] ?? 0);
      const minutes = Number(match[3] ?? 0);
      return sign * (hours + minutes / 60);
    })();

    return calculateAstrocartography(
      chartData,
      year,
      month,
      day,
      hour,
      minute,
      timezone
    );
  }, [chartData, birthData]);

  // Filter lines
  const filteredLines = useMemo(() => {
    if (!acgData) return [];
    return acgData.lines.filter(
      (line) => visiblePlanets.has(line.planet) && visibleLineTypes.has(line.lineType)
    );
  }, [acgData, visiblePlanets, visibleLineTypes]);

  const [mapboxToken, setMapboxToken] = useState<string | null>(
    import.meta.env.VITE_MAPBOX_TOKEN ?? null
  );
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch token from backend if needed
  useEffect(() => {
    if (mapboxToken) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            signal: controller.signal,
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Token fetch failed (${res.status})`);
        if (!data?.token) throw new Error("No token returned");
        setMapboxToken(String(data.token));
      } catch (e) {
        if (controller.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("Failed to fetch Mapbox token:", e);
        setMapError(msg);
      }
    })();
    return () => controller.abort();
  }, [mapboxToken]);

  // Start idle spin animation
  const startSpin = useCallback(() => {
    if (!map.current || spinAnimation.current) return;
    setIsSpinning(true);

    const spin = () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      map.current.setCenter([center.lng + SPIN_SPEED, center.lat]);
      spinAnimation.current = requestAnimationFrame(spin);
    };
    spin();
  }, []);

  // Stop spin animation
  const stopSpin = useCallback(() => {
    if (spinAnimation.current) {
      cancelAnimationFrame(spinAnimation.current);
      spinAnimation.current = null;
    }
    setIsSpinning(false);
  }, []);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    stopSpin();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(startSpin, IDLE_TIMEOUT);
  }, [startSpin, stopSpin]);

  // Initialize map with Globe projection and atmosphere
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 1.5,
      projection: "globe", // 3D Globe!
      pitch: 0,
    });

    map.current.on("style.load", () => {
      if (!map.current) return;

      // Configure atmosphere for cosmic feel
      map.current.setFog({
        color: "rgb(10, 0, 30)", // Deep space purple
        "high-color": "rgb(20, 10, 50)", // Upper atmosphere
        "horizon-blend": 0.02,
        "space-color": "rgb(5, 0, 15)", // Deep space
        "star-intensity": 0.8, // Visible stars!
      });
    });

    map.current.on("load", () => {
      setMapLoaded(true);
      resetIdleTimer();
    });

    map.current.on("error", (e) => {
      console.error("Mapbox error:", e);
      setMapError("Map failed to load. Check your Mapbox token.");
    });

    // User interaction stops spin
    map.current.on("mousedown", resetIdleTimer);
    map.current.on("touchstart", resetIdleTimer);
    map.current.on("wheel", resetIdleTimer);
    map.current.on("dragstart", resetIdleTimer);

    // Click handler for relocation with flyTo animation
    map.current.on("click", (e) => {
      if (!acgData || !map.current) return;

      const { lng, lat } = e.lngLat;

      // Fly to clicked location with cinematic animation
      map.current.flyTo({
        center: [lng, lat],
        zoom: 4,
        pitch: 20,
        duration: 2000,
        easing: (t) => 1 - Math.pow(1 - t, 3), // Ease out cubic
      });

      const nearby = getRelocatedAngles(acgData.planets, acgData.gst, lat, lng);
      const orbDegrees = 3;
      const nearbyLines = nearby
        .flatMap((p) => {
          const results: { planet: string; lineType: LineType; distance: number }[] = [];
          if (p.mcDistance < orbDegrees) {
            results.push({ planet: p.planetName, lineType: "MC", distance: p.mcDistance });
            results.push({ planet: p.planetName, lineType: "IC", distance: p.mcDistance });
          }
          if (p.ascDistance < orbDegrees) {
            results.push({ planet: p.planetName, lineType: "ASC", distance: p.ascDistance });
            results.push({ planet: p.planetName, lineType: "DSC", distance: p.ascDistance });
          }
          return results;
        })
        .filter((l) => visiblePlanets.has(l.planet) && visibleLineTypes.has(l.lineType))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      setSelectedLocation({ lng, lat, nearbyLines });
      resetIdleTimer();
    });

    return () => {
      stopSpin();
      if (idleTimer.current) clearTimeout(idleTimer.current);
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, [mapboxToken, acgData, resetIdleTimer, stopSpin, visiblePlanets, visibleLineTypes]);

  // Add glowing planetary lines with dual-layer effect
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clean up all existing layers
    for (let i = 0; i < 200; i++) {
      ["glow", "core"].forEach((type) => {
        const layerId = `acg-${type}-${i}`;
        const sourceId = `acg-source-${i}`;
        if (map.current?.getLayer(layerId)) map.current.removeLayer(layerId);
      });
      const sourceId = `acg-source-${i}`;
      if (map.current?.getSource(sourceId)) map.current.removeSource(sourceId);
    }

    // Add filtered lines with glow effect
    filteredLines.forEach((line, i) => {
      const sourceId = `acg-source-${i}`;
      const glowLayerId = `acg-glow-${i}`;
      const coreLayerId = `acg-core-${i}`;

      map.current?.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { planet: line.planet, lineType: line.lineType },
          geometry: { type: "LineString", coordinates: line.coordinates },
        },
      });

      const isDashed = line.lineType === "ASC" || line.lineType === "DSC";

      // Outer glow layer
      map.current?.addLayer({
        id: glowLayerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": line.color,
          "line-width": 12,
          "line-opacity": 0.15,
          "line-blur": 8,
        },
      });

      // Inner core layer (bright, thin)
      map.current?.addLayer({
        id: coreLayerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": line.color,
          "line-width": 2.5,
          "line-opacity": 0.9,
          ...(isDashed && { "line-dasharray": [4, 2] }),
        },
      });

      // Mouse events for hover tooltip
      map.current?.on("mouseenter", coreLayerId, (e) => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
        setHoveredLine({
          planet: line.planet,
          lineType: line.lineType,
          x: e.point.x,
          y: e.point.y,
        });
      });

      map.current?.on("mouseleave", coreLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
        setHoveredLine(null);
      });

      map.current?.on("mousemove", coreLayerId, (e) => {
        setHoveredLine((prev) =>
          prev
            ? { ...prev, x: e.point.x, y: e.point.y }
            : {
                planet: line.planet,
                lineType: line.lineType,
                x: e.point.x,
                y: e.point.y,
              }
        );
      });
    });
  }, [filteredLines, mapLoaded]);

  const togglePlanet = (planet: string) => {
    setVisiblePlanets((prev) => {
      const next = new Set(prev);
      if (next.has(planet)) next.delete(planet);
      else next.add(planet);
      return next;
    });
  };

  const toggleLineType = (type: LineType) => {
    setVisibleLineTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const applyCategory = (category: keyof typeof BENEFIT_CATEGORIES) => {
    setVisiblePlanets(new Set(BENEFIT_CATEGORIES[category]));
  };

  const showAllPlanets = () => setVisiblePlanets(new Set(ALL_PLANETS));

  const resetView = useCallback(() => {
    if (!map.current) return;
    map.current.flyTo({
      center: [0, 20],
      zoom: 1.5,
      pitch: 0,
      duration: 1500,
    });
    setSelectedLocation(null);
  }, []);

  // Get line interpretation for hovered line
  const hoveredLineInterpretation = useMemo(() => {
    if (!hoveredLine) return null;
    return getACGLineInterpretation(hoveredLine.planet, hoveredLine.lineType);
  }, [hoveredLine]);

  return (
    <div className="relative w-full flex flex-col">
      {/* Map Container */}
      <div className="relative w-full h-[600px] lg:h-[700px] rounded-xl overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Loading/Error overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 z-[1] pointer-events-none">
            <div className="absolute inset-0 bg-background/40" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel border border-border/50 rounded-xl p-4 max-w-sm w-[92%] text-center">
              <p className="text-sm font-medium">
                {mapError ? "Map unavailable" : mapboxToken ? "Loading celestial map…" : "Preparing cosmos…"}
              </p>
              {mapError && <p className="mt-1 text-xs text-muted-foreground">{mapError}</p>}
            </div>
          </div>
        )}

        {/* Spin indicator */}
        <AnimatePresence>
          {isSpinning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs text-primary backdrop-blur-sm"
            >
              ✨ Auto-rotating • Click to explore
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <MapControls
          allPlanets={ALL_PLANETS}
          lineTypes={LINE_TYPES}
          visiblePlanets={visiblePlanets}
          visibleLineTypes={visibleLineTypes}
          showLegend={showLegend}
          onTogglePlanet={togglePlanet}
          onToggleLineType={toggleLineType}
          onApplyCategory={applyCategory}
          onShowAll={showAllPlanets}
          onToggleLegend={() => setShowLegend(!showLegend)}
          onResetView={resetView}
        />

        {/* Legend */}
        <AnimatePresence>
          {showLegend && (
            <MapLegend
              allPlanets={ALL_PLANETS}
              onClose={() => setShowLegend(false)}
            />
          )}
        </AnimatePresence>

        {/* Location Panel */}
        <AnimatePresence>
          {selectedLocation && (
            <LocationPanel
              location={selectedLocation}
              onClose={() => setSelectedLocation(null)}
            />
          )}
        </AnimatePresence>

        {/* Line Hover Tooltip */}
        <AnimatePresence>
          {hoveredLine && hoveredLineInterpretation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 pointer-events-none"
              style={{
                left: Math.min(hoveredLine.x + 16, window.innerWidth - 320),
                top: Math.max(hoveredLine.y - 100, 16),
              }}
            >
              <div className="w-72 glass-panel border border-border/50 rounded-lg p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xl"
                    style={{ color: PLANET_COLORS[hoveredLine.planet] }}
                  >
                    {hoveredLine.planet === "Sun" ? "☉" :
                     hoveredLine.planet === "Moon" ? "☽" :
                     hoveredLine.planet === "Mercury" ? "☿" :
                     hoveredLine.planet === "Venus" ? "♀" :
                     hoveredLine.planet === "Mars" ? "♂" :
                     hoveredLine.planet === "Jupiter" ? "♃" :
                     hoveredLine.planet === "Saturn" ? "♄" :
                     hoveredLine.planet === "Uranus" ? "♅" :
                     hoveredLine.planet === "Neptune" ? "♆" :
                     hoveredLine.planet === "Pluto" ? "♇" :
                     hoveredLine.planet === "Chiron" ? "⚷" : "?"}
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm">{hoveredLineInterpretation.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {LINE_TYPE_MEANINGS[hoveredLine.lineType]?.keyword}
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-foreground/90 leading-relaxed mb-3">
                  {hoveredLineInterpretation.summary}
                </p>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-green-400 mb-1">✓ Benefits</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {hoveredLineInterpretation.benefits.slice(0, 2).map((b, i) => (
                        <li key={i}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-400 mb-1">⚡ Challenges</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {hoveredLineInterpretation.challenges.slice(0, 2).map((c, i) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute bottom-4 right-4 z-10">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="glass-panel border border-border/50 h-8 w-8"
              >
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-2 text-sm">
                <h4 className="font-medium">About Astrocartography</h4>
                <p className="text-muted-foreground text-xs">
                  Astrocartography maps where each planet in your natal chart was 
                  angular (rising, setting, culminating) at the moment of your birth.
                </p>
                <p className="text-muted-foreground text-xs">
                  Living near or traveling to these lines can activate that planet's 
                  energy in your life. The closer to the line, the stronger the effect.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default AstrocartographyMap;
