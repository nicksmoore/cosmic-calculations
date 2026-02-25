const SYNODIC_PERIOD = 29.53058867; // days

// Reference new moon: 2000-01-06 18:14 UTC (Julian Date 2451550.26)
const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

export interface MoonPhaseInfo {
  emoji: string;
  name: string;
  /** 0–1, where 0 = new moon, 0.5 = full moon */
  fraction: number;
}

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const elapsedDays = (date.getTime() - REF_NEW_MOON_MS) / 86_400_000;
  const age = ((elapsedDays % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD;
  const fraction = age / SYNODIC_PERIOD;

  if (fraction < 0.034 || fraction >= 0.966) return { emoji: "🌑", name: "New Moon",         fraction };
  if (fraction < 0.250)                      return { emoji: "🌒", name: "Waxing Crescent",   fraction };
  if (fraction < 0.284)                      return { emoji: "🌓", name: "First Quarter",     fraction };
  if (fraction < 0.500)                      return { emoji: "🌔", name: "Waxing Gibbous",    fraction };
  if (fraction < 0.534)                      return { emoji: "🌕", name: "Full Moon",         fraction };
  if (fraction < 0.750)                      return { emoji: "🌖", name: "Waning Gibbous",    fraction };
  if (fraction < 0.784)                      return { emoji: "🌗", name: "Last Quarter",      fraction };
  return                                            { emoji: "🌘", name: "Waning Crescent",   fraction };
}
