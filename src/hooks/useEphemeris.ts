import { useMemo } from "react";
import { calculateChart as celestineCalculateChart } from "celestine";
import { calculateChart as fallbackCalculateChart } from "@/lib/ephemeris";
import { NatalChartData, Planet, House, ChartAngles, zodiacSigns } from "@/data/natalChartData";
import { HouseSystem } from "@/components/ChartDashboard";
import { ZodiacSystem } from "@/components/ZodiacSystemSelector";
import { BirthData } from "@/components/intake/BirthDataForm";

// Planet symbol mapping
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  Chiron: "⚷",
  Ceres: "⚳",
  Pallas: "⚴",
  Juno: "⚵",
  Vesta: "⚶",
  Eris: "⯰",
  Hygiea: "H",
  Psyche: "Ψ",
  Eros: "E",
  Makemake: "M",
  NorthNode: "☊",
  SouthNode: "☋",
  Lilith: "⚸",
};

// Planet descriptions
const PLANET_DESCRIPTIONS: Record<string, string> = {
  Sun: "Your core identity and conscious ego. The Sun represents your vital force, creativity, and the essence of who you are.",
  Moon: "Your emotional nature and subconscious patterns. The Moon governs your instincts, memories, and nurturing needs.",
  Mercury: "Your mind and communication style. Mercury rules thought processes, learning, and how you express ideas.",
  Venus: "Your values and approach to love. Venus governs beauty, pleasure, relationships, and what you attract.",
  Mars: "Your drive and assertive energy. Mars represents action, desire, competition, and how you pursue goals.",
  Jupiter: "Your growth and expansion. Jupiter brings luck, wisdom, optimism, and opportunities for abundance.",
  Saturn: "Your discipline and life lessons. Saturn represents structure, responsibility, limitations, and maturity.",
  Uranus: "Your individuality and rebellion. Uranus brings sudden change, innovation, and liberation from convention.",
  Neptune: "Your spirituality and imagination. Neptune dissolves boundaries, bringing dreams, illusions, and transcendence.",
  Pluto: "Your transformation and power. Pluto represents death/rebirth cycles, intensity, and profound change.",
  Chiron: "Your deepest wound and healing gift. Chiron represents where you've been hurt and where you can help others heal.",
  Ceres: "Nourishment and care patterns. Ceres shows how you give and receive support.",
  Pallas: "Strategic intelligence and pattern recognition. Pallas reflects wisdom in action.",
  Juno: "Commitment and long-term partnership values. Juno shows what you need in devoted bonds.",
  Vesta: "Sacred devotion and focused dedication. Vesta reflects where your inner flame burns brightest.",
  Eris: "Disruption that reveals truth. Eris points to unrest that catalyzes needed change.",
  Hygiea: "Healing rituals and wellbeing maintenance. Hygiea highlights your health stewardship.",
  Psyche: "Soul sensitivity and deep emotional attunement. Psyche reveals subtle receptivity.",
  Eros: "Desire, attraction, and creative passion. Eros marks what magnetizes your life force.",
  Makemake: "Creation through ingenuity and adaptation. Makemake highlights inventive growth.",
  NorthNode: "Your soul's direction and destiny. The North Node points toward growth, lessons, and your life path.",
  SouthNode: "Your past life gifts and comfort zone. The South Node represents innate talents and what to release.",
  Lilith: "Your shadow self and primal power. Black Moon Lilith represents raw feminine energy, independence, and taboos.",
};

// House themes and descriptions
const HOUSE_DATA: Record<number, { theme: string; description: string }> = {
  1: { theme: "Self & Identity", description: "Your persona, physical appearance, and how you approach new beginnings." },
  2: { theme: "Values & Resources", description: "Your relationship with money, possessions, and self-worth." },
  3: { theme: "Communication", description: "Short journeys, siblings, early education, and everyday exchanges." },
  4: { theme: "Home & Roots", description: "Your private life, family origins, and emotional foundation." },
  5: { theme: "Creativity & Joy", description: "Romance, children, creative expression, and pleasure." },
  6: { theme: "Health & Service", description: "Daily routines, work habits, and physical well-being." },
  7: { theme: "Partnerships", description: "Marriage, business partners, and one-on-one relationships." },
  8: { theme: "Transformation", description: "Shared resources, intimacy, death/rebirth, and hidden depths." },
  9: { theme: "Philosophy", description: "Higher education, travel, beliefs, and the search for meaning." },
  10: { theme: "Career & Status", description: "Public reputation, ambitions, and your role in society." },
  11: { theme: "Community", description: "Friendships, groups, hopes, and humanitarian ideals." },
  12: { theme: "Spirituality", description: "The subconscious, solitude, hidden strengths, and spiritual transcendence." },
};

// Format degrees to DMS
export const formatDMS = (decimalDegrees: number): { degrees: number; minutes: number; seconds: number; formatted: string } => {
  const normalized = ((decimalDegrees % 30) + 30) % 30;
  const degrees = Math.floor(normalized);
  const minFloat = (normalized - degrees) * 60;
  const minutes = Math.floor(minFloat);
  const seconds = Math.round((minFloat - minutes) * 60);
  
  // Handle rollover
  let finalSeconds = seconds;
  let finalMinutes = minutes;
  let finalDegrees = degrees;
  
  if (finalSeconds >= 60) {
    finalSeconds = 0;
    finalMinutes++;
  }
  if (finalMinutes >= 60) {
    finalMinutes = 0;
    finalDegrees++;
  }
  
  return {
    degrees: finalDegrees,
    minutes: finalMinutes,
    seconds: finalSeconds,
    formatted: `${finalDegrees}° ${finalMinutes.toString().padStart(2, "0")}' ${finalSeconds.toString().padStart(2, "0")}"`,
  };
};

// Map our HouseSystem type to celestine's house system type
type CelestineHouseSystem = "placidus" | "whole-sign" | "equal" | "koch" | "porphyry" | "regiomontanus" | "campanus";

const mapHouseSystem = (system: HouseSystem): CelestineHouseSystem => {
  switch (system) {
    case "placidus": return "placidus";
    case "whole-sign": return "whole-sign";
    case "equal": return "equal";
    default: return "placidus";
  }
};

export interface EphemerisResult {
  chartData: NatalChartData | null;
  isCalculated: boolean;
}

// Ayanamsa offset for Lahiri sidereal (approximate current value ~24°)
const AYANAMSA_LAHIRI = 24.1;

// Get zodiac sign info from longitude
const longitudeToSign = (longitude: number): { sign: typeof zodiacSigns[number]; degree: number } => {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized % 30;
  return { sign: zodiacSigns[signIndex], degree };
};

// Find which house a planet is in using celestine's house system
const findHouseForPlanet = (longitude: number, cusps: number[]): number => {
  const lng = ((longitude % 360) + 360) % 360;
  
  for (let i = 0; i < 12; i++) {
    const cusp = cusps[i];
    const nextCusp = cusps[(i + 1) % 12];
    
    if (nextCusp > cusp) {
      // Normal case - no wrap around
      if (lng >= cusp && lng < nextCusp) {
        return i + 1;
      }
    } else {
      // Wrap around case (crosses 0°)
      if (lng >= cusp || lng < nextCusp) {
        return i + 1;
      }
    }
  }
  
  return 1; // Default to first house
};

export const useEphemeris = (
  birthData: BirthData | null,
  houseSystem: HouseSystem = "placidus",
  zodiacSystem: ZodiacSystem = "tropical"
): EphemerisResult => {
  return useMemo(() => {
    if (!birthData || !birthData.latitude || !birthData.longitude) {
      return { chartData: null, isCalculated: false };
    }

    try {
      // Parse birth date and time
      const [year, month, day] = birthData.birthDate.split("-").map(Number);
      const [hour, minute] = birthData.timeUnknown 
        ? [12, 0]
        : birthData.birthTime.split(":").map(Number);

      // Parse timezone like "UTC-8" / "UTC+5" into a numeric offset in hours.
      const timezoneOffsetHours = (() => {
        const raw = birthData.timezone?.trim();
        if (!raw) return 0;
        const match = raw.match(/^UTC\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i);
        if (!match) return 0;
        const sign = match[1] === "-" ? -1 : 1;
        const hours = Number(match[2] ?? 0);
        const minutes = Number(match[3] ?? 0);
        return sign * (hours + minutes / 60);
      })();

      // Use celestine's calculateChart for precise, validated Placidus calculations
      // Birth data and chart options are passed separately
      const celestineChart = celestineCalculateChart(
        {
          year,
          month,
          day,
          hour,
          minute,
          second: 0,
          timezone: timezoneOffsetHours,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
        },
        {
          houseSystem: mapHouseSystem(houseSystem),
        }
      );

      // Apply sidereal adjustment if needed
      const siderealOffset = zodiacSystem === "sidereal" ? AYANAMSA_LAHIRI : 0;
      
      const adjustLongitude = (lon: number) => {
        const adjusted = lon - siderealOffset;
        return ((adjusted % 360) + 360) % 360;
      };

      // Build angles from celestine output
      const ascLon = adjustLongitude(celestineChart.angles.ascendant.longitude);
      const mcLon = adjustLongitude(celestineChart.angles.midheaven.longitude);
      const descLon = adjustLongitude(celestineChart.angles.descendant.longitude);
      const icLon = adjustLongitude(celestineChart.angles.imumCoeli.longitude);

      const ascSign = longitudeToSign(ascLon);
      const mcSign = longitudeToSign(mcLon);
      const descSign = longitudeToSign(descLon);
      const icSign = longitudeToSign(icLon);

      const angles: ChartAngles = {
        ascendant: {
          sign: ascSign.sign.name,
          signSymbol: ascSign.sign.symbol,
          degree: ascSign.degree,
          longitude: ascLon,
        },
        midheaven: {
          sign: mcSign.sign.name,
          signSymbol: mcSign.sign.symbol,
          degree: mcSign.degree,
          longitude: mcLon,
        },
        descendant: {
          sign: descSign.sign.name,
          signSymbol: descSign.sign.symbol,
          degree: descSign.degree,
          longitude: descLon,
        },
        imumCoeli: {
          sign: icSign.sign.name,
          signSymbol: icSign.sign.symbol,
          degree: icSign.degree,
          longitude: icLon,
        },
      };

      // Extract cusp longitudes from celestineChart.houses.cusps array
      const houseCusps = celestineChart.houses.cusps.map(c => adjustLongitude(c.longitude));

      // Build houses
      const houses: House[] = houseCusps.map((cusp, index) => {
        const signInfo = longitudeToSign(cusp);
        const houseNum = index + 1;
        const houseInfo = HOUSE_DATA[houseNum];

        return {
          number: houseNum,
          sign: signInfo.sign.name,
          signSymbol: signInfo.sign.symbol,
          cusp: cusp,
          theme: houseInfo.theme,
          description: houseInfo.description,
        };
      });

      // Build planets from celestine - map to our format
      const mainPlanets = [
        "Sun", "Moon", "Mercury", "Venus", "Mars",
        "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
        "Chiron", "Ceres", "Pallas", "Juno", "Vesta",
      ];
      
      const planets: Planet[] = celestineChart.planets
        .filter(p => mainPlanets.includes(p.body))
        .map((p) => {
          const adjustedLon = adjustLongitude(p.longitude);
          const signInfo = longitudeToSign(adjustedLon);
          const house = findHouseForPlanet(adjustedLon, houseCusps);
          const dms = formatDMS(adjustedLon);

          return {
            name: p.body,
            symbol: PLANET_SYMBOLS[p.body] || "●",
            sign: signInfo.sign.name,
            signSymbol: signInfo.sign.symbol,
            house,
            degree: signInfo.degree,
            longitude: adjustedLon,
            isRetrograde: p.isRetrograde,
            description: PLANET_DESCRIPTIONS[p.body] || "",
            dms,
          };
        });

      // Celestine does not expose Lilith; supplement it from internal ephemeris.
      try {
        const supplemental = fallbackCalculateChart({
          year,
          month,
          day,
          hour,
          minute,
          second: 0,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
          timezone: timezoneOffsetHours,
        });
        const lilith = supplemental.planets.find((p) => p.name === "lilith");
        if (lilith) {
          const lilithLon = adjustLongitude(lilith.longitude);
          const lilithSign = longitudeToSign(lilithLon);
          planets.push({
            name: "Lilith",
            symbol: PLANET_SYMBOLS.Lilith,
            sign: lilithSign.sign.name,
            signSymbol: lilithSign.sign.symbol,
            house: findHouseForPlanet(lilithLon, houseCusps),
            degree: lilithSign.degree,
            longitude: lilithLon,
            isRetrograde: false,
            description: PLANET_DESCRIPTIONS.Lilith,
            dms: formatDMS(lilithLon),
          });
        }
      } catch {
        // Ignore supplemental failures and keep base chart.
      }

      const chartData: NatalChartData = {
        angles,
        planets,
        houses,
      };

      return { chartData, isCalculated: true };
    } catch (error) {
      console.error("Ephemeris calculation error:", error);
      return { chartData: null, isCalculated: false };
    }
  }, [birthData, houseSystem, zodiacSystem]);
};

export default useEphemeris;
