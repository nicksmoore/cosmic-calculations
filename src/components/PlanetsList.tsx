import { Planet } from "@/data/natalChartData";
import { Card, CardContent } from "@/components/ui/card";

interface PlanetsListProps {
  planets: Planet[];
  onSelectPlanet: (planet: Planet) => void;
  selectedPlanet: Planet | null;
}

const PlanetsList = ({ planets, onSelectPlanet, selectedPlanet }: PlanetsListProps) => {
  return (
    <div className="grid gap-3">
      {planets.map((planet) => (
        <Card
          key={planet.name}
          className={`cursor-pointer transition-all hover:border-primary/50 ${
            selectedPlanet?.name === planet.name
              ? "border-primary bg-primary/10"
              : "bg-card/80 backdrop-blur-sm"
          }`}
          onClick={() => onSelectPlanet(planet)}
        >
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <span className="text-2xl">{planet.symbol}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{planet.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {planet.sign} • House {planet.house}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{planet.degree.toFixed(2)}°</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PlanetsList;
