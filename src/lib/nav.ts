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
