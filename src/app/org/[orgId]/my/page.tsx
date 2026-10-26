import Link from "next/link";
import { api, qs } from "@/lib/server/api";
import { getOrg } from "@/lib/server/data";
import type { FundLoanList, MyUpadRequests, UpadPaymentClaim, Installment, Loan, MemberLedger, Paged, Payment, Receipt, Withdrawal } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { METHOD_LABEL, formatDate, label } from "@/lib/format";
import { PaymentRequestDialog } from "@/features/my/payment-request";
import { StatementView, type Statement } from "@/features/statement/statement-view";
import { SavingsLedgerTable, SavingsSummary } from "@/features/savings/savings-ledger";
import { RequestUpadDialog } from "@/features/fund-loans/request-upad-dialog";
import { ActionButton } from "@/components/app/action-button";

export const metadata = { title: "My savings" };

export default async function MyPage({ params, searchParams }: PageProps<"/org/[orgId]/my">) {
  const { orgId } = await params;
  const tab = (await searchParams).tab === "upad" ? "fundloans" : "savings";
  const [org, me] = await Promise.all([getOrg(orgId), api<{ linked: boolean; member: { name: string; membershipNumber: string } | null }>(`/orgs/${orgId}/me`)]);
  if (!me.linked) {
    return (
      <>
        <PageHeader title="My account" />
        <EmptyState title="Not linked to a member record" description="Ask your Mandal admin to link your login to your membership (Users & roles → Link member)." />
      </>
    );
  }
  const [insts, payments, receipts, loans, statement, ledger, withdrawals, fundLoans, upadReqs, upadClaims] = await Promise.all([
    api<Paged<Installment>>(`/orgs/${orgId}/me/installments${qs({ pageSize: 200 })}`),
    api<Paged<Payment>>(`/orgs/${orgId}/me/payments${qs({ pageSize: 50 })}`),
    api<Receipt[]>(`/orgs/${orgId}/me/receipts`),
    api<Loan[]>(`/orgs/${orgId}/me/loans`),
    api<Statement>(`/orgs/${orgId}/me/statement`),
    api<MemberLedger>(`/orgs/${orgId}/me/ledger`),
    api<Paged<Withdrawal>>(`/orgs/${orgId}/me/withdrawals${qs({ pageSize: 50 })}`),
    api<FundLoanList>(`/orgs/${orgId}/me/fund-loans`),
    api<MyUpadRequests>(`/orgs/${orgId}/me/upad-requests`),
    api<UpadPaymentClaim[]>(`/orgs/${orgId}/me/upad-payments`),
  ]);
  const openRequest = upadReqs.items.find((r) => r.status === "pending");
  const canRequest = upadReqs.allowRequests && org.status === "active" && !openRequest;
  const myLoans = fundLoans.items.filter((l) => l.status !== "cancelled");
  return (
    <>
      <PageHeader title={me.member!.name} description={`Member no. ${me.member!.membershipNumber}`} actions={<PaymentRequestDialog methods={org.settings.paymentMethods} />} />
      <div className="mb-4">
        <SavingsSummary l={ledger} />
      </div>
      {fundLoans.totals.activeLoans > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-warning/10 px-4 py-3 text-sm ring-1 ring-warning/30">
          <span>
            Upad: <Money paise={fundLoans.totals.outstandingPaise} className="font-semibold" /> outstanding · interest due now <Money paise={fundLoans.totals.interestDuePaise} className="font-semibold" />
          </span>
          <span className="text-xs text-muted-foreground">Pay the interest to the Mandal admin each month.</span>
        </div>
      )}
      <Tabs defaultValue={tab}>
        <TabsList className="w-full max-w-full justify-start overflow-x-auto [scrollbar-width:none] sm:w-fit">
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="dues">Monthly hapta</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          {(myLoans.length > 0 || upadReqs.items.length > 0 || canRequest) && <TabsTrigger value="fundloans">My upad</TabsTrigger>}
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="statement">Statement</TabsTrigger>
          {loans.length > 0 && <TabsTrigger value="loans">Loans</TabsTrigger>}
        </TabsList>
        <TabsContent value="savings">
          <SavingsLedgerTable l={ledger} csvHref={`/api/export${qs({ path: `/orgs/${orgId}/me/ledger` })}`} />
        </TabsContent>
        {(myLoans.length > 0 || upadReqs.items.length > 0 || canRequest) && (
          <TabsContent value="fundloans" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-foreground/10">
              <span>
                Available in the Mandal: <Money paise={upadReqs.availablePaise} className="font-semibold" />
              </span>
              {canRequest ? <RequestUpadDialog availablePaise={upadReqs.availablePaise} size="sm" /> : openRequest ? <span className="text-xs text-muted-foreground">Your request is waiting for approval</span> : null}
            </div>
            {upadReqs.items.length > 0 && (
              <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
                {upadReqs.items.map((r) => (
                  <li key={r._id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>
                      Request for <Money paise={r.amountPaise} className="font-medium" /> <span className="text-muted-foreground">· {formatDate(r.createdAt)}</span>
                      {r.purpose && <span className="block text-xs text-muted-foreground">{r.purpose}</span>}
                      {r.status === "rejected" && r.decisionReason && <span className="block text-xs text-destructive">Not approved: {r.decisionReason}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      {r.status === "pending" && (
                        <ActionButton path={`/orgs/${orgId}/me/upad-requests/${r._id}/cancel`} size="xs" variant="ghost" successMessage="Request cancelled" confirm={{ title: "Cancel your upad request?", confirmLabel: "Cancel request" }}>
                          Cancel
                        </ActionButton>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {upadClaims.length > 0 && (
              <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10" aria-label="Upad payments you reported">
                {upadClaims.map((x) => (
                  <li key={x._id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>
                      Paid <Money paise={x.interestPaise + x.principalPaise} className="font-medium" /> on {x.loanNumber} <span className="text-muted-foreground">· {formatDate(x.date)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {x.interestPaise > 0 && <>interest <Money paise={x.interestPaise} /></>}
                        {x.interestPaise > 0 && x.principalPaise > 0 && " + "}
                        {x.principalPaise > 0 && <>upad returned <Money paise={x.principalPaise} /></>}
                      </span>
                      {x.status === "rejected" && x.rejectedReason && <span className="block text-xs text-destructive">Not verified: {x.rejectedReason}</span>}
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
                      <span className="font-mono">{l.number}</span> <span className="text-muted-foreground">· {formatDate(l.date)} · {l.monthlyRate}% / month</span>
                      <span className="block text-xs text-muted-foreground">
                        Outstanding <Money paise={l.outstandingPaise} /> · interest due <Money paise={l.interestDuePaise} />
                      </span>
                    </span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
            )}
          </TabsContent>
        )}
        <TabsContent value="withdrawals">
          {withdrawals.items.length === 0 ? (
            <EmptyState title="No withdrawals" />
          ) : (
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {withdrawals.items.map((w) => (
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
        </TabsContent>
        <TabsContent value="dues">
          <TableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheme / period</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insts.items.map((i) => (
                  <TableRow key={i._id}>
                    <TableCell>
                      {i.schemeName}
                      <div className="text-xs text-muted-foreground">{i.periodLabel}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(i.dueDate)}</TableCell>
                    <TableCell className="text-right">
                      <Money paise={i.amountPaise + i.penaltyPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={i.paidPaise + i.penaltyPaidPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={i.outstandingPaise} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrap>
        </TabsContent>
        <TabsContent value="payments">
          {payments.items.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {payments.items.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span>
                    {formatDate(p.date)} · {label(METHOD_LABEL, p.method)}
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
        </TabsContent>
        <TabsContent value="receipts">
          {receipts.length === 0 ? (
            <EmptyState title="No receipts yet" />
          ) : (
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {receipts.map((r) => (
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
        </TabsContent>
        <TabsContent value="statement">
          <StatementView s={statement} csvHref={`/api/export${qs({ path: `/orgs/${orgId}/me/statement` })}`} />
        </TabsContent>
        {loans.length > 0 && (
          <TabsContent value="loans">
            <ul className="divide-y rounded-xl text-sm ring-1 ring-foreground/10">
              {loans.map((l) => (
                <li key={l._id}>
                  <Link href={`/org/${orgId}/my/loans/${l._id}`} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/50">
                    <span>
                      <span className="font-mono">{l.loanNumber}</span>
                      <span className="block text-xs text-muted-foreground">
                        {l.annualRate}% · outstanding <Money paise={l.outstandingPrincipalPaise} />
                      </span>
                    </span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
