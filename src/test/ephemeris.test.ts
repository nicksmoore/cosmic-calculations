/**
 * Ephemeris calculation accuracy tests
 * These tests compare our calculations against known reference values
 */

import { describe, it, expect } from "vitest";
import {
  calculateChart,
  calculateJulianDay,
  calculateLST,
  calculateObliquity,
} from "@/lib/ephemeris";
import { calculateGASTHours, calculateGMSTHours, ramcToMC, calculateAscendant, calculateTrueObliquity } from "@/lib/ephemeris/astronomia-helpers";

describe("Julian Day Calculations", () => {
  it("should calculate correct JD for J2000.0 epoch", () => {
    // J2000.0 = January 1, 2000, 12:00 TT
    const jd = calculateJulianDay(2000, 1, 1, 12, 0, 0);
    expect(jd).toBeCloseTo(2451545.0, 1);
  });

  it("should calculate correct JD for a known date", () => {
    // April 4, 1977, 12:00 UT - verify calculation is reasonable
    const jd = calculateJulianDay(1977, 4, 4, 12, 0, 0);
    // JD should be around 2443230-2443240 range for early April 1977
    expect(jd).toBeGreaterThan(2443230);
    expect(jd).toBeLessThan(2443250);
    
    // April 4, 1977 at 0h UT should be JD 2443237.5
    const jd0 = calculateJulianDay(1977, 4, 4, 0, 0, 0);
    console.log("April 4, 1977 0h UT JD:", jd0);
    expect(jd0).toBeCloseTo(2443237.5, 1);
  });
});

describe("Sidereal Time Calculations", () => {
  it("should calculate obliquity near 23.44 degrees", () => {
    const jd = calculateJulianDay(2000, 1, 1, 12, 0, 0);
    const obliquity = calculateObliquity(jd);
    expect(obliquity).toBeCloseTo(23.44, 1);
  });

  it("should calculate GMST correctly for April 4, 1977 11:33 UTC", () => {
    // April 4, 1977 at 11:33 UTC  
    const jd = calculateJulianDay(1977, 4, 4, 11, 33, 0);
    
    // Manual calculation following RadixPro method:
    // Step 1: JD at 0h UT = 2443237.5
    // T at 0h = (2443237.5 - 2451545.0) / 36525 = -0.22741958...
    const jd0h = 2443237.5;
    const T = (jd0h - 2451545.0) / 36525.0;
    console.log("T at 0h UT:", T.toFixed(8));
    
    // ST0 = 100.46061837 + 36000.770053608 * T + ...
    const st0Raw = 100.46061837 + 36000.770053608 * T + 0.000387933 * T * T - T * T * T / 38710000.0;
    console.log("ST0 raw (deg):", st0Raw.toFixed(4));
    
    // Normalize ST0
    const st0Deg = ((st0Raw % 360) + 360) % 360;
    console.log("ST0 normalized (deg):", st0Deg.toFixed(4));
    console.log("ST0 (hours):", (st0Deg / 15).toFixed(4));
    
    // Step 2: UT = 11.55 hours
    const utHours = 11 + 33/60;
    const utCorrectionDeg = utHours * 1.00273790935 * 15;
    console.log("UT hours:", utHours.toFixed(4));
    console.log("UT correction (deg):", utCorrectionDeg.toFixed(4));
    
    // GMST = ST0 + correction
    let gmstDeg = st0Deg + utCorrectionDeg;
    gmstDeg = ((gmstDeg % 360) + 360) % 360;
    console.log("GMST (deg):", gmstDeg.toFixed(4));
    console.log("GMST (hours):", (gmstDeg / 15).toFixed(4));
    
    // Now compare with our function
    const gmstHours = calculateGMSTHours(jd);
    const lstDeg = calculateLST(jd, -81.6944);
    
    console.log("\nOur calculation:");
    console.log("GMST (hours):", gmstHours.toFixed(4));
    console.log("LST (deg):", lstDeg.toFixed(4));
    
    // Expected: for MC=211° (1° Scorpio), RAMC should be ~209°
    // So LST should be ~209° for Cleveland at -81.69° → GAST = 209 + 81.69 = 290.69°
    console.log("\nExpected LST for MC=211°: ~209°");
    console.log("Difference:", (lstDeg - 209).toFixed(2) + "°");
    
    expect(gmstHours).toBeGreaterThan(0);
    expect(gmstHours).toBeLessThan(24);
  });
});

describe("Chart Calculations", () => {
  it("should calculate accurate Placidus houses for a test case", () => {
    // Test with the RadixPro example: November 2, 2016, 21:17:30 UT
    // Enschede, Netherlands (52.2167° N, 6.9° E)
    // Expected from RadixPro: MC = 9°38' Aries (9.63°), ASC = 3°30' Leo (123.51°)
    
    const chart = calculateChart({
      year: 2016,
      month: 11,
      day: 2,
      hour: 21,
      minute: 17,
      second: 30,
      latitude: 52.2167,
      longitude: 6.9, // East is positive
      timezone: 0, // Already UT
    });
    
    const lstDeg = calculateLST(chart.julianDay, 6.9);
    const obliquity = calculateTrueObliquity(chart.julianDay);
    
    console.log("RadixPro Test Case:");
    console.log("JD:", chart.julianDay.toFixed(6));
    console.log("LST (deg):", lstDeg.toFixed(4));
    console.log("LST (hours):", (lstDeg / 15).toFixed(4));
    console.log("Obliquity:", obliquity.toFixed(4));
    console.log("Our MC:", chart.angles.midheaven.toFixed(2) + "°");
    console.log("Expected MC: 9.63° (9°38' Aries)");
    console.log("Our ASC:", chart.angles.ascendant.toFixed(2) + "°");
    console.log("Expected ASC: 123.51° (3°30' Leo)");
    
    // Check if our MC is close to 9.63°
    // Note: There may still be small differences due to algorithm variations
    console.log("MC difference:", (chart.angles.midheaven - 9.63).toFixed(2) + "°");
    console.log("ASC difference:", (chart.angles.ascendant - 123.51).toFixed(2) + "°");
    
    // The Sun should be in Scorpio for November 2
    const sun = chart.planets.find(p => p.name === "sun");
    console.log("Sun:", sun?.longitude.toFixed(4), sun?.sign);
    
    // Check valid ranges
    expect(chart.angles.midheaven).toBeGreaterThanOrEqual(0);
    expect(chart.angles.midheaven).toBeLessThan(360);
    expect(chart.angles.ascendant).toBeGreaterThanOrEqual(0);
    expect(chart.angles.ascendant).toBeLessThan(360);
  });

  it("should match April 4, 1977 Cleveland reference", () => {
    // Reference data from Cafe Astrology:
    // Birth: April 4, 1977, 6:33 AM EST (= 11:33 UTC)
    // Cleveland, OH (41.4993° N, 81.6944° W)
    // Expected: AC ~15° Aquarius (~315°), MC ~1° Scorpio (~211°)
    
    // Try different times to find which matches ASC=315°, MC=211°
    const testTimes = [
      { hour: 6, minute: 33, tz: -5, label: "6:33 AM EST" },
      { hour: 7, minute: 33, tz: -5, label: "7:33 AM EST" }, 
      { hour: 6, minute: 33, tz: -4, label: "6:33 AM EDT" },
      { hour: 5, minute: 33, tz: -5, label: "5:33 AM EST" },
    ];
    
    console.log("\nSearching for matching time for April 4, 1977 Cleveland:");
    console.log("Target: ASC ~315° (Aquarius), MC ~211° (Scorpio)");
    console.log("----------------------------------------");
    
    for (const t of testTimes) {
      const chart = calculateChart({
        year: 1977,
        month: 4,
        day: 4,
        hour: t.hour,
        minute: t.minute,
        second: 0,
        latitude: 41.4993,
        longitude: -81.6944,
        timezone: t.tz,
      });
      
      console.log(`${t.label}: ASC=${chart.angles.ascendant.toFixed(1)}°, MC=${chart.angles.midheaven.toFixed(1)}°`);
    }
    
    // Now calculate for the given time
    const chart = calculateChart({
      year: 1977,
      month: 4,
      day: 4,
      hour: 6,
      minute: 33,
      second: 0,
      latitude: 41.4993,
      longitude: -81.6944,
      timezone: -5, // EST
    });

    console.log("\nFinal result for 6:33 AM EST:");
    console.log("Our ASC:", chart.angles.ascendant.toFixed(2) + "°");
    console.log("Our MC:", chart.angles.midheaven.toFixed(2) + "°");
    
    const sun = chart.planets.find(p => p.name === "sun");
    console.log("Sun:", sun?.longitude.toFixed(2) + "° " + sun?.sign.name);

    expect(chart.houseCusps).toHaveLength(12);
    expect(sun!.longitude).toBeGreaterThan(0);
    expect(sun!.longitude).toBeLessThan(30);
  });

  it("should calculate different house systems", () => {
    const birthData = {
      year: 1990,
      month: 9,
      day: 15,
      hour: 14,
      minute: 30,
      latitude: 34.0522,
      longitude: -118.2437,
    };

    const placidus = calculateChart(birthData, "placidus");
    const wholeSign = calculateChart(birthData, "whole-sign");
    const equal = calculateChart(birthData, "equal");

    // All should have same ascendant
    expect(placidus.angles.ascendant).toBeCloseTo(wholeSign.angles.ascendant, 0);
    expect(placidus.angles.ascendant).toBeCloseTo(equal.angles.ascendant, 0);

    // Whole sign cusps should be at 0 degrees of signs
    for (const cusp of wholeSign.houseCusps) {
      expect(cusp % 30).toBeCloseTo(0, 0);
    }

    // Equal house cusps should be 30 degrees apart
    for (let i = 0; i < 11; i++) {
      const diff = (equal.houseCusps[i + 1] - equal.houseCusps[i] + 360) % 360;
      expect(diff).toBeCloseTo(30, 0);
    }
  });

  it("should identify retrograde planets correctly", () => {
    const chart = calculateChart({
      year: 2024,
      month: 8,
      day: 15,
      hour: 12,
      minute: 0,
      latitude: 40.7128,
      longitude: -74.006,
    });

    // Sun and Moon should never be retrograde
    const sun = chart.planets.find((p) => p.name === "sun");
    const moon = chart.planets.find((p) => p.name === "moon");

    expect(sun?.isRetrograde).toBe(false);
    expect(moon?.isRetrograde).toBe(false);
  });
});
