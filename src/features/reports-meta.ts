import type { Key } from "@/i18n/core";

export interface ReportMeta {
  kind: string;
  title: Key;
  description: Key;
  permission: string;
  filters: ("range" | "asOf" | "groupBy" | "scheme" | "event" | "account" | "method")[];
}

export const REPORTS: ReportMeta[] = [
  { kind: "collections", title: "rep.k.collections.title", description: "rep.k.collections.desc", permission: "reports.view", filters: ["range", "groupBy"] },
  { kind: "hapta", title: "rep.k.hapta.title", description: "rep.k.hapta.desc", permission: "reports.view", filters: ["range", "scheme"] },
  { kind: "overdue", title: "rep.k.overdue.title", description: "rep.k.overdue.desc", permission: "reports.view", filters: ["scheme"] },
  { kind: "donations", title: "rep.k.donations.title", description: "rep.k.donations.desc", permission: "reports.view", filters: ["range", "event", "method"] },
  { kind: "events", title: "rep.k.events.title", description: "rep.k.events.desc", permission: "reports.view", filters: ["range", "event"] },
  { kind: "loans", title: "rep.k.loans.title", description: "rep.k.loans.desc", permission: "loans.view", filters: [] },
  { kind: "interest", title: "rep.k.interest.title", description: "rep.k.interest.desc", permission: "reports.sensitive", filters: ["range"] },
  { kind: "income-expense", title: "rep.k.incomeExpense.title", description: "rep.k.incomeExpense.desc", permission: "reports.sensitive", filters: ["range"] },
  { kind: "cash-flow", title: "rep.k.cashFlow.title", description: "rep.k.cashFlow.desc", permission: "reports.sensitive", filters: ["range"] },
  { kind: "account-summary", title: "rep.k.accountSummary.title", description: "rep.k.accountSummary.desc", permission: "reports.sensitive", filters: ["range", "account"] },
  { kind: "trial-balance", title: "rep.k.trialBalance.title", description: "rep.k.trialBalance.desc", permission: "reports.sensitive", filters: ["asOf"] },
  { kind: "balance-sheet", title: "rep.k.balanceSheet.title", description: "rep.k.balanceSheet.desc", permission: "reports.sensitive", filters: ["asOf"] },
];
