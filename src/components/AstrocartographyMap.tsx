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

  const [mapboxToken, setMapboxToken] = useState<string | null>(
    import.meta.env.VITE_MAPBOX_TOKEN ?? null
  );
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch token from backend if it isn't present in the client build env.
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
        if (!res.ok) {
          throw new Error(
            data?.error
              ? `Map token fetch failed: ${data.error}`
              : `Map token fetch failed (${res.status})`
          );
        }

        if (!data?.token) {
          throw new Error("Map token fetch returned no token");
        }

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    if (!mapboxToken) {
      // Don’t set an error immediately; token may still be loading from backend.
      return;
    }

    mapboxgl.accessToken = mapboxToken;

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

    map.current.on("error", (e) => {
      // Mapbox errors can be opaque; give a readable message in UI.
      console.error("Mapbox error:", e);
      setMapError(
        "Map failed to load. This is usually an invalid Mapbox token or blocked Mapbox requests."
      );
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
            results.push({
              planet: p.planetName,
              lineType: "MC",
              distance: p.mcDistance,
            });
            results.push({
              planet: p.planetName,
              lineType: "IC",
              distance: p.mcDistance,
            });
          }
          if (p.ascDistance < orbDegrees) {
            results.push({
              planet: p.planetName,
              lineType: "ASC",
              distance: p.ascDistance,
            });
            results.push({
              planet: p.planetName,
              lineType: "DSC",
              distance: p.ascDistance,
            });
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
      map.current = null;
      setMapLoaded(false);
    };
  }, [mapboxToken]);

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

      {/* Map status overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel border border-border/50 rounded-xl p-4 max-w-sm w-[92%] text-center">
            <p className="text-sm font-medium">
              {mapError
                ? "Map unavailable"
                : mapboxToken
                ? "Loading map…"
                : "Preparing map…"}
            </p>
            {mapError ? (
              <p className="mt-1 text-xs text-muted-foreground">{mapError}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                If this doesn’t load, double-check your Mapbox token.
              </p>
            )}
          </div>
        </div>
      )}

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
            className="absolute top-4 right-4 z-10 glass-panel p-4 rounded-xl max-w-[320px] max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Astrocartography Guide</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLegend(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              {/* What is Astrocartography */}
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-medium">What is this?</span> These lines show where each planet in your birth chart was rising, setting, or at its highest/lowest point. Living or traveling near a line activates that planet's energy in your life.
                </p>
              </div>

              {/* Planet Colors */}
              <div>
                <p className="text-muted-foreground mb-2 font-medium">Planet Colors</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {ALL_PLANETS.map((planet) => (
                    <div key={planet} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: PLANET_COLORS[planet] }}
                      />
                      <span className="text-foreground">{planet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Types */}
              <div>
                <p className="text-muted-foreground mb-2 font-medium">Line Styles</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-foreground rounded" />
                    <span>Solid = MC/IC lines (vertical)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-foreground rounded" style={{ background: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 3px, transparent 3px, transparent 5px)' }} />
                    <span>Dashed = ASC/DSC lines (curved)</span>
                  </div>
                </div>
              </div>

              {/* Line Meanings */}
              <div>
                <p className="text-muted-foreground mb-2 font-medium">What Each Line Means</p>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="font-mono text-foreground">MC (Midheaven)</p>
                    <p className="text-muted-foreground">Career, public image, reputation. Where you may find professional success or recognition.</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="font-mono text-foreground">IC (Imum Coeli)</p>
                    <p className="text-muted-foreground">Home, family, roots. Where you may feel a deep sense of belonging or emotional connection.</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="font-mono text-foreground">ASC (Ascendant)</p>
                    <p className="text-muted-foreground">Self-expression, identity. Where you may feel most "yourself" or experience personal growth.</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="font-mono text-foreground">DSC (Descendant)</p>
                    <p className="text-muted-foreground">Relationships, partnerships. Where you may attract significant connections or collaborations.</p>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="p-2 rounded-lg bg-accent/30 border border-accent/40">
                <p className="font-medium text-foreground mb-1">💡 Quick Tips</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Click anywhere on the map to see nearby influences</li>
                  <li>Use filters to focus on specific planets or themes</li>
                  <li>The closer to a line, the stronger the effect</li>
                </ul>
              </div>
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
