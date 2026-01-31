import { useEffect, useRef, useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, Layers, X, MapPin, Info } from "lucide-react";

interface AstrocartographyMapProps {
  chartData: NatalChartData;
  birthData: BirthData;
}

const ALL_PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"
];

const LINE_TYPES: LineType[] = ["MC", "IC", "ASC", "DSC"];

const AstrocartographyMap = ({ chartData, birthData }: AstrocartographyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lng: number;
    lat: number;
    nearbyLines: { planet: string; lineType: LineType; distance: number }[];
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

    // Parse timezone
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

  // Filter lines based on visibility settings
  const filteredLines = useMemo(() => {
    if (!acgData) return [];
    return acgData.lines.filter(
      (line) =>
        visiblePlanets.has(line.planet) && visibleLineTypes.has(line.lineType)
    );
  }, [acgData, visiblePlanets, visibleLineTypes]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token not found");
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 1.5,
      projection: "mercator",
    });

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    // Click handler for relocation
    map.current.on("click", (e) => {
      if (!acgData) return;

      const { lng, lat } = e.lngLat;
      const nearby = getRelocatedAngles(acgData.planets, acgData.gst, lat, lng);

      // Find lines within orb (300km ≈ 2.7° at equator)
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
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update lines when data or filters change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing layers and sources
    filteredLines.forEach((_, i) => {
      const layerId = `acg-line-${i}`;
      const sourceId = `acg-source-${i}`;
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });

    // Also clean up old layers that might exist
    for (let i = 0; i < 200; i++) {
      const layerId = `acg-line-${i}`;
      const sourceId = `acg-source-${i}`;
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    }

    // Add filtered lines
    filteredLines.forEach((line, i) => {
      const sourceId = `acg-source-${i}`;
      const layerId = `acg-line-${i}`;

      map.current?.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {
            planet: line.planet,
            lineType: line.lineType,
          },
          geometry: {
            type: "LineString",
            coordinates: line.coordinates,
          },
        },
      });

      const isDashed = line.lineType === "ASC" || line.lineType === "DSC";

      map.current?.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": line.color,
          "line-width": 2,
          "line-opacity": 0.8,
          ...(isDashed && { "line-dasharray": [4, 2] }),
        },
      });
    });
  }, [filteredLines, mapLoaded]);

  const togglePlanet = (planet: string) => {
    setVisiblePlanets((prev) => {
      const next = new Set(prev);
      if (next.has(planet)) {
        next.delete(planet);
      } else {
        next.add(planet);
      }
      return next;
    });
  };

  const toggleLineType = (type: LineType) => {
    setVisibleLineTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const applyCategory = (category: keyof typeof BENEFIT_CATEGORIES) => {
    setVisiblePlanets(new Set(BENEFIT_CATEGORIES[category]));
  };

  const showAllPlanets = () => {
    setVisiblePlanets(new Set(ALL_PLANETS));
  };

  return (
    <div className="relative w-full h-[600px] lg:h-[700px] rounded-xl overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="glass-panel border border-border/50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-sm">Quick Filters</h4>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyCategory("career")}
                    className="text-xs"
                  >
                    Career
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyCategory("love")}
                    className="text-xs"
                  >
                    Love
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyCategory("growth")}
                    className="text-xs"
                  >
                    Growth
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={showAllPlanets}
                    className="text-xs"
                  >
                    All
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Planets</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {ALL_PLANETS.map((planet) => (
                      <label
                        key={planet}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={visiblePlanets.has(planet)}
                          onCheckedChange={() => togglePlanet(planet)}
                        />
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PLANET_COLORS[planet] }}
                        />
                        <span className="text-sm">{planet}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Line Types</h4>
                <div className="space-y-2">
                  {LINE_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={visibleLineTypes.has(type)}
                        onCheckedChange={() => toggleLineType(type)}
                      />
                      <span className="text-sm font-mono">{LINE_SYMBOLS[type]}</span>
                      <span className="text-sm text-muted-foreground">
                        {type === "MC"
                          ? "Zenith"
                          : type === "IC"
                          ? "Nadir"
                          : type === "ASC"
                          ? "Rising"
                          : "Setting"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Legend Toggle */}
        <Button
          variant="secondary"
          size="sm"
          className="glass-panel border border-border/50"
          onClick={() => setShowLegend(!showLegend)}
        >
          <Layers className="h-4 w-4 mr-2" />
          Legend
        </Button>
      </div>

      {/* Legend Panel */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 z-10 glass-panel p-4 rounded-xl max-w-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Legend</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLegend(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Line Types</p>
                <div className="grid grid-cols-2 gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-white" />
                    <span>MC/IC (straight)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-white border-dashed border-t" />
                    <span>AS/DS (curved)</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Meaning</p>
                <div className="space-y-0.5 text-muted-foreground">
                  <p><span className="text-foreground font-mono">MC</span> — Career & reputation</p>
                  <p><span className="text-foreground font-mono">IC</span> — Home & roots</p>
                  <p><span className="text-foreground font-mono">AS</span> — Self-expression</p>
                  <p><span className="text-foreground font-mono">DS</span> — Relationships</p>
                </div>
              </div>

              <p className="text-muted-foreground italic">
                Click anywhere to see nearby planetary influences
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Info Panel */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 z-10 glass-panel p-4 rounded-xl max-w-md mx-auto"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">
                  {selectedLocation.lat.toFixed(2)}°, {selectedLocation.lng.toFixed(2)}°
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLocation(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedLocation.nearbyLines.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-2">
                  Planetary influences at this location:
                </p>
                {selectedLocation.nearbyLines.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PLANET_COLORS[line.planet] }}
                    />
                    <span>{line.planet}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {LINE_SYMBOLS[line.lineType]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({line.distance.toFixed(1)}° orb)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No major planetary lines nearby. This location is relatively neutral.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info tooltip */}
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
  );
};

export default AstrocartographyMap;
