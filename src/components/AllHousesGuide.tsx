import { House, Planet } from "@/data/natalChartData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toRomanNumeral } from "@/lib/utils/romanNumerals";

interface AllHousesGuideProps {
  houses: House[];
  planets: Planet[];
}

const AllHousesGuide = ({ houses, planets }: AllHousesGuideProps) => {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {houses.map((house) => {
        const planetsInHouse = planets.filter((p) => p.house === house.number);

        return (
          <AccordionItem
            key={house.number}
            value={`house-${house.number}`}
            className="border rounded-lg bg-card/80 backdrop-blur-sm px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-4 text-left">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                  {house.number}
                </span>
                <div>
                  <h4 className="font-semibold text-foreground">{house.theme}</h4>
                  <p className="text-xs text-muted-foreground">{house.sign}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-12 space-y-3 pb-2">
                <p className="text-sm text-foreground leading-relaxed">{house.description}</p>
                <div className="text-xs text-muted-foreground">Cusp: {house.cusp.toFixed(2)}°</div>
                {planetsInHouse.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {planetsInHouse.map((planet) => (
                      <Badge key={planet.name} variant="outline" className="gap-1">
                        <span>{planet.symbol}</span>
                        {planet.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default AllHousesGuide;
