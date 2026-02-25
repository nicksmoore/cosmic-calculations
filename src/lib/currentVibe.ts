import { DailyTransitsRow } from "@/hooks/useDailyTransits";
import { NatalChartData } from "@/data/natalChartData";

const SIGN_ELEMENT: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const ELEMENT_TONES: Record<string, string> = {
  Fire: "bold and energized",
  Earth: "steady and practical",
  Air: "curious and connected",
  Water: "intuitive and reflective",
};

export function generateCurrentVibe(
  chartData: NatalChartData | null,
  daily: DailyTransitsRow | null
): string {
  if (!chartData || !daily) {
    return "Tuning into the sky and moving with intention.";
  }

  const sun = chartData.planets.find((p) => p.name === "Sun")?.sign ?? null;
  const moon = chartData.planets.find((p) => p.name === "Moon")?.sign ?? null;
  const rising = chartData.angles.ascendant.sign ?? null;
  const tone = sun ? ELEMENT_TONES[SIGN_ELEMENT[sun]] ?? "centered" : "centered";

  const top = daily.transits.slice(0, 2).map((t) => t.display_name).join(" + ");
  const transitLine = top || daily.dominant_transit;

  return `Feeling ${tone}: ${sun ?? "Sun"} sun, ${moon ?? "Moon"} moon, ${rising ?? "Rising"} rising under ${transitLine}.`;
}
