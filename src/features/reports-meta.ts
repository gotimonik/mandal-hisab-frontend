export interface ReportMeta {
  kind: string;
  title: string;
  description: string;
  permission: string;
  filters: ("range" | "asOf" | "groupBy" | "scheme" | "event" | "account" | "method")[];
}

export const REPORTS: ReportMeta[] = [
  { kind: "collections", title: "Collections", description: "Money collected by period and category (daily, monthly, quarterly, yearly).", permission: "reports.view", filters: ["range", "groupBy"] },
  { kind: "hapta", title: "Hapta collection", description: "Due vs collected per scheme, with outstanding and overdue amounts.", permission: "reports.view", filters: ["range", "scheme"] },
  { kind: "overdue", title: "Pending & overdue installments", description: "Who owes what, how late, with contact numbers.", permission: "reports.view", filters: ["scheme"] },
  { kind: "donations", title: "Donations", description: "Donations by donor, event and payment method.", permission: "reports.view", filters: ["range", "event", "method"] },
  { kind: "events", title: "Event-wise", description: "Income and expenses tagged to each event.", permission: "reports.view", filters: ["range", "event"] },
  { kind: "loans", title: "Loans outstanding", description: "Outstanding principal, interest due and overdue per loan.", permission: "loans.view", filters: [] },
  { kind: "interest", title: "Interest", description: "Interest charged, received and outstanding, with calculation records.", permission: "reports.sensitive", filters: ["range"] },
  { kind: "income-expense", title: "Income & expenditure (P&L)", description: "Income and expenses by category with surplus or deficit.", permission: "reports.sensitive", filters: ["range"] },
  { kind: "cash-flow", title: "Cash flow", description: "Movement of cash and bank balances by activity. Transfers excluded.", permission: "reports.sensitive", filters: ["range"] },
  { kind: "account-summary", title: "Cash & bank summary", description: "Opening, receipts, payments and closing balance per account.", permission: "reports.sensitive", filters: ["range", "account"] },
  { kind: "trial-balance", title: "Trial balance", description: "All ledger accounts with debit and credit balances.", permission: "reports.sensitive", filters: ["asOf"] },
  { kind: "balance-sheet", title: "Balance sheet", description: "Assets, liabilities and funds as of a date.", permission: "reports.sensitive", filters: ["asOf"] },
];
