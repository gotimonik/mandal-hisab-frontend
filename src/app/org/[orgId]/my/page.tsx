import Link from "next/link";
import { HandCoins } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import { api, qs } from "@/lib/server/api";
import { getOrg, getMoney } from "@/lib/server/data";
import type { FundLoanList, MyUpadRequests, UpadPaymentClaim, Loan, MemberLedger, Paged, Payment, Receipt, Withdrawal } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { ChipLinks } from "@/components/app/chip-links";
import { Pagination } from "@/components/app/pagination";
import { MySchemes, type MySchemeRow } from "@/features/my/my-schemes";
import { METHOD_LABEL, formatDate, label } from "@/lib/format";
import { PaymentRequestDialog } from "@/features/my/payment-request";
import { StatementView, type Statement } from "@/features/statement/statement-view";
import { SavingsLedgerTable, SavingsSummary } from "@/features/savings/savings-ledger";
import { RequestUpadDialog } from "@/features/fund-loans/request-upad-dialog";
import { ActionButton } from "@/components/app/action-button";
import { getT } from "@/i18n/server";
import type { Key } from "@/i18n/core";

export const metadata = { title: "My savings" };

export default async function MyPage({ params, searchParams }: PageProps<"/org/[orgId]/my">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const TABS = ["schemes", "savings", "withdrawals", "fundloans", "payments", "receipts", "statement", "loans"] as const;
  type Tab = (typeof TABS)[number];
  const rawTab = sp.tab === "upad" ? "fundloans" : String(sp.tab ?? "schemes");
  const tab: Tab = (TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : "schemes";
  const page = Math.max(1, Number(sp.page) || 1);
  const PAGE_SIZE = 20;
  const { t } = await getT();
  const methodLabel = (m: string) => (m in METHOD_LABEL ? t(`pay.method.${m}` as Key) : label(METHOD_LABEL, m));
  const [org, me] = await Promise.all([getOrg(orgId), api<{ linked: boolean; member: { name: string; membershipNumber: string } | null }>(`/orgs/${orgId}/me`)]);
  // getOrg is already in flight above (and cached), so this resolves without a second wait
  const money = await getMoney(orgId);
  if (!me.linked) {
    return (
      <>
        <PageHeader title={t("my.title")} />
        <EmptyState title={t("my.notLinked")} description={t("my.notLinkedDesc")} />
      </>
    );
  }
  // Only what the header needs plus the active tab's own data is fetched, so each tab loads fast.
  const base = `/orgs/${orgId}/me`;
  const paged = qs({ page, pageSize: PAGE_SIZE });
  const [ledger, fundLoans, upadReqs, loans, schemes, withdrawals, payments, receipts, statement, upadClaims] = await Promise.all([
    api<MemberLedger>(`${base}/ledger`),
    api<FundLoanList>(`${base}/fund-loans`),
    api<MyUpadRequests>(`${base}/upad-requests`),
    api<Loan[]>(`${base}/loans`),
    tab === "schemes" ? api<MySchemeRow[]>(`${base}/schemes`) : null,
    tab === "withdrawals" ? api<Paged<Withdrawal>>(`${base}/withdrawals${paged}`) : null,
    tab === "payments" ? api<Paged<Payment>>(`${base}/payments${paged}`) : null,
    tab === "receipts" ? api<Paged<Receipt>>(`${base}/receipts${paged}`) : null,
    tab === "statement" ? api<Statement>(`${base}/statement`) : null,
    tab === "fundloans" ? api<UpadPaymentClaim[]>(`${base}/upad-payments`) : null,
  ]);
  const openRequest = upadReqs.items.find((r) => r.status === "pending");
  const canRequest = upadReqs.allowRequests && org.status === "active" && !openRequest;
  const myLoans = fundLoans.items.filter((l) => l.status !== "cancelled");
  const showUpad = myLoans.length > 0 || upadReqs.items.length > 0 || canRequest;
  const tabHref = (k: string) => `/org/${orgId}/my?tab=${k}`;
  const tabs = [
    { key: "schemes", label: t("my.tabSchemes") },
    { key: "savings", label: t("my.tabSavings") },
    { key: "withdrawals", label: t("my.tabWithdrawals") },
    ...(showUpad ? [{ key: "fundloans", label: t("my.tabUpad") }] : []),
    { key: "payments", label: t("my.tabPayments") },
    { key: "receipts", label: t("my.tabReceipts") },
    { key: "statement", label: t("my.tabStatement") },
    ...(loans.length > 0 ? [{ key: "loans", label: t("my.tabLoans") }] : []),
  ].map((x) => ({ ...x, href: tabHref(x.key) }));
  const pager = (total: number) => <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseHref={`/org/${orgId}/my`} params={{ tab }} />;
  return (
    <>
      <PageHeader title={me.member!.name} description={t("my.memberNo", { no: me.member!.membershipNumber })} actions={<PaymentRequestDialog methods={org.settings.paymentMethods} defaultOpen={sp.pay === "1"} />} />
      <div className="mb-4">
        <SavingsSummary l={ledger} currency={money.code} />
      </div>
      {fundLoans.totals.activeLoans > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-card p-3.5 text-sm shadow-card ring-2 ring-orange-400/30">
          <IconChip tone="orange">
            <HandCoins />
          </IconChip>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              {t("my.myUpad", { amount: money.short(fundLoans.totals.outstandingPaise) })}
            </span>
            <span className="text-xs text-muted-foreground">{t("my.payInterest")}</span>
          </span>
          <span className="text-right">
            <Money paise={fundLoans.totals.interestDuePaise} short className="block text-lg font-bold text-warning-ink" />
            <span className="text-[11px] text-muted-foreground">{t("my.interestDue")}</span>
          </span>
        </div>
      )}
      <ChipLinks items={tabs} current={tab} label={t("my.title")} />
      {tab === "schemes" && <MySchemes rows={schemes!} orgId={orgId} />}
      {tab === "savings" && (<>
          <SavingsLedgerTable l={ledger} csvHref={`/api/export${qs({ path: `/orgs/${orgId}/me/ledger` })}`} />
        </>)}
      {tab === "fundloans" && showUpad && (<div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-foreground/10">
              <span>
                {t("my.available")} <Money paise={upadReqs.availablePaise} className="font-semibold" />
                {(upadReqs.upadOutPaise ?? 0) > 0 && <span className="block text-xs text-muted-foreground">{t("upad.availableWhy", { fund: money.fmt(upadReqs.availablePaise + upadReqs.upadOutPaise!), out: money.fmt(upadReqs.upadOutPaise!) })}</span>}
              </span>
              {canRequest ? <RequestUpadDialog availablePaise={upadReqs.availablePaise} upadOutPaise={upadReqs.upadOutPaise} size="sm" defaultOpen={sp.new === "1"} /> : openRequest ? <span className="text-xs text-muted-foreground">{t("my.waitingApproval")}</span> : null}
            </div>
            {upadReqs.items.length > 0 && (
              <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
                {upadReqs.items.map((r) => (
                  <li key={r._id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>
                      {t("my.requestFor", { amount: money.fmt(r.amountPaise) })} <span className="text-muted-foreground">· {formatDate(r.createdAt)}</span>
                      {r.purpose && <span className="block text-xs text-muted-foreground">{r.purpose}</span>}
                      {r.status === "rejected" && r.decisionReason && <span className="block text-xs text-destructive">{t("my.notApproved", { reason: r.decisionReason })}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      {r.status === "pending" && (
                        <ActionButton path={`/orgs/${orgId}/me/upad-requests/${r._id}/cancel`} size="xs" variant="ghost" successMessage={t("my.requestCancelled")} confirm={{ title: t("my.cancelRequest"), confirmLabel: t("my.cancelRequestBtn") }}>
                          {t("my.cancel")}
                        </ActionButton>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {upadClaims!.length > 0 && (
              <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10" aria-label={t("my.reportedLabel")}>
                {upadClaims!.map((x) => (
                  <li key={x._id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>
                      {t("my.paidOn", { amount: money.fmt(x.interestPaise + x.principalPaise), number: x.loanNumber })} <span className="text-muted-foreground">· {formatDate(x.date)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {x.interestPaise > 0 && t("my.interestX", { amount: money.fmt(x.interestPaise) })}
                        {x.interestPaise > 0 && x.principalPaise > 0 && " + "}
                        {x.principalPaise > 0 && t("my.upadReturnedX", { amount: money.fmt(x.principalPaise) })}
                      </span>
                      {x.status === "rejected" && x.rejectedReason && <span className="block text-xs text-destructive">{t("my.notVerified", { reason: x.rejectedReason })}</span>}
                    </span>
                    <StatusBadge status={x.status} />
                  </li>
                ))}
              </ul>
            )}
            {myLoans.length > 0 && (
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {myLoans.map((l) => (
                <li key={l._id}>
                  <Link href={`/org/${orgId}/fund-loans/${l._id}`} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/50">
                    <span>
                      <span className="font-mono">{l.number}</span> <span className="text-muted-foreground">· {formatDate(l.date)} · {t("my.rateMonth", { rate: l.monthlyRate })}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t("my.loanLine", { outstanding: money.fmt(l.outstandingPaise), due: money.fmt(l.interestDuePaise) })}
                      </span>
                    </span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
            )}
          </div>)}
      {tab === "withdrawals" && (<>
          {withdrawals!.items.length === 0 ? (
            <EmptyState title={t("my.noWithdrawals")} />
          ) : (
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {withdrawals!.items.map((w) => (
                <li key={w._id}>
                  <Link href={`/org/${orgId}/withdrawals/${w._id}`} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/50">
                    <span>
                      <span className="font-mono">{w.number}</span> <span className="text-muted-foreground">· {formatDate(w.date)}</span>
                      {w.note && <span className="block text-xs text-muted-foreground">{w.note}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      {w.status === "reversed" && <StatusBadge status="reversed" />}
                      <Money paise={w.amountPaise} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        {pager(withdrawals!.total)}</>)}
      {tab === "payments" && (<>
          {payments!.items.length === 0 ? (
            <EmptyState title={t("my.noPayments")} />
          ) : (
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {payments!.items.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span>
                    {formatDate(p.date)} · {methodLabel(p.method)}
                    {p.reference && <span className="text-muted-foreground"> · {p.reference}</span>}
                    {p.rejectedReason && <div className="text-xs text-destructive">{p.rejectedReason}</div>}
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <Money paise={p.amountPaise} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        {pager(payments!.total)}</>)}
      {tab === "receipts" && (<>
          {receipts!.items.length === 0 ? (
            <EmptyState title={t("my.noReceipts")} />
          ) : (
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {receipts!.items.map((r) => (
                <li key={r._id}>
                  <Link href={`/org/${orgId}/receipts/${r._id}`} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/50">
                    <span>
                      <span className="font-mono">{r.receiptNumber}</span> <span className="text-muted-foreground">· {formatDate(r.date)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {r.status === "cancelled" && <StatusBadge status="cancelled" />}
                      <Money paise={r.amountPaise} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        {pager(receipts!.total)}</>)}
      {tab === "statement" && (<>
          <StatementView s={statement!} csvHref={`/api/export${qs({ path: `/orgs/${orgId}/me/statement` })}`} />
        </>)}
      {tab === "loans" && (<>
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {loans.map((l) => (
                <li key={l._id}>
                  <Link href={`/org/${orgId}/my/loans/${l._id}`} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/50">
                    <span>
                      <span className="font-mono">{l.loanNumber}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t("my.loanRate", { rate: l.annualRate, amount: money.fmt(l.outstandingPrincipalPaise) })}
                      </span>
                    </span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </>)}
    </>
  );
}
