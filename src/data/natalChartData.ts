export interface DMS {
  degrees: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

export interface Planet {
  name: string;
  symbol: string;
  sign: string;
  signSymbol: string;
  house: number;
  degree: number;      // 0-29.99 within the sign
  longitude: number;   // 0-359.99 absolute zodiac longitude
  isRetrograde?: boolean;
  description: string;
  dms?: DMS;           // Optional DMS precision
}

export interface House {
  number: number;
  sign: string;
  signSymbol: string;
  cusp: number;        // Longitude of house cusp
  description: string;
  theme: string;
}

export interface ChartAngles {
  ascendant: { sign: string; signSymbol: string; degree: number; longitude: number };
  midheaven: { sign: string; signSymbol: string; degree: number; longitude: number };
  descendant: { sign: string; signSymbol: string; degree: number; longitude: number };
  imumCoeli: { sign: string; signSymbol: string; degree: number; longitude: number };
}

export interface ZodiacSign {
  name: string;
  symbol: string;
  element: string;
  modality: string;
  startDegree: number;
}

export interface NatalChartData {
  angles: ChartAngles;
  planets: Planet[];
  houses: House[];
}

// Helper to convert sign + degree to absolute longitude
export const signToLongitude = (sign: string, degree: number): number => {
  const signIndex = zodiacSigns.findIndex(s => s.name === sign);
  return signIndex * 30 + degree;
};

// Helper to get sign from longitude
export const longitudeToSign = (longitude: number): { sign: ZodiacSign; degree: number } => {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized % 30;
  return { sign: zodiacSigns[signIndex], degree };
};

export const zodiacSigns: ZodiacSign[] = [
  { name: "Aries", symbol: "♈", element: "Fire", modality: "Cardinal", startDegree: 0 },
  { name: "Taurus", symbol: "♉", element: "Earth", modality: "Fixed", startDegree: 30 },
  { name: "Gemini", symbol: "♊", element: "Air", modality: "Mutable", startDegree: 60 },
  { name: "Cancer", symbol: "♋", element: "Water", modality: "Cardinal", startDegree: 90 },
  { name: "Leo", symbol: "♌", element: "Fire", modality: "Fixed", startDegree: 120 },
  { name: "Virgo", symbol: "♍", element: "Earth", modality: "Mutable", startDegree: 150 },
  { name: "Libra", symbol: "♎", element: "Air", modality: "Cardinal", startDegree: 180 },
  { name: "Scorpio", symbol: "♏", element: "Water", modality: "Fixed", startDegree: 210 },
  { name: "Sagittarius", symbol: "♐", element: "Fire", modality: "Mutable", startDegree: 240 },
  { name: "Capricorn", symbol: "♑", element: "Earth", modality: "Cardinal", startDegree: 270 },
  { name: "Aquarius", symbol: "♒", element: "Air", modality: "Fixed", startDegree: 300 },
  { name: "Pisces", symbol: "♓", element: "Water", modality: "Mutable", startDegree: 330 },
];

// No demo data - all charts are calculated dynamically from birth data
