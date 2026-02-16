import { describe, it, expect } from "vitest";
import { calculateCompatibility } from "@/lib/synastry/compatibility";
import { Planet } from "@/data/natalChartData";

function makePlanets(sunLong: number, moonLong: number, mercLong: number, venusLong: number, marsLong: number): Planet[] {
  const names = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Neptune", "Uranus", "Pluto"];
  const longs = [sunLong, moonLong, mercLong, venusLong, marsLong, sunLong + 90, sunLong + 180, sunLong + 45, sunLong + 135, sunLong + 200];
  return names.map((name, i) => ({
    name, symbol: "", sign: "", signSymbol: "", house: 1, degree: 0,
    longitude: longs[i] % 360, description: "",
  }));
}

describe("Synastry scoring variety", () => {
  const testCases = [
    { label: "Same signs (Aries-Aries)", a: makePlanets(10, 15, 20, 25, 5), b: makePlanets(12, 18, 22, 28, 8) },
    { label: "Compatible (Aries-Leo)", a: makePlanets(10, 15, 20, 25, 5), b: makePlanets(130, 135, 140, 145, 125) },
    { label: "Opposite (Aries-Libra)", a: makePlanets(10, 15, 20, 25, 5), b: makePlanets(190, 195, 200, 205, 185) },
    { label: "Square (Aries-Cancer)", a: makePlanets(10, 15, 20, 25, 5), b: makePlanets(100, 105, 110, 115, 95) },
    { label: "Incompatible (Aries-Taurus)", a: makePlanets(10, 15, 20, 25, 5), b: makePlanets(40, 45, 50, 55, 35) },
    { label: "Random spread", a: makePlanets(10, 95, 170, 250, 320), b: makePlanets(55, 140, 220, 310, 30) },
  ];

  const scores: number[] = [];

  for (const tc of testCases) {
    it(`${tc.label} produces reasonable score`, () => {
      const result = calculateCompatibility(tc.a, tc.b);
      console.log(`${tc.label}: overall=${result.overall}, cats=${result.categories.map(c => `${c.label}=${c.score}`).join(", ")}`);
      scores.push(result.overall);
      expect(result.overall).toBeGreaterThanOrEqual(5);
      expect(result.overall).toBeLessThanOrEqual(98);
    });
  }

  it("scores show variety (range >= 20)", () => {
    const allResults = testCases.map(tc => calculateCompatibility(tc.a, tc.b).overall);
    const min = Math.min(...allResults);
    const max = Math.max(...allResults);
    console.log(`Score range: ${min} - ${max} (spread: ${max - min})`);
    expect(max - min).toBeGreaterThanOrEqual(20);
  });
});
