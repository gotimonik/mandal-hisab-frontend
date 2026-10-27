/**
 * Google Analytics events for MandalHisab.
 *
 * PRIVACY RULE: never send names, emails, phone numbers, amounts, balances, notes,
 * references or IDs. Events say *what* happened ("payment_recorded"), never who or how much.
 * The only parameters allowed are short enum values (kind, purpose, role …) — see SAFE_PARAMS.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";
import type { FirebaseAnalyticsPlugin } from "@capacitor-firebase/analytics";

type Params = Record<string, string | number | boolean | undefined>;
type Gtag = (command: "event" | "set", name: string, params?: Record<string, unknown>) => void;

/**
 * Inside the iOS / Android app, events go to Firebase Analytics (the app's own stream, with
 * proper screen names) instead of the website tag, which isn't loaded in the app.
 */
const isApp = () => typeof window !== "undefined" && Capacitor.isNativePlatform();
// Talks to the native plugin by name only: importing the package itself would pull the
// Firebase JavaScript SDK (its web fallback) into the website, which we don't use.
// Never return the plugin from a Promise / async function: Capacitor plugin objects look
// "thenable", so awaiting one calls a native method named "then" that doesn't exist.
let plugin: FirebaseAnalyticsPlugin | null = null;
function firebase(): FirebaseAnalyticsPlugin {
  plugin ??= registerPlugin<FirebaseAnalyticsPlugin>("FirebaseAnalytics");
  return plugin;
}

function gtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === "function" ? g : null;
}

/** Send one event. A no-op when Google Analytics isn't loaded (development, blockers). */
export function track(name: string, params: Params = {}) {
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") clean[k] = v;
  if (isApp()) {
    // Page views become app screens, e.g. "/org/:id/monthly" (IDs already removed).
    if (name === "page_view") {
      const screen = String(clean.page_location ?? "").replace(/^https?:\/\/[^/]+/, "") || "/";
      firebase().setCurrentScreen({ screenName: screen, screenClassOverride: screen }).catch(() => {});
      return;
    }
    const p: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(clean)) p[k] = typeof v === "boolean" ? String(v) : v;
    firebase().logEvent({ name, params: p }).catch(() => {});
    return;
  }
  const g = gtag();
  if (g) g("event", name, clean);
  else if (process.env.NODE_ENV !== "production") console.debug("[analytics]", name, clean);
}

/** Who the visitor is in the current Mandal (admin / manager / member) — no identity. */
export function setAnalyticsRole(role: string | null) {
  if (isApp()) {
    firebase().setUserProperty({ key: "mandal_role", value: role ?? "none" }).catch(() => {});
    return;
  }
  gtag()?.("set", "user_properties", { mandal_role: role ?? "none" });
}

/* ------------------------------------------------------------ API actions → events */

/** Readable names for the main actions. Anything not listed gets an automatic name. */
const NAMES: Record<string, string> = {
  org_update: "settings_saved",
  organizations: "mandal_created",
  organizations_join: "join_requested",
  invitations_accept: "invitation_accepted",
  invitations_decline: "invitation_declined",
  notifications_read: "notification_read",
  auth_resend_verification: "verification_email_resent",
  auth_logout_all: "signed_out_everywhere",
  members: "member_added",
  members_update: "member_updated",
  members_import: "members_imported",
  members_opening: "opening_balance_set",
  members_adjustments: "member_balance_adjusted",
  invitations: "invitation_sent",
  invitations_revoke: "invitation_revoked",
  monthly_collect: "hapta_collected",
  monthly_enroll: "hapta_members_added",
  monthly_hapta: "monthly_hapta_set",
  payments: "payment_recorded",
  payments_verify: "payment_verified",
  payments_reject: "payment_rejected",
  payments_reverse: "payment_reversed",
  donations: "donation_recorded",
  donations_verify: "donation_verified",
  donations_reverse: "donation_reversed",
  expenses: "expense_recorded",
  expenses_approve: "expense_approved",
  expenses_reject: "expense_rejected",
  expenses_reimburse: "expense_reimbursed",
  expenses_reverse: "expense_reversed",
  withdrawals: "withdrawal_recorded",
  withdrawals_reverse: "withdrawal_reversed",
  fund_loans: "upad_given",
  fund_loans_payments: "upad_payment_received",
  fund_loans_cancel: "upad_cancelled",
  fund_loan_payments_reverse: "upad_payment_reversed",
  upad_requests_approve: "upad_request_approved",
  upad_requests_reject: "upad_request_rejected",
  upad_payments_verify: "upad_payment_verified",
  upad_payments_reject: "upad_payment_rejected",
  upad_payments_settle: "upad_payment_settled",
  me_payment_requests: "member_reported_payment",
  me_upad_requests: "upad_requested",
  me_upad_requests_cancel: "upad_request_cancelled",
  me_upad_payments: "member_reported_upad_payment",
  loans: "loan_applied",
  loans_approve: "loan_approved",
  loans_reject: "loan_rejected",
  loans_disburse: "loan_disbursed",
  loans_rate: "loan_rate_changed",
  loans_repayments: "loan_repayment_recorded",
  loans_repayments_reverse: "loan_repayment_reversed",
  interest_runs: "interest_credited",
  accounts: "account_created",
  accounts_update: "account_updated",
  transfers: "cash_transferred",
  adjustments: "account_adjusted",
  cashbook_entries: "cash_entry_recorded",
  transactions_reverse: "transaction_reversed",
  schemes: "scheme_created",
  end_month: "end_month_set",
  settlement_start: "settlement_started",
  settlement_payouts: "settlement_payout_made",
  settlement_close: "mandal_closed",
};

/** Calculations that don't change anything — not worth an event. */
const SKIP = new Set(["loans_preview", "interest_preview", "members_import_dry_run"]);

/** Only these body fields may be sent, and only when they hold a short enum-like value. */
const SAFE_PARAMS = ["kind", "purpose", "type", "direction", "role", "status", "mode", "paidBy", "frequency", "amountMode", "interestMethod", "repaymentFrequency"];
const ENUM = /^[a-z][a-z_]{0,29}$/;
const ID = /^[a-f0-9]{24}$/;

/** "/orgs/<id>/payments/<id>/verify" (POST) → "payments_verify" → "payment_verified". */
export function actionName(method: string, path: string, body?: unknown): string {
  const segs = path.split("?")[0].split("/").filter(Boolean);
  if (segs[0] === "orgs" && ID.test(segs[1] ?? "")) segs.splice(0, 2);
  const endsWithId = ID.test(segs.at(-1) ?? "");
  const words = segs.filter((s) => !ID.test(s)).map((s) => s.replace(/-/g, "_"));
  let key = words.join("_") || "org";
  if (method === "PATCH") key += "_update";
  else if (method === "DELETE") key += "_delete";
  else if (endsWithId && words.length === 0) key = "org_action";
  if (key === "members_import" && (body as { dryRun?: boolean } | undefined)?.dryRun) key = "members_import_dry_run";
  return NAMES[key] ?? key.slice(0, 40);
}

export function safeParams(body: unknown): Params {
  const out: Params = {};
  if (!body || typeof body !== "object") return out;
  for (const k of SAFE_PARAMS) {
    const v = (body as Record<string, unknown>)[k];
    if (typeof v === "string" && ENUM.test(v)) out[k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = v;
  }
  return out;
}

/** Called after every API action from the browser. */
export function trackApiResult(input: { path: string; method?: string; body?: unknown }, res: { ok: boolean; code?: string }) {
  const method = input.method ?? "POST";
  const name = actionName(method, input.path, input.body);
  if (SKIP.has(name)) return;
  if (res.ok) track(name, safeParams(input.body));
  else track("action_failed", { action: name, error_code: res.code ?? "error" });
}
