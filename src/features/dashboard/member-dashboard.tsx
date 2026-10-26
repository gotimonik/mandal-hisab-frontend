import Link from "next/link";
import { CalendarClock, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import type { Org } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/format";
import { PaymentRequestDialog } from "@/features/my/payment-request";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function MemberDashboard({ orgId, data, org }: { orgId: string; data: any; org: Org }) {
  if (!data.linked) {
    return (
      <>
        <PageHeader title={org.name} />
        <EmptyState title="Your login isn't linked to a member record yet" description="Ask your Mandal admin to link your account to your membership so you can see your hapta, receipts and loans here." />
      </>
    );
  }
  const t = data.totals;
  return (
    <>
      <PageHeader
        title={`Namaste, ${data.member.name.split(" ")[0]}`}
        description={`${org.name} · Member no. ${data.member.membershipNumber}`}
        actions={
          <>
            {org.settings.fundLoans?.allowMemberRequests && org.status === "active" && (
              <Link href={`/org/${orgId}/my?tab=upad`} className={buttonVariants({ variant: "outline" })}>
                Request upad
              </Link>
            )}
            <PaymentRequestDialog methods={org.settings.paymentMethods} />
          </>
        }
      />
      {data.savings && (
        <Link href={`/org/${orgId}/my`} className="mb-3 block">
          <Card className="flex-row items-center justify-between gap-3 bg-primary/5 px-4 py-4 ring-primary/20 transition-colors hover:bg-primary/10">
            <div>
              <p className="text-xs font-medium text-muted-foreground">My savings balance</p>
              <p className="text-2xl font-semibold tabular-nums">{formatINR(data.savings.balancePaise)}</p>
              <p className="text-xs text-muted-foreground">
                Hapta {formatINR(data.savings.haptaPaise)} + interest {formatINR(data.savings.interestPaise)} − withdrawn {formatINR(data.savings.withdrawalsPaise)}
              </p>
            </div>
            {data.monthlyHaptaPaise ? <p className="text-right text-xs text-muted-foreground">Monthly hapta<br /><span className="text-sm font-medium text-foreground">{formatINR(data.monthlyHaptaPaise)}</span></p> : null}
          </Card>
        </Link>
      )}
      {data.fundLoans?.activeLoans > 0 && (
        <Link href={`/org/${orgId}/my`} className="mb-3 block rounded-xl bg-warning/10 px-4 py-3 text-sm ring-1 ring-warning/30 hover:bg-warning/15">
          Upad: <span className="font-semibold">{formatINR(data.fundLoans.outstandingPaise)}</span> outstanding · interest due now <span className="font-semibold">{formatINR(data.fundLoans.interestDuePaise)}</span>
        </Link>
      )}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total paid" value={formatINR(t.totalPaidPaise)} icon={<CheckCircle2 />} tone="good" />
        <StatCard label="Outstanding now" value={formatINR(t.outstandingPaise)} icon={<Wallet />} tone={t.outstandingPaise > 0 ? "warn" : "default"} />
        <StatCard label="Overdue" value={formatINR(t.overduePaise)} icon={<AlertTriangle />} tone={t.overduePaise > 0 ? "bad" : "good"} />
        <StatCard
          label="Next installment"
          value={data.nextInstallment ? formatINR(data.nextInstallment.amountPaise) : "—"}
          icon={<CalendarClock />}
          hint={data.nextInstallment ? `${data.nextInstallment.periodLabel} · due ${formatDate(data.nextInstallment.dueDate)}` : "Nothing scheduled"}
        />
      </section>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent receipts</CardTitle>
          </CardHeader>
          <CardContent>
            {data.receipts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No receipts yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.receipts.map((r: any) => (
                  <li key={r._id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/org/${orgId}/receipts/${r._id}`} className="min-w-0 hover:underline">
                      <span className="block font-medium">{r.receiptNumber}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>
                    </Link>
                    <span className="flex items-center gap-2">
                      {r.status === "cancelled" && <StatusBadge status="cancelled" />}
                      <Money paise={r.amountPaise} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/org/${orgId}/my`} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}>
              View installments & statement
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {data.loans.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no loans.</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.loans.map((l: any) => (
                  <li key={l._id} className="py-2">
                    <Link href={`/org/${orgId}/my/loans/${l._id}`} className="flex items-center justify-between gap-2 hover:underline">
                      <span>
                        <span className="block font-medium">{l.loanNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {l.summary ? `Outstanding ${formatINR(l.summary.outstandingPrincipalPaise)}` : ""}
                          {l.summary?.nextDue ? ` · next ${formatINR(l.summary.nextDue.amountPaise)} on ${formatDate(l.summary.nextDue.dueDate)}` : ""}
                        </span>
                      </span>
                      <StatusBadge status={l.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
