import { House, Planet, NatalChartData } from "@/data/natalChartData";
import { getHouseInterpretation } from "@/data/houseInterpretations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import { toRomanNumeral, getHouseCuspLabel } from "@/lib/utils/romanNumerals";

interface NatalChartExplainerProps {
  chartData: NatalChartData;
}

const NatalChartExplainer = ({ chartData }: NatalChartExplainerProps) => {
  const { houses, planets } = chartData;

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-serif text-ethereal mb-1">Your Natal Chart Explained</h2>
        <p className="text-sm text-muted-foreground">
          Explore each house of your chart and discover how the planets influence different areas of your life.
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {houses.map((house) => {
          const planetsInHouse = planets.filter((p) => p.house === house.number);
          const planetNames = planetsInHouse.map((p) => p.name);
          const interpretation = getHouseInterpretation(house.number, house.sign, planetNames);

          return (
            <AccordionItem
              key={house.number}
              value={`house-${house.number}`}
              className="border-0 rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline px-4 py-4 bg-secondary/80 hover:bg-secondary data-[state=open]:bg-primary/20 transition-colors rounded-xl data-[state=open]:rounded-b-none">
                <div className="flex items-center gap-4 text-left w-full">
                  {/* Roman numeral badge */}
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/30 border border-primary/50 text-foreground font-bold text-lg shrink-0 shadow-lg">
                    {toRomanNumeral(house.number)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-semibold text-foreground text-base">{house.theme}</h4>
                      <Badge variant="secondary" className="bg-accent/20 text-accent border border-accent/30 font-medium">
                        {house.signSymbol} {house.sign}
                      </Badge>
                    </div>
                    {planetsInHouse.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {planetsInHouse.map((planet) => (
                          <span
                            key={planet.name}
                            className="text-lg bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center"
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
              <AccordionContent className="bg-card border border-t-0 border-border/50 rounded-b-xl">
                <div className="p-5 space-y-5">
                  {/* Sign on Cusp */}
                  {interpretation.signInterpretation && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-accent uppercase tracking-wider">
                        {house.sign} on the {getHouseCuspLabel(house.number)}
                      </h5>
                      <p className="text-foreground leading-relaxed bg-accent/10 rounded-lg p-4 border border-accent/20">
                        {interpretation.signInterpretation}
                      </p>
                    </div>
                  )}

                  {/* House Themes */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Life Areas
                    </h5>
                    <p className="text-foreground/90 leading-relaxed">
                      {house.description}
                    </p>
                  </div>

                  {/* Planets in House */}
                  {planetsInHouse.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Planets in this House
                      </h5>
                      {planetsInHouse.map((planet) => {
                        const planetInterp = interpretation.planetInterpretations.find(
                          (p) => p.name === planet.name
                        );
                        return (
                          <div
                            key={planet.name}
                            className="rounded-xl bg-secondary/60 border border-border/50 p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl bg-primary/20 rounded-full w-10 h-10 flex items-center justify-center">
                                  {planet.symbol}
                                </span>
                                <span className="font-semibold text-foreground">{planet.name}</span>
                                {planet.isRetrograde && (
                                  <span className="text-xs text-accent bg-accent/20 px-2 py-0.5 rounded-full border border-accent/30 font-medium">
                                    Rx
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-foreground/70 font-medium">
                                {Math.floor(planet.degree)}° {planet.signSymbol} {planet.sign}
                              </div>
                            </div>
                            {planetInterp?.interpretation && (
                              <p className="text-foreground/80 leading-relaxed pl-13">
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
                    <div className="text-foreground/70 italic bg-secondary/40 rounded-lg p-4 border border-border/30">
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
    </div>
  );
};

export default NatalChartExplainer;
