import { House, Planet, NatalChartData } from "@/data/natalChartData";
import { getHouseInterpretation } from "@/data/houseInterpretations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toRomanNumeral, getHouseCuspLabel } from "@/lib/utils/romanNumerals";

interface NatalChartExplainerProps {
  chartData: NatalChartData;
}

const NatalChartExplainer = ({ chartData }: NatalChartExplainerProps) => {
  const { houses, planets } = chartData;

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-serif text-ethereal mb-1">Your Natal Chart Explained</h2>
        <p className="text-sm text-muted-foreground">
          Explore each house of your chart and discover how the planets influence different areas of your life.
        </p>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <Accordion type="single" collapsible className="space-y-2">
          {houses.map((house) => {
            const planetsInHouse = planets.filter((p) => p.house === house.number);
            const planetNames = planetsInHouse.map((p) => p.name);
            const interpretation = getHouseInterpretation(house.number, house.sign, planetNames);

            return (
              <AccordionItem
                key={house.number}
                value={`house-${house.number}`}
                className="border rounded-lg bg-card/80 backdrop-blur-sm px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-left w-full">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0">
                      {toRomanNumeral(house.number)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{house.theme}</h4>
                        <Badge variant="outline" className="text-xs">
                          {house.signSymbol} {house.sign}
                        </Badge>
                      </div>
                      {planetsInHouse.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {planetsInHouse.map((planet) => (
                            <span
                              key={planet.name}
                              className="text-sm"
                              title={planet.name}
                            >
                              {planet.symbol}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-11 space-y-4 pb-3">
                    {/* Sign on Cusp */}
                    {interpretation.signInterpretation && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-primary">
                          {house.sign} on the {getHouseCuspLabel(house.number)}
                        </h5>
                        <p className="text-sm text-foreground/90 leading-relaxed bg-primary/5 rounded-lg p-3 border border-primary/10">
                          {interpretation.signInterpretation}
                        </p>
                      </div>
                    )}

                    {/* House Themes */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Life Areas
                      </h5>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {house.description}
                      </p>
                    </div>

                    {/* Planets in House */}
                    {planetsInHouse.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Planets in this House
                        </h5>
                        {planetsInHouse.map((planet) => {
                          const planetInterp = interpretation.planetInterpretations.find(
                            (p) => p.name === planet.name
                          );
                          return (
                            <div
                              key={planet.name}
                              className="rounded-lg bg-secondary/30 border border-border/30 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{planet.symbol}</span>
                                  <span className="font-medium text-foreground">{planet.name}</span>
                                  {planet.isRetrograde && (
                                    <span className="text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Rx</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.floor(planet.degree)}° {planet.signSymbol} {planet.sign}
                                </div>
                              </div>
                              {planetInterp?.interpretation && (
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                  {planetInterp.interpretation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty House */}
                    {planetsInHouse.length === 0 && (
                      <div className="text-sm text-muted-foreground italic bg-secondary/20 rounded-lg p-3 border border-border/30">
                        No planets currently occupy this house. The {house.sign} energy still colors 
                        the {house.theme.toLowerCase()} area of your life through the sign on the cusp.
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
};

export default NatalChartExplainer;
