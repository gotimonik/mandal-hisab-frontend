import { format, parseISO } from "date-fns";

/** Indian grouping, from integer paise: 12500050 → ₹1,25,000.50 */
export function formatINR(paise: number | null | undefined, opts: { symbol?: boolean; decimals?: boolean } = {}): string {
  const p = paise ?? 0;
  const neg = p < 0;
  const abs = Math.abs(p);
  const r = Math.trunc(abs / 100).toString();
  const f = String(abs % 100).padStart(2, "0");
  let g = r;
  if (r.length > 3) g = `${r.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${r.slice(-3)}`;
  const dec = opts.decimals === false ? "" : `.${f}`;
  return `${neg ? "-" : ""}${opts.symbol === false ? "" : "₹"}${g}${dec}`;
}

/** Compact for dashboards: ₹1.25 L, ₹2.10 Cr */
export function formatINRCompact(paise: number): string {
  const rupees = paise / 100;
  const abs = Math.abs(rupees);
  if (abs >= 1e7) return `₹${(rupees / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(rupees / 1e5).toFixed(2)} L`;
  return formatINR(paise, { decimals: abs < 1000 });
}

export function paiseToRupeeInput(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "";
  const r = Math.trunc(paise / 100);
  const f = Math.abs(paise % 100);
  return f ? `${r}.${String(f).padStart(2, "0")}` : String(r);
}

function toDate(d: string | Date): Date {
  if (d instanceof Date) return d;
  return parseISO(d.length === 10 ? `${d}T00:00:00Z` : d);
}

/** Calendar date (stored as UTC midnight) → dd MMM yyyy, e.g. 05 Apr 2026 */
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = toDate(d);
  const utc = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  return format(utc, "dd MMM yyyy");
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(toDate(d));
}

/** YYYY-MM-DD for <input type="date"> */
export function isoDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  return toDate(d).toISOString().slice(0, 10);
}

export function todayISO(timeZone = "Asia/Kolkata"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  bimonthly: "Every 2 months",
  every_three_months: "Every 3 months",
  quarterly: "Quarterly (FY quarters)",
  half_yearly: "Half-yearly",
  yearly: "Yearly",
  custom: "Custom interval",
  one_time: "One-time",
};

export const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  card: "Card",
};

export function label(map: Record<string, string>, key: string | null | undefined) {
  if (!key) return "—";
  return map[key] ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function newIdempotencyKey(prefix = "k") {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}-${rnd}`;
}

/** ₹500 for whole rupees, ₹500.50 otherwise — for buttons and big figures. */
export function formatINRShort(paise: number | null | undefined): string {
  const p = paise ?? 0;
  return formatINR(p, { decimals: p % 100 !== 0 });
}
