export function formatTransitDuration(days: number | null): string | null {
  if (days === null || days === undefined) return null;

  if (days < 1) return "< 1 day";
  if (days < 7) {
    const d = Math.round(days);
    return `~${d} ${d === 1 ? "day" : "days"}`;
  }
  if (days < 30) {
    const w = Math.round(days / 7);
    return `~${w} ${w === 1 ? "week" : "weeks"}`;
  }
  if (days < 365) {
    const m = Math.round(days / 30);
    return `~${m} ${m === 1 ? "month" : "months"}`;
  }
  const y = Math.round(days / 365);
  return `~${y} ${y === 1 ? "year" : "years"}`;
}
