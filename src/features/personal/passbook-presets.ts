/** Shared by the Passbook page (server) and its filters (browser). */
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

/** This month, last month, last 3 months, this year — all ending today at the latest. */
export function passbookPresets(today: string) {
  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1];
  return [
    { key: "thisMonth", from: iso(utc(y, m, 1)), to: today },
    { key: "lastMonth", from: iso(utc(y, m - 1, 1)), to: iso(utc(y, m, 0)) },
    { key: "last3", from: iso(utc(y, m - 2, 1)), to: today },
    { key: "thisYear", from: `${y}-01-01`, to: today },
  ] as const;
}
