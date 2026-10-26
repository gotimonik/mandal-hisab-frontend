import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CalendarClock, HandCoins, Landmark, PiggyBank, Receipt, Users, Wallet } from "lucide-react";
import { api } from "@/lib/server/api";
import { getOrg, can } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatINR, formatINRCompact, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MonthlyChart } from "@/features/dashboard/monthly-chart";
import { MemberDashboard } from "@/features/dashboard/member-dashboard";

export const metadata = { title: "Dashboard" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function DashboardPage({ params }: PageProps<"/org/[orgId]">) {
  const { orgId } = await params;
  const [org, d] = await Promise.all([getOrg(orgId), api<any>(`/orgs/${orgId}/dashboard`)]);
  if (d.role === "member") return <MemberDashboard orgId={orgId} data={d} org={org} />;
  const t = d.totals;
  const base = `/org/${orgId}`;
  const isAdmin = d.role === "admin";
  // In member-savings Mandals hapta is not income, so the income/expense views would mislead.
  const incomeBooks = org.settings.haptaTreatment === "income";
  const pendingTotal = d.pending.payments + d.pending.expenses + d.pending.memberships + d.pending.loans + (d.pending.upadRequests ?? 0) + (d.pending.upadPayments ?? 0);
  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${org.name} · FY ${d.financialYear} · as of ${formatDate(d.asOf)}`}
        actions={
          can(org, "payments.record") ? (
            <Link href={`${base}/monthly`} className={buttonVariants()}>
              <HandCoins /> Collect hapta
            </Link>
          ) : null
        }
      />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="This month">
        <StatCard label="Members" value={t.activeMembers} icon={<Users />} hint={t.totalMembers !== undefined && t.totalMembers !== t.activeMembers ? `${t.totalMembers} in total` : "active"} />
        <StatCard label="This month: expected" value={formatINRCompact(t.monthExpectedPaise ?? 0)} icon={<CalendarClock />} hint={<Link href={`${base}/monthly`} className="text-primary hover:underline">Open monthly hapta</Link>} />
        <StatCard label="This month: collected" value={formatINRCompact(t.monthCollectedAgainstDuePaise ?? 0)} icon={<HandCoins />} tone="good" hint={`Cash received this month ${formatINR(t.monthHaptaCashPaise ?? 0)}`} />
        <StatCard label="Pending hapta" value={formatINRCompact(t.monthPendingPaise ?? 0)} icon={<AlertTriangle />} tone={(t.monthPendingPaise ?? 0) > 0 ? "warn" : "good"} hint={`All months: ${formatINR(t.outstandingHaptaPaise)}`} />
        <StatCard label="Total member balances" value={formatINRCompact(t.totalMemberBalancesPaise ?? 0)} icon={<PiggyBank />} hint="Savings owed to members" />
        <StatCard label="Mandal fund" value={formatINRCompact(t.mandalFundPaise ?? t.mandalCashPaise ?? 0)} icon={<Wallet />} hint={`Cash ${formatINR(t.mandalCashPaise ?? 0)} + upad ${formatINR(t.fundLoansOutstandingPaise ?? 0)}`} />
        <StatCard label="Interest credited" value={formatINRCompact(t.interestThisMonthPaise ?? 0)} hint={t.interestThisFyPaise !== undefined ? `This month · FY ${formatINR(t.interestThisFyPaise)}` : "This month"} />
        <StatCard label="Upad interest due" value={formatINRCompact(t.fundLoanInterestDuePaise ?? 0)} icon={<Banknote />} tone={(t.fundLoanInterestDuePaise ?? 0) > 0 ? "warn" : "default"} hint={<Link href={`${base}/fund-loans`} className="text-primary hover:underline">{t.activeFundLoans ?? 0} active upad</Link>} />
      </section>
      {isAdmin && (t.activeLoans > 0 || incomeBooks) && (
        <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Other figures">
          {t.fyIncomePaise !== undefined && <StatCard label={`Income FY ${d.financialYear}`} value={formatINRCompact(t.fyIncomePaise)} icon={<Banknote />} />}
          {t.fyExpensesPaise !== undefined && <StatCard label={`Expenses FY ${d.financialYear}`} value={formatINRCompact(t.fyExpensesPaise)} icon={<Receipt />} />}
          <StatCard label="Active loans" value={t.activeLoans} icon={<Landmark />} hint={`${formatINR(t.loanOutstandingPrincipalPaise)} principal outstanding`} />
          <StatCard label="Overdue" value={formatINRCompact(t.overdueAmountPaise)} icon={<AlertTriangle />} hint={`${t.overdueInstallments} installments`} tone={t.overdueInstallments > 0 ? "bad" : "good"} />
        </section>
      )}

      <div className={cn("mt-4 grid gap-4", incomeBooks && d.monthlyChart ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {d.monthlyChart && incomeBooks && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Income vs expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyChart data={d.monthlyChart} />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Collection performance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-3xl font-semibold tabular-nums">{d.collectionPerformance.percent}%</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={d.collectionPerformance.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, d.collectionPerformance.percent)}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">
              <Money paise={d.collectionPerformance.collectedPaise} /> collected of <Money paise={d.collectionPerformance.duePaise} /> due this financial year.
            </p>
            {pendingTotal > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 border-t pt-3 text-sm">
                <p className="font-medium">Waiting for action</p>
                {(d.pending.upadRequests ?? 0) > 0 && can(org, "withdrawals.record") && <PendingLink href={`${base}/fund-loans`} label="Upad requests" n={d.pending.upadRequests} />}
                {(d.pending.upadPayments ?? 0) > 0 && can(org, "payments.verify") && <PendingLink href={`${base}/fund-loans`} label="Upad payments to verify" n={d.pending.upadPayments} />}
                {d.pending.payments > 0 && <PendingLink href={`${base}/collections?status=pending`} label="Payments to verify" n={d.pending.payments} />}
                {d.pending.expenses > 0 && <PendingLink href={`${base}/expenses?status=pending`} label="Expenses to approve" n={d.pending.expenses} />}
                {d.pending.memberships > 0 && can(org, "memberships.manage") && <PendingLink href={`${base}/users`} label="Join requests" n={d.pending.memberships} />}
                {d.pending.loans > 0 && <PendingLink href={`${base}/loans?status=applied`} label="Loan applications" n={d.pending.loans} />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming dues (30 days)</CardTitle>
            <CardAction>
              <Link href={`${base}/installments?status=upcoming`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                All <ArrowRight />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.upcomingDues.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due in the next 30 days.</p>
            ) : (
              <ul className="divide-y text-sm">
                {d.upcomingDues.map((u: any) => (
                  <li key={u._id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{u.memberName}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.schemeName} · {u.periodLabel} · {formatDate(u.dueDate)}
                      </span>
                    </span>
                    <Money paise={u.amountPaise - u.paidPaise} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            {can(org, "transactions.view") && (
              <CardAction>
                <Link href={`${base}/transactions`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  Ledger <ArrowRight />
                </Link>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {d.recentTransactions.length === 0 ? (
              <EmptyState title="No transactions yet" description="Collections, expenses and transfers will appear here." />
            ) : (
              <ul className="divide-y text-sm">
                {d.recentTransactions.map((tx: any) => (
                  <li key={tx._id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="block truncate">{tx.description}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.date)} · {label({}, tx.type)} {tx.reversedBy && <StatusBadge status="reversed" className="ml-1" />}
                      </span>
                    </span>
                    <Money paise={tx.amountPaise} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {d.recentWithdrawals?.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Recent withdrawals</CardTitle>
            <CardAction>
              <Link href={`${base}/withdrawals`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                All <ArrowRight />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {d.recentWithdrawals.map((w: any) => (
                <li key={w._id}>
                  <Link href={`${base}/withdrawals/${w._id}`} className="flex items-center justify-between gap-2 py-2 hover:underline">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{w.memberName}</span>
                      <span className="text-xs text-muted-foreground">
                        {w.number} · {formatDate(w.date)}
                      </span>
                    </span>
                    <Money paise={w.amountPaise} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {d.accounts?.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Account balances</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {d.accounts.map((a: any) => (
              <div key={a._id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="truncate">{a.name}</span>
                <Money paise={a.balancePaise} className="font-medium" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function PendingLink({ href, label: l, n }: { href: string; label: string; n: number }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted">
      <span>{l}</span>
      <span className="rounded-full bg-warning/25 px-2 text-xs font-medium tabular-nums">{n}</span>
    </Link>
  );
}
