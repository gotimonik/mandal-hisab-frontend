export type NavIcon =
  | "dashboard"
  | "my"
  | "members"
  | "schemes"
  | "installments"
  | "collections"
  | "loans"
  | "expenses"
  | "donations"
  | "accounts"
  | "transactions"
  | "reports"
  | "notifications"
  | "settings"
  | "users"
  | "audit"
  | "monthly"
  | "interest"
  | "withdrawals"
  | "cashbook"
  | "fundloans";

import type { Tone } from "./tones";
import { makeT, type T } from "@/i18n/core";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  primary?: boolean; // shown in the mobile bottom bar
  more?: boolean; // grouped under "More" in the sidebar
  /** short label for the phone bottom bar */
  short?: string;
}

/** Navigation filtered by the caller's permissions (the API still enforces every rule). */
export function buildNav(orgId: string, perms: string[], role: string, t: T = makeT("en")): NavItem[] {
  const can = (p: string) => perms.includes(p);
  const base = `/org/${orgId}`;
  const staff = role !== "member";
  const items: (NavItem & { when: boolean })[] = [
    { href: base, label: t("nav.dashboard"), short: t("nav.short.home"), icon: "dashboard", primary: true, when: true },
    { href: `${base}/my`, label: role === "member" ? t("nav.mySavings") : t("nav.myAccount"), short: role === "member" ? t("nav.short.savings") : t("nav.short.account"), icon: "my", primary: role === "member", when: can("self.view") },
    { href: `${base}/monthly`, label: t("nav.monthly"), short: t("nav.short.hapta"), icon: "monthly", primary: true, when: can("installments.view") },
    { href: `${base}/members`, label: t("nav.members"), short: t("nav.short.members"), icon: "members", primary: true, when: can("members.view") },
    { href: `${base}/fund-loans`, label: t("nav.upad"), short: t("nav.short.upad"), icon: "fundloans", primary: true, when: can("members.view") },
    { href: `${base}/withdrawals`, label: t("nav.withdrawals"), icon: "withdrawals", when: can("members.view") },
    { href: `${base}/cashbook`, label: t("nav.cashbook"), icon: "cashbook", when: can("accounts.view") },
    { href: `${base}/reports`, label: t("nav.reports"), icon: "reports", when: can("reports.view") },
    { href: `${base}/notifications`, label: t("nav.notifications"), short: t("nav.short.alerts"), icon: "notifications", primary: role === "member", when: true },
    { href: `${base}/users`, label: t("nav.users"), icon: "users", when: can("memberships.manage") },
    { href: `${base}/settings`, label: t("nav.settings"), icon: "settings", when: can("org.settings.manage") },
    // Less-used tools
    { href: `${base}/collections`, label: t("nav.collections"), icon: "collections", more: true, when: can("payments.view") },
    { href: `${base}/installments`, label: t("nav.installments"), icon: "installments", more: true, when: can("installments.view") },
    { href: `${base}/schemes`, label: t("nav.schemes"), icon: "schemes", more: true, when: can("schemes.view") },
    { href: `${base}/interest`, label: t("nav.interest"), icon: "interest", more: true, when: can("reports.view") },
    { href: `${base}/loans`, label: t("nav.loans"), icon: "loans", more: true, when: can("loans.view") },
    { href: `${base}/expenses`, label: t("nav.expenses"), icon: "expenses", more: true, when: can("expenses.view") },
    { href: `${base}/donations`, label: t("nav.donations"), icon: "donations", more: true, when: can("payments.view") },
    { href: `${base}/accounts`, label: t("nav.accounts"), icon: "accounts", more: true, when: can("accounts.view") },
    { href: `${base}/transactions`, label: t("nav.transactions"), icon: "transactions", more: true, when: can("transactions.view") },
    { href: `${base}/audit`, label: t("nav.audit"), icon: "audit", more: true, when: can("audit.view") && staff },
  ];
  return items.filter((i) => i.when).map(({ when: _w, ...rest }) => rest);
}

export type QuickIcon = "collect" | "receive" | "give" | "withdraw" | "member" | "cash" | "summary" | "pay" | "request" | "statement";

export interface QuickAction {
  key: string;
  label: string;
  hint: string;
  href: string;
  icon: QuickIcon;
  tone: Tone;
}

/**
 * The "+" button in the phone bottom bar and the dashboard shortcut tiles. Each one deep-links
 * to the screen that does it, opening its form straight away where there is one (?new=1).
 */
export function buildQuickActions(orgId: string, perms: string[], role: string, opts: { live: boolean; memberRequests?: boolean } = { live: true }, t: T = makeT("en")): QuickAction[] {
  const can = (p: string) => perms.includes(p);
  const base = `/org/${orgId}`;
  const live = opts.live;
  const items: (QuickAction & { when: boolean })[] = [
    { key: "collect", label: t("quick.collect"), hint: "Cash from members", href: `${base}/monthly?show=due`, icon: "collect", tone: "indigo", when: live && can("payments.record") },
    { key: "receive", label: t("quick.receive"), hint: "Interest or return", href: `${base}/fund-loans`, icon: "receive", tone: "orange", when: live && can("payments.record") && can("members.view") },
    { key: "give", label: t("quick.give"), hint: "From the fund", href: `${base}/fund-loans?new=1`, icon: "give", tone: "amber", when: live && can("withdrawals.record") },
    { key: "withdraw", label: t("quick.withdraw"), hint: "Pay out savings", href: `${base}/withdrawals?new=1`, icon: "withdraw", tone: "rose", when: live && can("withdrawals.record") },
    { key: "member", label: t("quick.member"), hint: "New member", href: `${base}/members?new=1`, icon: "member", tone: "sky", when: can("members.manage") },
    { key: "cash", label: t("quick.cash"), hint: "Other cash", href: `${base}/cashbook?new=1`, icon: "cash", tone: "emerald", when: live && can("accounts.manage") },
    { key: "summary", label: t("quick.summary"), hint: "Who paid what", href: `${base}/monthly/report`, icon: "summary", tone: "violet", when: can("reports.view") && role !== "member" },
    // members
    { key: "pay", label: t("quick.pay"), hint: "Tell the treasurer", href: `${base}/my?pay=1`, icon: "pay", tone: "indigo", when: live && role === "member" && can("self.view") },
    { key: "request", label: t("quick.request"), hint: "From the Mandal", href: `${base}/my?tab=upad&new=1`, icon: "request", tone: "orange", when: live && role === "member" && !!opts.memberRequests && can("self.view") },
    { key: "statement", label: t("quick.statement"), hint: "Balance & receipts", href: `${base}/my`, icon: "statement", tone: "emerald", when: role === "member" && can("self.view") },
  ];
  return items.filter((i) => i.when).map(({ when: _w, ...rest }) => rest);
}
