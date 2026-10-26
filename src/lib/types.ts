/** Shapes returned by the MandalHisab API (ids and dates arrive as strings). */

export type Role = "admin" | "manager" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  isPlatformAdmin: boolean;
}

export interface MyOrg {
  membershipId: string;
  role: Role;
  membershipStatus: "active" | "pending";
  memberId: string | null;
  id: string;
  name: string;
  code: string;
  status: "pending" | "active" | "suspended" | "archived";
  logoUrl: string | null;
}

export interface Me {
  user: User;
  organizations: MyOrg[];
  /** pending invitations to other Mandals (shown as a banner) */
  invitations?: { id: string; role: string; organization: { _id: string; name: string }; invitedByName: string | null }[];
}

export interface ExpenseCategory {
  key: string;
  name: string;
  isActive: boolean;
}

export interface ManagerPermissions {
  canCreateLoans: boolean;
  canApproveLoans: boolean;
  canModifyInterest: boolean;
  canApproveExpenses: boolean;
  canVerifyPayments: boolean;
  canManageSchemes: boolean;
  canAccessSensitiveReports: boolean;
  canManageAccounts: boolean;
  canRecordWithdrawals: boolean;
  canDistributeInterest: boolean;
}

export interface MonthlyHaptaSettings {
  schemeId: string;
  amountPaise: number;
  dueDay: number;
  startDate: string;
}

export interface InterestSettings {
  defaultMode: "manual" | "rate";
  monthlyRate: string;
  basis: "previous_month_closing" | "hapta_contributions";
}

export interface OrgSettings {
  financialYearStartMonth: number;
  currency: "INR";
  timezone: string;
  receiptPrefix: string;
  requirePaymentVerification: boolean;
  expenseApprovalThresholdPaise: number;
  reminderDaysBefore: number[];
  overdueReminderEveryDays: number;
  managerPermissions: ManagerPermissions;
  expenseCategories: ExpenseCategory[];
  paymentMethods: string[];
  installmentHorizonMonths: number;
  monthlyHapta: MonthlyHaptaSettings | null;
  haptaTreatment: "member_savings" | "income";
  interest: InterestSettings;
  withdrawals: { allowExceptions: boolean };
  fundLoans: { defaultMonthlyRate: string; dueDay: number; allowMemberRequests: boolean };
  membership: { discoverable: boolean; allowJoinRequests: boolean; autoCreateMember: boolean };
}

export interface Org {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  registrationNumber: string | null;
  registrationDetails: string | null;
  status: "pending" | "active" | "suspended" | "archived";
  statusReason: string | null;
  settings: OrgSettings;
  myRole: Role;
  myPermissions: string[];
  myMemberId: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Member {
  _id: string;
  membershipNumber: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  joiningDate: string;
  status: "active" | "inactive" | "left";
  userId?: string | null;
  notes?: string;
  /** haptas paid each month (default 1) */
  haptaShares?: number;
  outstandingPaise?: number;
  dueInstallments?: number;
  balancePaise?: number;
}

export interface Scheme {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  frequency: string;
  customInterval?: { unit: string; count: number } | null;
  dueDay?: number | null;
  amountPaise: number;
  amountMode: "fixed" | "member_specific";
  numberOfInstallments?: number | null;
  targetAmountPaise?: number | null;
  graceDays: number;
  lateFee: { enabled: boolean; type: "fixed" | "percent"; value: number; graceDays: number };
  status: "draft" | "active" | "paused" | "closed";
  amountRevisions: { effectiveFrom: string; amountPaise: number; reason?: string; createdAt: string }[];
  overrides: { sequence: number; dueDate?: string; amountPaise?: number; skip?: boolean; reason: string; createdAt: string }[];
  notes?: string;
  enrolledMembers?: number;
  duePaise?: number;
  collectedPaise?: number;
}

export interface Installment {
  _id: string;
  schemeId: string;
  memberId: string;
  sequence: number;
  periodLabel: string;
  dueDate: string;
  amountPaise: number;
  penaltyPaise: number;
  paidPaise: number;
  penaltyPaidPaise: number;
  state: string;
  stateReason?: string;
  status: string;
  outstandingPaise: number;
  schemeName?: string;
  member?: { _id: string; name: string; membershipNumber: string } | null;
}

export interface Payment {
  _id: string;
  kind: string;
  memberId?: string | null;
  payerName?: string;
  amountPaise: number;
  date: string;
  method: string;
  reference?: string;
  accountId?: string | null;
  accountName?: string | null;
  allocations: { installmentId: string; amountPaise: number; penaltyPaise: number }[];
  eventName?: string;
  notes?: string;
  status: "pending" | "verified" | "rejected" | "reversed";
  source: "staff" | "member_request";
  receiptId?: string;
  rejectedReason?: string;
  reversalReason?: string;
  createdAt: string;
}

export interface Account {
  _id: string;
  name: string;
  type: "cash" | "bank" | "upi" | "other";
  bankName?: string;
  accountNumberLast4?: string;
  ifsc?: string;
  upiId?: string;
  openingBalancePaise: number;
  openingDate: string;
  isActive: boolean;
  balancePaise: number;
  totalInPaise: number;
  totalOutPaise: number;
}

export interface Txn {
  _id: string;
  number: string;
  type: string;
  date: string;
  amountPaise: number;
  description: string;
  reversedBy?: string | null;
  reversalOf?: string | null;
  reason?: string;
  lines: { accountKey: string; debitPaise: number; creditPaise: number }[];
}

export interface LoanRow {
  sequence: number;
  dueDate: string;
  openingPrincipalPaise: number;
  principalDuePaise: number;
  interestDuePaise: number;
  totalDuePaise: number;
  principalPaidPaise: number;
  interestPaidPaise: number;
  penaltyPaise: number;
  penaltyPaidPaise: number;
  status: string;
  outstandingPaise?: number;
  rateApplied: string;
}

export interface LoanSummary {
  outstandingPrincipalPaise: number;
  interestChargedPaise: number;
  interestPaidPaise: number;
  interestOutstandingPaise: number;
  penaltyOutstandingPaise: number;
  overdueAmountPaise: number;
  overdueInstallments: number;
  scheduledInterestPaise: number;
  nextDue: { sequence: number; dueDate: string; amountPaise: number } | null;
}

export interface Loan {
  _id: string;
  loanNumber: string;
  memberId: string;
  purpose?: string;
  requestedPaise: number;
  approvedPaise?: number | null;
  principalPaise?: number | null;
  interestMethod: "simple" | "compound" | "flat" | "reducing_balance";
  annualRate: string;
  rateInput: { value: string; period: string };
  compoundingPerYear?: number | null;
  dayCount: string;
  tenure: number;
  repaymentFrequency: string;
  firstDueDate?: string | null;
  disbursedOn?: string | null;
  graceDays: number;
  allocationOrder: string[];
  prepaymentMode: string;
  status: "applied" | "approved" | "rejected" | "active" | "closed";
  rateHistory: { annualRate: string; effectiveFrom: string; reason?: string }[];
  schedule: LoanRow[];
  outstandingPrincipalPaise: number;
  totalInterestPaidPaise: number;
  totalPenaltyPaidPaise: number;
  totalPrincipalPaidPaise: number;
  rejectionReason?: string;
  member?: { name: string; membershipNumber: string } | null;
  summary?: LoanSummary | null;
  notes?: string;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  sourceType: string;
  payerName: string;
  amountPaise: number;
  date: string;
  method: string;
  reference?: string;
  lines: { description: string; amountPaise: number }[];
  status: "valid" | "cancelled";
  issuedAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ savings (monthly hapta, interest, withdrawals) */

export type MemberEntryKind = "opening" | "hapta" | "interest" | "withdrawal" | "adjustment" | "reversal";

export interface MemberLedgerLine {
  _id: string;
  date: string;
  kind: MemberEntryKind;
  creditPaise: number;
  debitPaise: number;
  description: string;
  period?: string;
  balancePaise?: number;
  recordedByName: string | null;
  reversalOf?: string | null;
}

export interface MemberLedger {
  member: { _id: string; name: string; membershipNumber: string; balancePaise?: number; phone?: string };
  from: string | null;
  to: string;
  openingBalancePaise: number;
  lines: MemberLedgerLine[];
  totals: { openingCreditsPaise: number; haptaPaise: number; interestPaise: number; withdrawalsPaise: number; adjustmentsPaise: number };
  closingBalancePaise: number | null;
  currentBalancePaise: number;
}

export interface MonthRow {
  installmentId: string;
  memberId: string;
  member: { _id: string; name: string; membershipNumber: string; phone?: string } | null;
  /** hapta shares this month (3 = pays 3 × the monthly amount) */
  shares?: number;
  periodLabel: string;
  dueDate: string;
  expectedPaise: number;
  collectedPaise: number;
  outstandingPaise: number;
  status: string;
  state: string;
  lastPaymentDate: string | null;
  recordedBy: string[];
  payments: { _id: string; date: string; receiptId?: string; amountPaise: number }[];
}

export interface MonthView {
  month: string;
  from: string;
  to: string;
  scheme: { _id: string; name: string; isPrimary: boolean } | null;
  monthlyHapta: MonthlyHaptaSettings | null;
  rows: MonthRow[];
  notEnrolled: { _id: string; name: string; membershipNumber: string }[];
  summary: {
    members: number;
    expectedPaise: number;
    collectedPaise: number;
    outstandingPaise: number;
    paid: number;
    partiallyPaid: number;
    pending: number;
    overdue: number;
    waived: number;
    cashReceivedInMonthPaise: number;
  };
}

export interface Withdrawal {
  _id: string;
  number: string;
  memberId: string;
  amountPaise: number;
  date: string;
  accountId: string;
  note?: string;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  exceptionReason?: string | null;
  status: "paid" | "reversed";
  reversalReason?: string;
  member?: { _id: string; name: string; membershipNumber: string } | null;
  recordedByName?: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ loans from the Mandal fund */

export interface FundLoan {
  _id: string;
  number: string;
  memberId: string;
  member: { _id: string; name: string; membershipNumber: string } | null;
  principalPaise: number;
  outstandingPaise: number;
  monthlyRate: string;
  date: string;
  firstInterestMonth: string;
  note?: string;
  status: "active" | "closed" | "cancelled";
  cancelReason?: string;
  interestDuePaise: number;
  unpaidMonths: string[];
  interestPaidPaise: number;
  nextInterestPaise: number;
}

export interface FundLoanList {
  items: FundLoan[];
  totals: { outstandingPaise: number; interestDuePaise: number; interestPaidPaise: number; activeLoans: number };
  defaultMonthlyRate: string;
}

export interface FundLoanMonthRow {
  loanId: string;
  number: string;
  memberId: string;
  member: { _id: string; name: string; membershipNumber: string } | null;
  outstandingPaise: number;
  monthlyRate: string;
  thisMonth: { period: string; principalBasisPaise: number; interestPaise: number; paidPaise: number; dueDate: string } | null;
  carriedForwardPaise: number;
  carriedForwardMonths: string[];
  totalDuePaise: number;
  status: string;
}

export interface FundLoanMonth {
  month: string;
  rows: FundLoanMonthRow[];
  summary: { loans: number; interestThisMonthPaise: number; collectedThisMonthPaise: number; totalDuePaise: number };
}

export interface UpadRequest {
  _id: string;
  memberId: string;
  member?: { _id: string; name: string; membershipNumber: string; balancePaise?: number } | null;
  amountPaise: number;
  purpose?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  availableAtRequestPaise: number;
  decisionReason?: string;
  decidedAt?: string | null;
  loanId?: string | null;
  createdAt: string;
  withinAvailable?: boolean;
}

export interface MyUpadRequests {
  items: UpadRequest[];
  availablePaise: number;
  allowRequests: boolean;
  linked: boolean;
}

export interface UpadPaymentClaim {
  _id: string;
  memberId: string;
  member?: { _id: string; name: string; membershipNumber: string } | null;
  loanId: string;
  loanNumber: string;
  interestPaise: number;
  principalPaise: number;
  date: string;
  method: string;
  reference?: string;
  notes?: string;
  status: "pending" | "verified" | "rejected";
  rejectedReason?: string;
  createdAt: string;
  /** the admin already recorded this money with Receive */
  alreadyRecorded?: { paymentId: string; date: string; interestPaise: number; principalPaise: number; receiptId: string } | null;
}
