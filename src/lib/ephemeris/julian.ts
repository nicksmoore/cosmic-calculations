/**
 * Julian Day and time calculations
 * Based on Jean Meeus "Astronomical Algorithms"
 */

export const J2000 = 2451545.0;  // Julian Day for J2000.0 epoch

/**
 * Calculate Julian Day from calendar date
 * Algorithm from Meeus, Chapter 7
 */
export function calculateJulianDay(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): number {
  let y = year;
  let m = month;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  const dayFraction = (hour + minute / 60 + second / 3600) / 24;

  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    dayFraction +
    b -
    1524.5;

  return jd;
}

/**
 * Convert Julian Day to calendar date
 */
export function julianDayToDate(jd: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;

  let a: number;
  if (z < 2299161) {
    a = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }

  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  const dayFraction = f * 24;
  const hour = Math.floor(dayFraction);
  const minuteFraction = (dayFraction - hour) * 60;
  const minute = Math.floor(minuteFraction);
  const second = Math.round((minuteFraction - minute) * 60);

  return { year, month, day, hour, minute, second };
}

/**
 * Calculate centuries from J2000.0
 */
export function centuriesFromJ2000(jd: number): number {
  return (jd - J2000) / 36525.0;
}

/**
 * Calculate Delta T (difference between TT and UT)
 * Simplified polynomial approximation
 */
export function calculateDeltaT(year: number, month: number): number {
  const y = year + (month - 0.5) / 12;

  // For years 2005-2050, use polynomial
  if (y >= 2005 && y < 2050) {
    const t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }

  // For years 1986-2005
  if (y >= 1986 && y < 2005) {
    const t = y - 2000;
    return (
      63.86 +
      0.3345 * t -
      0.060374 * t * t +
      0.0017275 * t * t * t +
      0.000651814 * t * t * t * t +
      0.00002373599 * t * t * t * t * t
    );
  }

  // Default approximation
  return 69.0;
}

/**
 * Convert Julian Day (UT) to Julian Ephemeris Day (TT)
 */
export function utToTT(jd: number, year: number, month: number): number {
  const deltaT = calculateDeltaT(year, month);
  return jd + deltaT / 86400.0;
}
