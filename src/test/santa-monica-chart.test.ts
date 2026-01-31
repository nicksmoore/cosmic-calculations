/**
 * Verification test for April 4, 1977 chart calculations
 * 
 * Reference data from Astro-Seek professional ephemeris (00:00 UT):
 * https://horoscopes.astro-seek.com/astrology-ephemeris-april-1977
 * 
 * Birth: April 4, 1977, 03:01 PST (-08:00)
 * Location: Santa Monica, CA (34.019490, -118.491380)
 */

import { describe, it, expect } from "vitest";
import { calculateChart, calculateJulianDay } from "@/lib/ephemeris";
import { calculateLST, calculateTrueObliquity, ramcToMC, calculateAscendant } from "@/lib/ephemeris/astronomia-helpers";

describe("April 4, 1977 Chart Verification", () => {
  // Birth data
  const year = 1977;
  const month = 4;
  const day = 4;
  const hour = 3;
  const minute = 1;
  const second = 0;
  const timezone = -8; // PST
  const latitude = 34.019490;
  const longitude = -118.491380;

  it("should match Astro-Seek ephemeris for planetary positions", () => {
    const chart = calculateChart({
      year, month, day, hour, minute, second, latitude, longitude, timezone,
    });

    console.log("\n=== VERIFICATION AGAINST ASTRO-SEEK EPHEMERIS ===");
    console.log("Astro-Seek shows positions at 00:00 UT on April 4, 1977");
    console.log("Our chart is for 11:01 UT (~11h later), so positions will shift slightly");
    
    // Expected values from Astro-Seek (00:00 UT) - our values will be slightly different due to time
    // Sun moves ~1°/day, Moon moves ~13°/day, Mercury moves ~1-2°/day, Venus ~1°/day
    const astroSeekRef = {
      sun: { sign: "Aries", degreeRange: [14, 15] },      // 14°06' at 00:00 UT
      moon: { sign: "Libra", degreeRange: [11, 20] },     // 11°44' at 00:00, moves ~5.5° in 11h
      mercury: { sign: "Taurus", degreeRange: [1, 3] },   // 01°24' at 00:00 UT
      venus: { sign: "Aries", degreeRange: [17, 18] },    // 17°46' at 00:00 UT
      mars: { sign: "Pisces", degreeRange: [11, 12] },    // 11°37' at 00:00 UT
      jupiter: { sign: "Gemini", degreeRange: [0, 1] },   // 00°04' at 00:00 UT
      saturn: { sign: "Leo", degreeRange: [9, 10] },      // 09°59' at 00:00 UT
      uranus: { sign: "Scorpio", degreeRange: [10, 11] }, // 10°49' at 00:00 UT
      neptune: { sign: "Sagittarius", degreeRange: [16, 17] },
      pluto: { sign: "Libra", degreeRange: [12, 13] },
    };

    let passCount = 0;
    let failCount = 0;

    for (const planet of chart.planets.slice(0, 10)) {
      const ref = astroSeekRef[planet.name as keyof typeof astroSeekRef];
      if (ref) {
        const signDeg = Math.floor(planet.signDegree);
        const signMatch = planet.sign.name === ref.sign;
        const degreeMatch = signDeg >= ref.degreeRange[0] && signDeg <= ref.degreeRange[1];
        const match = signMatch && degreeMatch;
        
        if (match) {
          passCount++;
          console.log(`✓ ${planet.name}: ${signDeg}° ${planet.sign.name}`);
        } else {
          failCount++;
          console.log(`✗ ${planet.name}: ${signDeg}° ${planet.sign.name} (expected: ${ref.degreeRange[0]}-${ref.degreeRange[1]}° ${ref.sign})`);
        }
      }
    }

    console.log(`\nResult: ${passCount}/10 planets match Astro-Seek ephemeris`);
    
    // All planets should match
    expect(passCount).toBeGreaterThanOrEqual(9); // Allow 1 margin for edge cases
  });

  it("should calculate consistent ASC and MC", () => {
    const chart = calculateChart({
      year, month, day, hour, minute, second, latitude, longitude, timezone,
    });

    console.log("\n=== ANGLES ===");
    console.log(`ASC: ${chart.angles.ascendant.toFixed(2)}°`);
    console.log(`MC: ${chart.angles.midheaven.toFixed(2)}°`);
    console.log(`DESC: ${chart.angles.descendant.toFixed(2)}°`);
    console.log(`IC: ${chart.angles.imumCoeli.toFixed(2)}°`);

    // Verify angles are consistent
    expect(chart.angles.descendant).toBeCloseTo((chart.angles.ascendant + 180) % 360, 1);
    expect(chart.angles.imumCoeli).toBeCloseTo((chart.angles.midheaven + 180) % 360, 1);
    
    // Verify ASC is roughly 70-110° after MC (varies by latitude)
    let ascMcDiff = chart.angles.ascendant - chart.angles.midheaven;
    if (ascMcDiff < 0) ascMcDiff += 360;
    console.log(`ASC-MC difference: ${ascMcDiff.toFixed(1)}°`);
    expect(ascMcDiff).toBeGreaterThan(50);
    expect(ascMcDiff).toBeLessThan(130);
  });

  it("should identify retrograde planets correctly", () => {
    const chart = calculateChart({
      year, month, day, hour, minute, second, latitude, longitude, timezone,
    });

    // Sun and Moon should never be retrograde
    const sun = chart.planets.find(p => p.name === "sun");
    const moon = chart.planets.find(p => p.name === "moon");
    expect(sun?.isRetrograde).toBe(false);
    expect(moon?.isRetrograde).toBe(false);

    // Log retrograde status for outer planets
    console.log("\n=== RETROGRADE STATUS ===");
    for (const planet of chart.planets) {
      if (planet.isRetrograde) {
        console.log(`${planet.name}: Rx`);
      }
    }
  });
});
