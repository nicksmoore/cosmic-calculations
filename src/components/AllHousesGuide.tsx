import { useState } from "react";
import { House, Planet } from "@/data/natalChartData";
import { Badge } from "@/components/ui/badge";
import { toRomanNumeral } from "@/lib/utils/romanNumerals";
import { HouseDescriptionCopy } from "@/hooks/useAstroCopy";

interface AllHousesGuideProps {
  houses: House[];
  planets: Planet[];
  houseDescriptions?: Record<string, HouseDescriptionCopy | string> | null;
  loadingDescriptions?: boolean;
}

const AllHousesGuide = ({ houses, planets, houseDescriptions, loadingDescriptions }: AllHousesGuideProps) => {
  const [flippedHouses, setFlippedHouses] = useState<Record<number, boolean>>({});

  const renderHouseCopy = (houseNumber: number, fallbackDescription: string) => {
    const value = houseDescriptions?.[String(houseNumber)];
    if (!value) {
      return loadingDescriptions ? (
        <p className="text-sm text-foreground leading-relaxed">Generating detailed interpretation...</p>
      ) : (
        <p className="text-sm text-foreground leading-relaxed">{fallbackDescription}</p>
      );
    }

    if (typeof value === "string") {
      return <p className="text-sm text-foreground leading-relaxed">{value}</p>;
    }

    return (
      <div className="space-y-2.5">
        <p className="text-sm text-foreground leading-relaxed">{value.summary}</p>
        <p className="text-xs leading-relaxed text-foreground/85">
          <span className="font-medium text-accent">Constellation:</span> {value.constellationInfluence}
        </p>
        <p className="text-xs leading-relaxed text-foreground/85">
          <span className="font-medium text-accent">Aspects:</span> {value.associatedAspects}
        </p>
        <p className="text-xs leading-relaxed text-foreground/85">
          <span className="font-medium text-accent">Strengths:</span> {value.strengths}
        </p>
        <p className="text-xs leading-relaxed text-foreground/85">
          <span className="font-medium text-accent">Challenges:</span> {value.challenges}
        </p>
        <p className="text-xs leading-relaxed text-foreground/85">
          <span className="font-medium text-accent">Advice:</span> {value.advice}
        </p>
        <p className="text-xs leading-relaxed text-foreground/85">
          <span className="font-medium text-accent">Planets Here:</span> {value.planetsInHouse}
        </p>
      </div>
    );
  };

  const toggleHouse = (houseNumber: number) => {
    setFlippedHouses((prev) => ({ ...prev, [houseNumber]: !prev[houseNumber] }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {houses.map((house) => {
        const planetsInHouse = planets.filter((p) => p.house === house.number);
        const flipped = !!flippedHouses[house.number];

        return (
          <button
            key={house.number}
            type="button"
            onClick={() => toggleHouse(house.number)}
            className="group relative h-64 w-full [perspective:1200px] text-left"
            aria-label={`Flip house ${house.number} card`}
          >
            <div
              className={`relative h-full w-full rounded-xl transition-transform duration-500 [transform-style:preserve-3d] ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              <div className="absolute inset-0 rounded-xl overflow-hidden border border-primary/25 bg-gradient-to-br from-card/95 via-card/80 to-fuchsia-500/10 backdrop-blur-sm p-4 [backface-visibility:hidden] transition-all duration-300 group-hover:border-accent/45 group-hover:shadow-[0_18px_45px_-25px_rgba(251,191,36,0.65)]">
                <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-8 h-44 w-44 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.28),transparent_42%)]" />
                <div className="h-full flex flex-col">
                  <div className="w-20 h-20 rounded-xl border border-accent/50 bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center text-accent font-bold text-3xl shadow-[0_0_25px_rgba(251,191,36,0.28)] transition-transform duration-300 group-hover:scale-105">
                    {toRomanNumeral(house.number)}
                  </div>
                  <div className="mt-3">
                    <h4 className="font-semibold text-foreground text-base">{house.theme}</h4>
                    <p className="text-xs text-foreground/75">{house.sign}</p>
                  </div>
                  <div className="mt-auto text-[11px] text-foreground/70">
                    Tap to reveal interpretation
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-sm p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">
                      {toRomanNumeral(house.number)} House
                    </h4>
                    <span className="text-xs text-muted-foreground">{house.sign}</span>
                  </div>
                  {renderHouseCopy(house.number, house.description)}
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
                  <div className="text-[11px] text-muted-foreground">Tap again to flip back</div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default AllHousesGuide;
