import type { Key, T } from "@/i18n/core";
import type { Tone } from "@/lib/tones";

/** Personal Hisab — shapes returned by /me/personal/* */

/** in / out: money that moved without being income or spending (only from the Mandal sync) */
export type EntryType = "expense" | "income" | "transfer" | "in" | "out";
/** what a person can add by hand */
export type ManualType = "expense" | "income" | "transfer";
export type WalletKind = "cash" | "bank" | "upi" | "card" | "other";

export interface PWallet {
  _id: string;
  name: string;
  key: string | null;
  kind: WalletKind;
  isArchived: boolean;
}
export interface PWalletWithBalance extends PWallet {
  openingBalancePaise: number;
  balancePaise: number;
  entryCount: number;
}

export interface PCategory {
  _id: string;
  kind: "expense" | "income";
  name: string;
  key: string | null;
  tone: Tone;
  /** icon name (see ./icons); null = suggested from the name */
  icon: string | null;
  monthlyBudgetPaise: number | null;
  isArchived: boolean;
}

export interface PEntry {
  _id: string;
  type: EntryType;
  amountPaise: number;
  date: string;
  note: string | null;
  wallet: PWallet | null;
  toWallet: PWallet | null;
  category: PCategory | null;
  /** copied from one of the person's Mandals: read-only except wallet and note */
  mandal: { organizationId: string; name: string | null; kind: string; part: "main" | "spend" } | null;
}

export interface MandalSync {
  enabled: boolean;
  walletId: string | null;
  fromDate: string | null;
  mandals: { organizationId: string; name: string; memberName: string; supported: boolean; entries: number }[];
}

export interface CategoryTotal {
  category: PCategory | null;
  totalPaise: number;
  count: number;
}

export interface Overview {
  month: string;
  today: string;
  totalBalancePaise: number;
  wallets: PWalletWithBalance[];
  monthTotals: { incomePaise: number; expensePaise: number; netPaise: number; previousExpensePaise: number };
  todayTotals: { incomePaise: number; expensePaise: number };
  overallBudget: { budgetPaise: number; spentPaise: number } | null;
  budgets: { category: PCategory; budgetPaise: number; spentPaise: number }[];
  spending: CategoryTotal[];
  income: CategoryTotal[];
  days: { date: string; incomePaise: number; expensePaise: number }[];
  recent: PEntry[];
  categories: PCategory[];
}

export interface EntryList {
  items: PEntry[];
  total: number;
  page: number;
  pageSize: number;
  totals: { incomePaise: number; expensePaise: number; transferPaise: number; inPaise: number; outPaise: number; netPaise: number };
}

export interface Summary {
  from: string;
  to: string;
  totals: { incomePaise: number; expensePaise: number; netPaise: number };
  spending: CategoryTotal[];
  income: CategoryTotal[];
  months: { month: string; incomePaise: number; expensePaise: number; netPaise: number }[];
}

export const TONES: Tone[] = ["orange", "amber", "emerald", "sky", "indigo", "violet", "pink", "rose", "slate"];
export const WALLET_KINDS: WalletKind[] = ["cash", "bank", "upi", "card", "other"];

/** Starter wallets / categories carry a key: show them in the person's language until renamed. */
export const walletName = (t: T, w: Pick<PWallet, "name" | "key"> | null | undefined) => (!w ? "—" : w.key ? t(`ph.wallet.${w.key}` as Key) : w.name);
export const categoryName = (t: T, c: Pick<PCategory, "name" | "key"> | null | undefined) => (!c ? t("ph.uncategorised") : c.key ? t(`ph.cat.${c.key}` as Key) : c.name);

export type Repeat = "once" | "weekly" | "monthly" | "yearly";
export const REMIND_BEFORE = [0, 15, 30, 60, 120, 180, 360, 720, 1440, 2880, 4320, 10080] as const;

export interface PReminder {
  _id: string;
  title: string;
  note: string | null;
  amountPaise: number | null;
  category: Pick<PCategory, "_id" | "name" | "key" | "tone" | "icon" | "kind"> | null;
  wallet: Pick<PWallet, "_id" | "name" | "key" | "kind"> | null;
  repeat: Repeat;
  dueDate: string;
  time: string;
  dueAt: string;
  remindBeforeMinutes: number;
  remindAt: string;
  notified: boolean;
  isActive: boolean;
  daysLeft: number;
  status: "overdue" | "today" | "soon" | "later" | "done";
  lastPaidDate: string | null;
}

export interface ReminderList {
  reminders: PReminder[];
  alerts: { _id: string; type: string; title: string; body: string; createdAt: string; unread: boolean }[];
}

const MANDAL_KIND: Record<string, string> = {
  hapta_collection: "hapta",
  other_income: "paid",
  member_joining: "joining",
  fund_loan_given: "upadIn",
  withdrawal: "withdrawal",
  loan_disbursement: "loanIn",
  upad_advance_return: "advanceBack",
};
/** "Hapta paid", "Upad received", "Upad interest" … for an entry copied from a Mandal. */
export function mandalLabel(t: T, m: NonNullable<PEntry["mandal"]>) {
  if (m.kind === "fund_loan_payment") return t(m.part === "spend" ? "ph.mandal.kinds.upadInterest" : "ph.mandal.kinds.upadRepaid");
  if (m.kind === "loan_repayment") return t(m.part === "spend" ? "ph.mandal.kinds.loanInterest" : "ph.mandal.kinds.loanRepaid");
  const k = MANDAL_KIND[m.kind];
  return k ? t(`ph.mandal.kinds.${k}` as Key) : t("ph.mandal.kinds.other");
}
