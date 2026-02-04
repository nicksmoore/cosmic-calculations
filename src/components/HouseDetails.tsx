import { motion } from "framer-motion";
import { House, Planet } from "@/data/natalChartData";
import { getHouseInterpretation } from "@/data/houseInterpretations";
import { toRomanNumeral, getHouseCuspLabel } from "@/lib/utils/romanNumerals";

interface HouseDetailsProps {
  house: House;
  planets: Planet[];
}

const HouseDetails = ({ house, planets }: HouseDetailsProps) => {
  const planetsInHouse = planets.filter((p) => p.house === house.number);
  const planetNames = planetsInHouse.map((p) => p.name);
  
  const interpretation = getHouseInterpretation(house.number, house.sign, planetNames);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-serif text-ethereal">House {toRomanNumeral(house.number)}</h3>
          <p className="text-sm text-accent">{house.theme}</p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium">
          {house.signSymbol} {house.sign}
        </div>
      </div>

      {/* Cusp */}
      <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cusp Position</p>
        <p className="text-lg font-serif text-foreground">{house.cusp.toFixed(2)}°</p>
      </div>

      {/* Sign on Cusp Interpretation */}
      {interpretation.signInterpretation && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-accent uppercase tracking-wider">
            {house.sign} on the {getHouseCuspLabel(house.number)}
          </h4>
          <div className="p-4 rounded-lg cosmic-border">
            <p className="text-sm leading-relaxed text-foreground/90">
              {interpretation.signInterpretation}
            </p>
          </div>
        </div>
      )}

      {/* Basic Description */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">House Themes</h4>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
          <p className="text-sm leading-relaxed text-foreground/80">
            {house.description}
          </p>
        </div>
      </div>

      {/* Planets in House */}
      {planetsInHouse.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-accent uppercase tracking-wider">
            Planets in this House ({planetsInHouse.length})
          </h4>
          
          {planetsInHouse.map((planet) => {
            const planetInterpretation = interpretation.planetInterpretations.find(
              (p) => p.name === planet.name
            );
            
            return (
              <div
                key={planet.name}
                className="p-4 rounded-lg cosmic-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{planet.symbol}</span>
                    <span className="font-medium text-foreground">{planet.name}</span>
                    {planet.isRetrograde && (
                      <span className="text-xs text-accent/70 px-1.5 py-0.5 rounded bg-accent/10">Rx</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(planet.degree)}° {planet.signSymbol} {planet.sign}
                  </div>
                </div>
                
                {planetInterpretation?.interpretation && (
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {planetInterpretation.interpretation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty House */}
      {planetsInHouse.length === 0 && (
        <div className="p-4 rounded-lg bg-secondary/20 border border-border/30">
          <p className="text-sm text-muted-foreground italic">
            No planets currently occupy this house. The {house.sign} energy still colors 
            the {house.theme.toLowerCase()} area of your life through the sign on the cusp.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default HouseDetails;
