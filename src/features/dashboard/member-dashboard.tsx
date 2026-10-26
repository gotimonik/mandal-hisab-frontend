import Link from "next/link";
import { CalendarClock, CheckCircle2, AlertTriangle, HandCoins, Wallet } from "lucide-react";
import type { Org } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatINR, formatINRShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconChip } from "@/components/app/bits";
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
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground">
          {org.name} · Member no. {data.member.membershipNumber}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">Namaste, {data.member.name.split(" ")[0]}</h1>
      </div>
      {data.savings && (
        <section aria-label="My savings" className="bg-hero relative mb-3 overflow-hidden rounded-3xl p-5 shadow-lg shadow-primary/20">
          <div className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/10" />
          <Link href={`/org/${orgId}/my`} className="relative block">
            <p className="text-sm font-medium text-white/85">My savings balance</p>
            <p className="text-4xl font-extrabold tracking-tight tabular-nums">{formatINRShort(data.savings.balancePaise)}</p>
            <p className="mt-1 text-xs text-white/80">
              Hapta {formatINR(data.savings.haptaPaise)} + interest {formatINR(data.savings.interestPaise)} − withdrawn {formatINR(data.savings.withdrawalsPaise)}
            </p>
          </Link>
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <PaymentRequestDialog methods={org.settings.paymentMethods} triggerClassName="h-11 bg-white text-indigo-700 shadow-md shadow-black/10 hover:bg-white/90 md:h-11" />
            {org.settings.fundLoans?.allowMemberRequests && org.status === "active" && (
              <Link href={`/org/${orgId}/my?tab=upad&new=1`} className={cn(buttonVariants(), "h-11 bg-white/15 text-white shadow-none hover:bg-white/25 md:h-11")}>
                Request upad
              </Link>
            )}
            {data.monthlyHaptaPaise ? <span className="ml-auto text-right text-xs text-white/80">Monthly hapta<br /><span className="text-sm font-bold text-white">{formatINRShort(data.monthlyHaptaPaise)}</span>{data.haptaShares > 1 && <span className="block text-[11px]">{data.haptaShares} haptas</span>}</span> : null}
          </div>
        </section>
      )}
      {!data.savings && (
        <div className="mb-3 flex flex-wrap gap-2">
          <PaymentRequestDialog methods={org.settings.paymentMethods} />
        </div>
      )}
      {data.fundLoans?.activeLoans > 0 && (
        <Link href={`/org/${orgId}/my?tab=upad`} className="mb-3 flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-2 ring-orange-400/30">
          <IconChip tone="orange">
            <HandCoins />
          </IconChip>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-semibold">My upad · {formatINRShort(data.fundLoans.outstandingPaise)} outstanding</span>
            <span className="text-xs text-muted-foreground">Interest due now</span>
          </span>
          <span className="text-lg font-bold text-warning-ink tabular-nums">{formatINRShort(data.fundLoans.interestDuePaise)}</span>
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
