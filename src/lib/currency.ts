/**
 * The Mandal's currency (settings.currency, ISO code). INR keeps Indian grouping and lakh/crore
 * short forms; other currencies use their own symbol and the usual 1,250,000.00 grouping.
 * Amounts are integer minor units ("paise") everywhere, so only 2-decimal currencies are offered.
 */
import { formatINR, formatINRCompact, formatINRShort } from "./format";

export const CURRENCIES = [
  { code: "INR", name: "Indian rupee" },
  { code: "USD", name: "US dollar" },
  { code: "GBP", name: "British pound" },
  { code: "EUR", name: "Euro" },
  { code: "CAD", name: "Canadian dollar" },
  { code: "AUD", name: "Australian dollar" },
  { code: "NZD", name: "New Zealand dollar" },
  { code: "AED", name: "UAE dirham" },
  { code: "SAR", name: "Saudi riyal" },
  { code: "QAR", name: "Qatari riyal" },
  { code: "SGD", name: "Singapore dollar" },
  { code: "MYR", name: "Malaysian ringgit" },
  { code: "HKD", name: "Hong Kong dollar" },
  { code: "KES", name: "Kenyan shilling" },
  { code: "TZS", name: "Tanzanian shilling" },
  { code: "ZAR", name: "South African rand" },
  { code: "MUR", name: "Mauritian rupee" },
  { code: "NPR", name: "Nepalese rupee" },
  { code: "FJD", name: "Fijian dollar" },
  { code: "CHF", name: "Swiss franc" },
] as const;

export const DEFAULT_CURRENCY = "INR";

export interface MoneyFmt {
  code: string;
  /** "₹", "$", "£", "AED" */
  symbol: string;
  /** ₹1,25,000.50 / $125,000.50 */
  fmt(paise: number | null | undefined): string;
  /** drops ".00" for whole amounts: ₹1,25,000 */
  short(paise: number | null | undefined): string;
  /** big figures: ₹1.25 L, $1.25M */
  compact(paise: number): string;
}

const localeFor = (code: string) => (code === "NPR" ? "en-IN" : "en-US");
const cache = new Map<string, MoneyFmt>();

export function moneyFmt(code: string | null | undefined): MoneyFmt {
  const c = code || DEFAULT_CURRENCY;
  const hit = cache.get(c);
  if (hit) return hit;
  let m: MoneyFmt;
  if (c === "INR") {
    m = { code: c, symbol: "₹", fmt: (p) => formatINR(p), short: formatINRShort, compact: formatINRCompact };
  } else {
    const nf = (digits: number) => new Intl.NumberFormat(localeFor(c), { style: "currency", currency: c, minimumFractionDigits: digits, maximumFractionDigits: digits });
    const two = nf(2);
    const zero = nf(0);
    const compactNf = new Intl.NumberFormat(localeFor(c), { style: "currency", currency: c, notation: "compact", maximumFractionDigits: 2 });
    const symbol = two.formatToParts(0).find((x) => x.type === "currency")?.value ?? c;
    const fmt = (p: number | null | undefined) => two.format((p ?? 0) / 100);
    const short = (p: number | null | undefined) => ((p ?? 0) % 100 === 0 ? zero.format((p ?? 0) / 100) : fmt(p));
    const compact = (p: number) => (Math.abs(p) >= 100_000_00 ? compactNf.format(p / 100) : Math.abs(p) >= 1000_00 ? zero.format(Math.round(p / 100)) : fmt(p));
    m = { code: c, symbol, fmt, short, compact };
  }
  cache.set(c, m);
  return m;
}
