export function timezoneFromLongitude(longitude: number | null | undefined): string {
  if (typeof longitude !== "number" || Number.isNaN(longitude)) {
    return "UTC+0";
  }

  const tzOffset = Math.round(longitude / 15);
  return `UTC${tzOffset >= 0 ? "+" : ""}${tzOffset}`;
}
