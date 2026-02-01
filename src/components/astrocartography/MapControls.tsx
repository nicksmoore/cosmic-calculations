import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, Layers, RotateCcw } from "lucide-react";
import { LineType, PLANET_COLORS, LINE_SYMBOLS, BENEFIT_CATEGORIES } from "@/lib/astrocartography";

interface MapControlsProps {
  allPlanets: string[];
  lineTypes: LineType[];
  visiblePlanets: Set<string>;
  visibleLineTypes: Set<LineType>;
  showLegend: boolean;
  onTogglePlanet: (planet: string) => void;
  onToggleLineType: (type: LineType) => void;
  onApplyCategory: (category: keyof typeof BENEFIT_CATEGORIES) => void;
  onShowAll: () => void;
  onToggleLegend: () => void;
  onResetView: () => void;
}

const MapControls = ({
  allPlanets,
  lineTypes,
  visiblePlanets,
  visibleLineTypes,
  showLegend,
  onTogglePlanet,
  onToggleLineType,
  onApplyCategory,
  onShowAll,
  onToggleLegend,
  onResetView,
}: MapControlsProps) => {
  return (
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
                  onClick={() => onApplyCategory("career")}
                  className="text-xs"
                >
                  Career
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApplyCategory("love")}
                  className="text-xs"
                >
                  Love
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApplyCategory("growth")}
                  className="text-xs"
                >
                  Growth
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onShowAll}
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
                  {allPlanets.map((planet) => (
                    <label
                      key={planet}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={visiblePlanets.has(planet)}
                        onCheckedChange={() => onTogglePlanet(planet)}
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
                {lineTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={visibleLineTypes.has(type)}
                      onCheckedChange={() => onToggleLineType(type)}
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
        onClick={onToggleLegend}
      >
        <Layers className="h-4 w-4 mr-2" />
        Legend
      </Button>

      {/* Reset View */}
      <Button
        variant="secondary"
        size="sm"
        className="glass-panel border border-border/50"
        onClick={onResetView}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset
      </Button>
    </div>
  );
};

export default MapControls;
