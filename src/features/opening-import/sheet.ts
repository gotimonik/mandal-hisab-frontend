/**
 * The closing sheet of a Mandal that ran on paper: members, shares, savings and running upads.
 * Pure helpers (no React) so they can be tested: amounts, dates, and reading a sheet pasted from
 * Excel / Google Sheets or a CSV file.
 */

export interface UpadDraft {
  key: string;
  amount: string;
  monthlyRate: string;
  givenOn: string; // YYYY-MM-DD or ""
  interestDue: string;
}

export interface MemberDraft {
  key: string;
  memberId?: string;
  name: string;
  phone: string;
  shares: string;
  savings: string;
  upads: UpadDraft[];
}

let n = 0;
export const newKey = () => `${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export const emptyUpad = (): UpadDraft => ({ key: newKey(), amount: "", monthlyRate: "", givenOn: "", interestDue: "" });
export const emptyMember = (): MemberDraft => ({ key: newKey(), name: "", phone: "", shares: "1", savings: "", upads: [] });

/** "1,20,000.50" / "₹ 500" → paise. Empty → 0. Not a valid amount → null. */
export function toPaise(v: string | number | null | undefined): number | null {
  const s = String(v ?? "").replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
  if (s === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [r, p = ""] = s.split(".");
  return Number(r) * 100 + Number(p.padEnd(2, "0"));
}

/** Plain rupees for the API ("120000.5"), or "" when empty. */
export const cleanAmount = (v: string) => String(v ?? "").replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");

/** dd-mm-yyyy, dd/mm/yyyy, dd.mm.yyyy or yyyy-mm-dd → yyyy-mm-dd; anything else → "". */
export function toIsoDate(v: string): string {
  const s = (v ?? "").trim();
  let y: number, mo: number, d: number;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s))) [y, mo, d] = [Number(m[3]), Number(m[2]), Number(m[1])];
  else return "";
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return ""; // 31-31-2024, 30-02-2026 …
  return dt.toISOString().slice(0, 10);
}

/** Last day of the month before `todayIso` (the usual closing date). */
export function lastDayOfPrevMonth(todayIso: string): string {
  const [y, mo] = todayIso.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 0)).toISOString().slice(0, 10);
}

export const monthAfter = (iso: string) => {
  const [y, m] = iso.slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
};

/* ------------------------------------------------------------------ reading a pasted sheet */

type Col = "name" | "phone" | "shares" | "savings" | "upad" | "rate" | "interestDue" | "givenOn";
export const COLUMNS: Col[] = ["name", "phone", "shares", "savings", "upad", "rate", "interestDue", "givenOn"];

const ALIASES: [RegExp, Col][] = [
  [/^(name|member|member name|full name|નામ|सदस्य|नाम)$/, "name"],
  [/^(phone|mobile|mobile no|phone no|ફોન|મોબાઇલ|फ़ोन|फोन|मोबाइल)$/, "phone"],
  [/^(shares?|hapta shares?|no of shares|શેર|हिस्से|शेयर)$/, "shares"],
  [/^(savings?|balance|bachat|jama|total savings|બચત|જમા|बचत|जमा)$/, "savings"],
  [/^(upad|upad amount|loan|loan amount|upad baki|outstanding|ઉપાડ|उपाड|उधार)$/, "upad"],
  [/^(rate|interest rate|rate %|monthly rate|% per month|વ્યાજ દર|ब्याज दर)$/, "rate"],
  [/^(interest due|unpaid interest|vyaj baki|interest baki|બાકી વ્યાજ|बकाया ब्याज)$/, "interestDue"],
  [/^(upad date|given on|date|loan date|ઉપાડ તારીખ|तारीख)$/, "givenOn"],
];

function splitLine(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (ch === "," && !q) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export interface SheetRow {
  line: number;
  name: string;
  phone?: string;
  shares?: string;
  savings?: string;
  upad?: { amount: string; monthlyRate: string; interestDue: string; givenOn: string };
}

/**
 * Read rows pasted from a spreadsheet or a CSV file. With a header row the columns can be in any
 * order; without one they are taken as: name, phone, shares, savings, upad, rate, interest due, upad date.
 * A member with two upads is simply two rows with the same name.
 */
export function parseSheet(text: string): { rows: SheetRow[]; problems: string[] } {
  const lines = text.replace(/\r/g, "").split("\n").map((l, i) => ({ i: i + 1, cells: splitLine(l) })).filter((l) => l.cells.some((c) => c !== ""));
  const problems: string[] = [];
  if (!lines.length) return { rows: [], problems: ["Nothing to read — paste the rows first"] };
  let order: (Col | null)[] = COLUMNS;
  const header = lines[0].cells.map((c) => ALIASES.find(([re]) => re.test(c.trim().toLowerCase()))?.[1] ?? null);
  if (header.includes("name")) {
    order = header;
    lines.shift();
  }
  const rows: SheetRow[] = [];
  for (const l of lines) {
    const v: Partial<Record<Col, string>> = {};
    order.forEach((col, k) => {
      if (col && l.cells[k] !== undefined && l.cells[k] !== "") v[col] = l.cells[k];
    });
    if (!v.name) {
      problems.push(`Line ${l.i}: no name`);
      continue;
    }
    const bad = (["shares", "savings", "upad", "interestDue"] as Col[]).filter((c) => v[c] !== undefined && toPaise(v[c]) === null);
    if (bad.length) problems.push(`Line ${l.i} (${v.name}): ${bad.join(", ")} is not a number`);
    if (v.givenOn && !toIsoDate(v.givenOn)) problems.push(`Line ${l.i} (${v.name}): upad date "${v.givenOn}" — use DD-MM-YYYY`);
    const upadPaise = toPaise(v.upad);
    rows.push({
      line: l.i,
      name: v.name.replace(/\s+/g, " "),
      phone: v.phone,
      shares: v.shares,
      savings: v.savings !== undefined ? cleanAmount(v.savings) : undefined,
      upad: upadPaise ? { amount: cleanAmount(v.upad!), monthlyRate: (v.rate ?? "").replace("%", "").trim(), interestDue: cleanAmount(v.interestDue ?? ""), givenOn: toIsoDate(v.givenOn ?? "") } : undefined,
    });
  }
  return { rows, problems };
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const digits = (s?: string) => (s ?? "").replace(/\D/g, "").slice(-10);

/**
 * Put pasted rows into the list: a row whose name (or 10-digit phone) is already there fills in
 * that member; others are added. Repeated names in the paste only add their upad.
 */
export function mergeRows(members: MemberDraft[], rows: SheetRow[]): { members: MemberDraft[]; added: number; updated: number; upads: number } {
  const out = members.map((m) => ({ ...m, upads: [...m.upads] }));
  const touched = new Set<string>();
  let added = 0;
  let updated = 0;
  let upads = 0;
  for (const r of rows) {
    let m = out.find((x) => norm(x.name) === norm(r.name)) ?? (digits(r.phone).length === 10 ? out.find((x) => digits(x.phone) === digits(r.phone)) : undefined);
    if (!m) {
      m = { ...emptyMember(), name: r.name };
      // a blank card left at the end gets used rather than kept empty
      const blank = out.findIndex((x) => !x.name.trim() && !x.memberId);
      if (blank >= 0) out.splice(blank, 1, m);
      else out.push(m);
      added++;
    } else if (!touched.has(m.key)) updated++;
    if (!touched.has(m.key)) {
      if (r.phone) m.phone = r.phone;
      if (r.shares) m.shares = r.shares;
      if (r.savings !== undefined) m.savings = r.savings;
      // a fresh paste replaces the upads typed for this member before
      if (r.upad) m.upads = [];
      touched.add(m.key);
    }
    if (r.upad) {
      m.upads.push({ key: newKey(), ...r.upad });
      upads++;
    }
  }
  return { members: out, added, updated, upads };
}

export const TEMPLATE_CSV = [
  "Name,Phone,Shares,Savings,Upad,Rate,Interest due,Upad date",
  "Ramesh Patel,9876500001,3,54000,20000,1.5,600,10-03-2025",
  "Ramesh Patel,,,,5000,2,0,05-08-2026",
  "Suresh Shah,9876500002,2,36000,,,,",
].join("\n");
