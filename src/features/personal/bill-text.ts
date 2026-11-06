import type { BillReading, UpiApp } from "./types";

/**
 * Turns the raw text read off a bill (by the on-phone reader, see ./bill-ocr) into a suggested
 * amount, date, shop, category and wallet for the "Add spending" form. Plain rules, no AI: it
 * looks for the grand total / net payable line, an Indian-style date, the shop name at the top,
 * and well-known shop and service names for the category. The person always checks the form
 * before saving, so a miss costs a few taps, never a wrong entry.
 */

export interface BillCategory {
  _id: string;
  kind: "expense" | "income";
  key: string | null;
  name: string;
  isArchived?: boolean;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** ૧૨૩ / १२३ → 123, ₹ look-alikes kept, odd spaces collapsed. */
export function normalizeBillText(s: string) {
  return s
    .replace(/[૦-૯]/g, (d) => String(d.charCodeAt(0) - 0x0ae6))
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(/[  -​]/g, " ")
    .replace(/[ \t]+/g, " ");
}

/* ------------------------------------------------------------------ amounts */

const AMOUNT = /(₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?!\s*%)(?![\d/:-])/gi;

interface Amount {
  value: number;
  rupeeSign: boolean;
  decimals: boolean;
}

function amountsIn(line: string): Amount[] {
  const out: Amount[] = [];
  for (const m of line.matchAll(AMOUNT)) {
    const raw = m[2];
    const before = line.slice(0, m.index);
    // part of a date, time, phone or GST number
    if (/[\d/:-]$/.test(before.trimEnd()) && !m[1]) continue;
    const digits = raw.replace(/[,.]/g, "");
    if (!raw.includes(",") && !raw.includes(".") && digits.length > 7) continue;
    const value = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) continue;
    out.push({ value, rupeeSign: !!m[1], decimals: /\.\d{1,2}$/.test(raw) });
  }
  return out;
}

const STRONG = ["grand total", "net payable", "net amount", "net amt", "amount payable", "total payable", "payable amount", "net total", "amount paid", "total amount", "total amt", "bill amount", "invoice total", "invoice amount", "to pay", "total due", "amount due", "નેટ રકમ", "કુલ રકમ", "ચૂકવવાની રકમ", "कुल राशि", "कुल रकम", "देय राशि", "शुद्ध राशि"];
const WEAK = ["total", "payable", "amount", "net", "કુલ", "रकम", "कुल", "योग"];
const NOT_TOTAL = ["sub total", "subtotal", "sub-total", "sub tot", "tax", "gst", "cgst", "sgst", "igst", "cess", "discount", "disc", "saving", "saved", "you save", "round", "change", "balance", "qty", "quantity", "no of item", "items", "item(s)", "mrp", "tender", "cash received", "points", "rate", "hsn", "taxable", "before"];

const has = (line: string, words: string[]) => words.some((w) => line.includes(w));

/** The bill's final amount: the grand total / net payable line, else the biggest ₹ amount. */
function findTotal(lines: string[], upi: boolean): number | null {
  const low = lines.map((l) => l.toLowerCase());
  let best: { tier: number; value: number } | null = null;
  low.forEach((l, i) => {
    const tier = has(l, STRONG) ? 2 : has(l, WEAK) ? 1 : 0;
    if (!tier || has(l, NOT_TOTAL)) return;
    // the amount is on this line (usually at the right) or, in some layouts, on the next one
    let found = amountsIn(lines[i]);
    if (!found.length && i + 1 < lines.length && !has(low[i + 1], NOT_TOTAL)) found = amountsIn(lines[i + 1]);
    if (!found.length) return;
    const value = found[found.length - 1].value;
    if (!best || tier > best.tier || (tier === best.tier && value > best.value)) best = { tier, value };
  });
  if (best) return (best as { value: number }).value;

  // payment screenshots: the big "₹500" (or a line that is just the amount)
  const signed = lines.flatMap((l) => amountsIn(l).filter((a) => a.rupeeSign));
  if (signed.length) return upi ? signed[0].value : Math.max(...signed.map((a) => a.value));
  if (upi) {
    const alone = lines.find((l) => /^\s*(₹|rs\.?|inr)?\s*[\d,]+(\.\d{1,2})?\s*$/i.test(l) && amountsIn(l).length === 1);
    if (alone) return amountsIn(alone)[0].value;
  }
  return null;
}

/* ------------------------------------------------------------------ dates */

const iso = (y: number, m: number, d: number) => {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return dt.toISOString().slice(0, 10);
};

function datesIn(line: string): string[] {
  const l = line.toLowerCase();
  const out: string[] = [];
  for (const m of l.matchAll(/\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/g)) {
    const v = iso(+m[1], +m[2], +m[3]);
    if (v) out.push(v);
  }
  for (const m of l.matchAll(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})\b/g)) {
    // Indian bills are day first; a "month" over 12 means it was written month first
    const v = iso(+m[3], +m[2], +m[1]) ?? iso(+m[3], +m[1], +m[2]);
    if (v) out.push(v);
  }
  for (const m of l.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?[\s\-/.,']*([a-z]{3})[a-z]*[\s\-/.,']*(\d{4}|\d{2})\b/g)) {
    const mi = MONTHS.indexOf(m[2]);
    const v = mi >= 0 ? iso(+m[3], mi + 1, +m[1]) : null;
    if (v) out.push(v);
  }
  for (const m of l.matchAll(/\b([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g)) {
    const mi = MONTHS.indexOf(m[1]);
    const v = mi >= 0 ? iso(+m[3], mi + 1, +m[2]) : null;
    if (v) out.push(v);
  }
  return out;
}

function findDate(lines: string[], today: string): string | null {
  const t = Date.parse(today);
  const ok = (d: string) => {
    const x = Date.parse(d);
    return x <= t + 86_400_000 && x >= t - 730 * 86_400_000;
  };
  const labelled = lines.filter((l) => /(date|dt\b|dated|તારીખ|दिनांक|तारीख)/i.test(l)).flatMap(datesIn).filter(ok);
  if (labelled.length) return labelled[0];
  return lines.flatMap(datesIn).filter(ok)[0] ?? null;
}

/* ------------------------------------------------------------------ shop / person */

const NOT_NAME = /(tax invoice|invoice|^bill\b|bill no|receipt|cash memo|memo|estimate|gstin|gst no|gst:|fssai|phone|ph[:.]|mob|tel[:.]|date|welcome|original|duplicate|copy|www\.|\.com|@|address|road|near|opp\b|pin\b|thank|customer|cashier|counter|token|order|table)/i;

const tidy = (s: string) => {
  const t = s.replace(/[|_*=~"`]+/g, " ").replace(/^[^\p{L}\d]+|[^\p{L}\d.)&]+$/gu, "").replace(/\s+/g, " ").trim();
  // "DMART AVENUE SUPERMARTS" → "Dmart Avenue Supermarts"
  return t === t.toUpperCase() && /[A-Z]{3}/.test(t) ? t.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : t;
};

function findName(lines: string[]): string | null {
  for (const l of lines.slice(0, 5)) {
    const letters = (l.match(/\p{L}/gu) ?? []).length;
    if (letters < 3 || letters / l.replace(/\s/g, "").length < 0.6 || NOT_NAME.test(l)) continue;
    const t = tidy(l);
    if (t.length >= 3) return t.slice(0, 60);
  }
  return null;
}

/* ------------------------------------------------------------------ category & wallet */

/** Shop and service names → the starter category they belong to. */
const CATEGORY_WORDS: Record<string, string[]> = {
  groceries: ["dmart", "d-mart", "d mart", "avenue supermarts", "reliance fresh", "reliance smart", "smart bazaar", "big bazaar", "more supermarket", "star bazaar", "jiomart", "bigbasket", "blinkit", "zepto", "grocery", "groceries", "grocer", "kirana", "provision", "supermarket", "hypermarket", "general store", "dairy", "amul", "vegetable", "sabji", "ration", "atta", "rice", "dal"],
  food: ["restaurant", "cafe", "café", "dhaba", "swiggy", "zomato", "pizza", "burger", "domino", "mcdonald", "kfc", "bakery", "sweets", "mithai", "dining", "juice", "ice cream", "lassi", "thali", "chinese", "biryani", "snacks", "pav bhaji", "dosa"],
  transport: ["petrol", "diesel", "fuel", "filling station", "service station", "indian oil", "iocl", "bharat petroleum", "bpcl", "hindustan petroleum", "hpcl", "cng", "uber", "ola", "rapido", "taxi", "irctc", "railway", "gsrtc", "metro", "toll", "fastag", "parking", "nayara"],
  bills: ["electricity", "torrent power", "dgvcl", "mgvcl", "ugvcl", "pgvcl", "gujarat gas", "adani gas", "gas bill", "recharge", "prepaid", "postpaid", "jio", "airtel", "vodafone", "bsnl", "broadband", "dth", "tata play", "water bill", "water tax", "municipal", "property tax", "internet", "wifi"],
  health: ["pharmacy", "pharma", "medical", "chemist", "medicine", "hospital", "clinic", "doctor", "apollo", "medplus", "netmeds", "pathology", "laboratory", "diagnostic", "dental", "tablet", "syrup", "capsule"],
  shopping: ["amazon", "flipkart", "myntra", "ajio", "meesho", "mall", "fashion", "garment", "clothing", "cloth", "saree", "footwear", "shoes", "electronics", "croma", "reliance digital", "trends", "westside", "pantaloons", "lifestyle", "mobile shop", "jewellers", "jewellery"],
  education: ["school", "college", "tuition", "classes", "academy", "university", "coaching", "stationery", "book store", "books"],
  home: ["rent", "maintenance", "society", "furniture", "hardware", "plumber", "electrician", "paint"],
  festival: ["temple", "mandir", "pooja", "puja", "prasad", "diwali", "navratri", "ganesh"],
};

const wordRe = (w: string) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "iu");

function findCategory(text: string, name: string | null, kind: "expense" | "income", categories: BillCategory[]): string | null {
  const live = categories.filter((c) => c.kind === kind && !c.isArchived);
  const inName = (re: RegExp) => !!name && re.test(name);
  let best: { id: string; score: number } | null = null;
  const consider = (id: string, score: number) => {
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  };
  // the person's own categories by name ("Milk", "Petrol" …) — skipping catch-alls — win a tie
  for (const c of live) {
    if (c.key === "other" || c.key === "other_income" || c.name.trim().length < 4) continue;
    const re = wordRe(c.name.trim().toLowerCase());
    consider(c._id, (re.test(text) ? 3 : 0) + (inName(re) ? 3 : 0));
  }
  if (kind === "expense") {
    // well-known shop and service words; the shop's own name counts most
    for (const [key, words] of Object.entries(CATEGORY_WORDS)) {
      const c = live.find((k) => k.key === key);
      if (!c) continue;
      consider(c._id, words.reduce((n, w) => { const re = wordRe(w); return n + (re.test(text) ? 1 : 0) + (inName(re) ? 2 : 0); }, 0));
    }
  }
  return (best as { id: string } | null)?.id ?? null;
}

const UPI = /(\bupi\b|google pay|\bgpay\b|phonepe|phone pe|paytm|\bbhim\b|\bvpa\b|upi ref|utr\b|@ok(axis|icici|sbi|hdfc)|@ybl|@paytm|@ibl|@axl)/i;

function findWallet(text: string): BillReading["walletKind"] {
  if (UPI.test(text)) return "upi";
  if (/(\bcard\b|\bvisa\b|master ?card|rupay|\bamex\b|[x*]{3,}\s?\d{4})/i.test(text)) return "card";
  if (/(paid by cash|cash paid|mode\s*:?\s*cash|payment\s*(mode)?\s*:?\s*cash|cash tendered|tender\s*:?\s*cash|by cash)/i.test(text)) return "cash";
  return null;
}

/** The app a UPI screenshot was taken in, from its name on the screen (not the UPI handle: that's the payee's bank). */
const UPI_APP_WORDS: [UpiApp, RegExp][] = [
  ["phonepe", /phone\s?pe/i],
  ["gpay", /(google\s?pay|\bg\s?pay\b)/i],
  ["paytm", /\bpaytm\b/i],
  ["amazonpay", /amazon\s?pay/i],
  ["bhim", /\bbhim\b/i],
];

export function findUpiApp(text: string): UpiApp | null {
  if (!UPI.test(text)) return null;
  return UPI_APP_WORDS.find(([, re]) => re.test(text))?.[0] ?? null;
}

/* ------------------------------------------------------------------ all together */

export function parseBillText(rawText: string, opts: { today: string; categories: BillCategory[] }): BillReading {
  const text = normalizeBillText(rawText);
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const upi = UPI.test(text);

  // payment screenshots say who it went to / came from
  let type: "expense" | "income" = "expense";
  let name: string | null = null;
  if (upi) {
    const low = lines.map((l) => l.toLowerCase());
    const from = low.findIndex((l) => /(received from|money received|credited|from:)/.test(l));
    const to = low.findIndex((l) => /(paid to|sent to|payment to|^to[:\s]|to:)/.test(l));
    if (from >= 0 && (to < 0 || from < to)) type = "income";
    const at = type === "income" ? from : to;
    if (at >= 0) {
      const rest = lines[at].replace(/.*?(received from|paid to|sent to|payment to|from:|to:|^to\b)\s*:?/i, "").trim();
      const candidate = rest && /\p{L}{2}/u.test(rest) ? rest : lines[at + 1];
      if (candidate && !/[@\d]{6,}/.test(candidate)) name = tidy(candidate).slice(0, 60) || null;
    }
  }
  name ??= findName(lines);

  const total = findTotal(lines, upi);
  const amount = total !== null && total >= 1 && total <= 10_000_000 ? total.toFixed(2) : null;
  const looksLikeBill = amount !== null || /(total|invoice|bill|receipt|gst|amount|payable|કુલ|बिल|कुल)/i.test(text) || upi;

  return {
    isBill: looksLikeBill,
    amount,
    date: findDate(lines, opts.today),
    merchant: name,
    type,
    categoryId: findCategory(text, name, type, opts.categories),
    walletKind: findWallet(text),
    upiApp: findUpiApp(text),
  };
}
