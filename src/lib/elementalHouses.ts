export type HouseElement = "Fire" | "Earth" | "Air" | "Water";

export const HOUSE_ELEMENTS: HouseElement[] = ["Fire", "Earth", "Air", "Water"];

const SIGN_TO_ELEMENT: Record<string, HouseElement> = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
};

export function deriveDominantElement(
  sunSign: string | null | undefined,
  moonSign: string | null | undefined,
  risingSign: string | null | undefined
): HouseElement | null {
  const elementScores: Record<HouseElement, number> = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0,
  };

  const weightedSigns: Array<{ sign: string | null | undefined; weight: number }> = [
    { sign: sunSign, weight: 2 },
    { sign: moonSign, weight: 2 },
    { sign: risingSign, weight: 1 },
  ];

  for (const entry of weightedSigns) {
    if (!entry.sign) continue;
    const element = SIGN_TO_ELEMENT[entry.sign];
    if (!element) continue;
    elementScores[element] += entry.weight;
  }

  const hasAnyScore = Object.values(elementScores).some((value) => value > 0);
  if (!hasAnyScore) return null;

  return HOUSE_ELEMENTS.reduce((best, current) =>
    elementScores[current] > elementScores[best] ? current : best
  );
}

export function getWeekKey(date = new Date()): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const weekNumber = 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}
