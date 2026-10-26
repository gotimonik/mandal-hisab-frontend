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

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  primary?: boolean; // shown in the mobile bottom bar
  more?: boolean; // grouped under "More" in the sidebar
}

/** Navigation filtered by the caller's permissions (the API still enforces every rule). */
export function buildNav(orgId: string, perms: string[], role: string): NavItem[] {
  const can = (p: string) => perms.includes(p);
  const base = `/org/${orgId}`;
  const staff = role !== "member";
  const items: (NavItem & { when: boolean })[] = [
    { href: base, label: "Dashboard", icon: "dashboard", primary: true, when: true },
    { href: `${base}/my`, label: role === "member" ? "My savings" : "My account", icon: "my", primary: role === "member", when: can("self.view") },
    { href: `${base}/monthly`, label: "Monthly hapta", icon: "monthly", primary: true, when: can("installments.view") },
    { href: `${base}/members`, label: "Members", icon: "members", primary: true, when: can("members.view") },
    { href: `${base}/fund-loans`, label: "Upad", icon: "fundloans", primary: true, when: can("members.view") },
    { href: `${base}/withdrawals`, label: "Withdrawals", icon: "withdrawals", when: can("members.view") },
    { href: `${base}/cashbook`, label: "Cash book", icon: "cashbook", when: can("accounts.view") },
    { href: `${base}/reports`, label: "Reports", icon: "reports", when: can("reports.view") },
    { href: `${base}/notifications`, label: "Notifications", icon: "notifications", primary: role === "member", when: true },
    { href: `${base}/users`, label: "Users & joining", icon: "users", when: can("memberships.manage") },
    { href: `${base}/settings`, label: "Settings", icon: "settings", when: can("org.settings.manage") },
    // Less-used tools
    { href: `${base}/collections`, label: "All collections", icon: "collections", more: true, when: can("payments.view") },
    { href: `${base}/installments`, label: "Installments", icon: "installments", more: true, when: can("installments.view") },
    { href: `${base}/schemes`, label: "Hapta schemes", icon: "schemes", more: true, when: can("schemes.view") },
    { href: `${base}/interest`, label: "Interest credit", icon: "interest", more: true, when: can("reports.view") },
    { href: `${base}/loans`, label: "EMI loans", icon: "loans", more: true, when: can("loans.view") },
    { href: `${base}/expenses`, label: "Expenses", icon: "expenses", more: true, when: can("expenses.view") },
    { href: `${base}/donations`, label: "Donations", icon: "donations", more: true, when: can("payments.view") },
    { href: `${base}/accounts`, label: "Accounts", icon: "accounts", more: true, when: can("accounts.view") },
    { href: `${base}/transactions`, label: "Transactions", icon: "transactions", more: true, when: can("transactions.view") },
    { href: `${base}/audit`, label: "Audit log", icon: "audit", more: true, when: can("audit.view") && staff },
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
export function buildQuickActions(orgId: string, perms: string[], role: string, opts: { live: boolean; memberRequests?: boolean } = { live: true }): QuickAction[] {
  const can = (p: string) => perms.includes(p);
  const base = `/org/${orgId}`;
  const live = opts.live;
  const items: (QuickAction & { when: boolean })[] = [
    { key: "collect", label: "Collect hapta", hint: "Cash from members", href: `${base}/monthly?show=due`, icon: "collect", tone: "indigo", when: live && can("payments.record") },
    { key: "receive", label: "Receive upad", hint: "Interest or return", href: `${base}/fund-loans`, icon: "receive", tone: "orange", when: live && can("payments.record") && can("members.view") },
    { key: "give", label: "Give upad", hint: "From the fund", href: `${base}/fund-loans?new=1`, icon: "give", tone: "amber", when: live && can("withdrawals.record") },
    { key: "withdraw", label: "Withdrawal", hint: "Pay out savings", href: `${base}/withdrawals?new=1`, icon: "withdraw", tone: "rose", when: live && can("withdrawals.record") },
    { key: "member", label: "Add member", hint: "New member", href: `${base}/members?new=1`, icon: "member", tone: "sky", when: can("members.manage") },
    { key: "cash", label: "Cash in / out", hint: "Other cash", href: `${base}/cashbook?new=1`, icon: "cash", tone: "emerald", when: live && can("accounts.manage") },
    { key: "summary", label: "Month summary", hint: "Who paid what", href: `${base}/monthly/report`, icon: "summary", tone: "violet", when: can("reports.view") && role !== "member" },
    // members
    { key: "pay", label: "I have paid", hint: "Tell the treasurer", href: `${base}/my?pay=1`, icon: "pay", tone: "indigo", when: live && role === "member" && can("self.view") },
    { key: "request", label: "Request upad", hint: "From the Mandal", href: `${base}/my?tab=upad&new=1`, icon: "request", tone: "orange", when: live && role === "member" && !!opts.memberRequests && can("self.view") },
    { key: "statement", label: "My savings", hint: "Balance & receipts", href: `${base}/my`, icon: "statement", tone: "emerald", when: role === "member" && can("self.view") },
  ];
  return items.filter((i) => i.when).map(({ when: _w, ...rest }) => rest);
}
