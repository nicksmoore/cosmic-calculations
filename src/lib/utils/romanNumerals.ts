/**
 * Roman Numeral Utilities
 * Based on traditional astrological notation (House I, House II, etc.)
 * Reference: Guided Astrology Workbook by Stefanie Caponi
 */

const ROMAN_NUMERALS: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "XI",
  12: "XII",
};

/**
 * Convert a house number (1-12) to Roman numerals
 */
export function toRomanNumeral(num: number): string {
  return ROMAN_NUMERALS[num] || num.toString();
}

/**
 * Get house label with Roman numeral (e.g., "House IV")
 */
export function getHouseLabel(houseNumber: number): string {
  return `House ${toRomanNumeral(houseNumber)}`;
}

/**
 * Get ordinal house cusp label (e.g., "4th House Cusp" or "Ascendant")
 */
export function getHouseCuspLabel(houseNumber: number): string {
  if (houseNumber === 1) return "Ascendant";
  if (houseNumber === 4) return "IC (Imum Coeli)";
  if (houseNumber === 7) return "Descendant";
  if (houseNumber === 10) return "Midheaven (MC)";
  return `${toRomanNumeral(houseNumber)} House Cusp`;
}
