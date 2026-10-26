/** YYYY-MM helpers (UTC, no time zones involved). */
export const addMonthsYM = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
};
export const monthLabelYM = (m: string) => new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));
/** months from `from` to `to` inclusive (0 if to < from) */
export const monthsBetween = (from: string, to: string) => {
  const [a, b] = from.split("-").map(Number);
  const [c, d] = to.split("-").map(Number);
  return Math.max(0, (c - a) * 12 + (d - b) + 1);
};
/** How long the Mandal runs → its last month. */
export const DURATIONS = [
  ["", "No end date"],
  ["12", "1 year"],
  ["24", "2 years"],
  ["36", "3 years"],
  ["60", "5 years"],
  ["custom", "Until a month I choose"],
] as const;
export const endMonthFor = (start: string, duration: string, custom?: string) => (duration === "custom" ? custom || undefined : duration ? addMonthsYM(start, Number(duration) - 1) : undefined);
