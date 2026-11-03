import type { Key, T } from "@/i18n/core";
import type { Tone } from "@/lib/tones";

/** Personal Hisab — shapes returned by /me/personal/* */

export type EntryType = "expense" | "income" | "transfer";
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
  totals: { incomePaise: number; expensePaise: number; transferPaise: number; netPaise: number };
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
