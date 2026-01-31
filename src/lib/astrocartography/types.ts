/**
 * Astrocartography Types
 */

export type LineType = "MC" | "IC" | "ASC" | "DSC";

export interface ACGLine {
  planet: string;
  planetSymbol: string;
  lineType: LineType;
  coordinates: [number, number][]; // [lng, lat] pairs
  color: string;
}

export interface PlanetEquatorial {
  name: string;
  symbol: string;
  rightAscension: number; // degrees 0-360
  declination: number;    // degrees -90 to +90
  longitude: number;      // ecliptic longitude
}

export interface ACGData {
  lines: ACGLine[];
  planets: PlanetEquatorial[];
  gst: number; // Greenwich Sidereal Time at birth
}

// Planet colors for map lines
export const PLANET_COLORS: Record<string, string> = {
  Sun: "#FFD700",
  Moon: "#C0C0C0",
  Mercury: "#87CEEB",
  Venus: "#FF69B4",
  Mars: "#FF4500",
  Jupiter: "#9370DB",
  Saturn: "#8B4513",
  Uranus: "#00CED1",
  Neptune: "#4169E1",
  Pluto: "#800080",
  Chiron: "#32CD32",
};

// Line type symbols for legend
export const LINE_SYMBOLS: Record<LineType, string> = {
  MC: "MC",
  IC: "IC",
  ASC: "AS",
  DSC: "DS",
};

// Benefit categories for filtering
export const BENEFIT_CATEGORIES = {
  career: ["Sun", "Mars", "Saturn", "Jupiter"],
  love: ["Venus", "Moon"],
  growth: ["Jupiter", "Neptune", "Chiron"],
  challenge: ["Saturn", "Pluto", "Mars"],
} as const;
