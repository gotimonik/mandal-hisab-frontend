import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  HandCoins,
  Landmark,
  Percent,
  PiggyBank,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/server/api";
import { getMe, getOrg, can } from "@/lib/server/data";
import { buildQuickActions } from "@/lib/nav";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { ActionRow, CountPill, IconChip, ProgressBar, SectionTitle } from "@/components/app/bits";
import { QuickGrid } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatINR, formatINRCompact, formatINRShort, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { MonthlyChart } from "@/features/dashboard/monthly-chart";
import { MemberDashboard } from "@/features/dashboard/member-dashboard";

export const metadata = { title: "Dashboard" };

const monthLabel = (iso: string) => new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 7)}-01T00:00:00Z`));

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function DashboardPage({ params }: PageProps<"/org/[orgId]">) {
  const { orgId } = await params;
  const [org, d, me] = await Promise.all([getOrg(orgId), api<any>(`/orgs/${orgId}/dashboard`), getMe()]);
  if (d.role === "member") return <MemberDashboard orgId={orgId} data={d} org={org} />;
  const t = d.totals;
  const base = `/org/${orgId}`;
  const isAdmin = d.role === "admin";
  // In member-savings Mandals hapta is not income, so the income/expense views would mislead.
  const incomeBooks = org.settings.haptaTreatment === "income";
  const quick = buildQuickActions(orgId, org.myPermissions, org.myRole, { live: org.status === "active" });

  const expected = t.monthExpectedPaise ?? 0;
  const collected = t.monthCollectedAgainstDuePaise ?? 0;
  const monthDue = t.monthPendingPaise ?? 0;
  const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  const olderDue = Math.max(0, (t.outstandingHaptaPaise ?? 0) - monthDue);
  const month = monthLabel(d.asOf);

  type Todo = { key: string; href: string; tone: Tone; icon: React.ReactNode; title: string; subtitle?: string; trailing: React.ReactNode };
  const todos: Todo[] = [];
  const pend = d.pending;
  if ((pend.upadRequests ?? 0) > 0 && can(org, "withdrawals.record")) todos.push({ key: "ur", href: `${base}/fund-loans`, tone: "orange", icon: <HandCoins />, title: "Upad requests", subtitle: "Members asking for upad", trailing: <CountPill n={pend.upadRequests} tone="orange" /> });
  if ((pend.upadPayments ?? 0) > 0 && can(org, "payments.verify")) todos.push({ key: "up", href: `${base}/fund-loans`, tone: "orange", icon: <ClipboardCheck />, title: "Upad payments to verify", subtitle: "Reported by members", trailing: <CountPill n={pend.upadPayments} tone="orange" /> });
  if (pend.payments > 0) todos.push({ key: "p", href: `${base}/collections?status=pending`, tone: "indigo", icon: <ClipboardCheck />, title: "Payments to verify", subtitle: "Members said they paid", trailing: <CountPill n={pend.payments} tone="indigo" /> });
  if (pend.memberships > 0 && can(org, "memberships.manage")) todos.push({ key: "m", href: `${base}/users`, tone: "sky", icon: <UserPlus />, title: "Join requests", subtitle: "People asking to join", trailing: <CountPill n={pend.memberships} tone="sky" /> });
  if (pend.expenses > 0) todos.push({ key: "e", href: `${base}/expenses?status=pending`, tone: "pink", icon: <Receipt />, title: "Expenses to approve", trailing: <CountPill n={pend.expenses} tone="pink" /> });
  if (pend.loans > 0) todos.push({ key: "l", href: `${base}/loans?status=applied`, tone: "violet", icon: <Landmark />, title: "Loan applications", trailing: <CountPill n={pend.loans} tone="violet" /> });
  if ((t.fundLoanInterestDuePaise ?? 0) > 0) todos.push({ key: "ui", href: `${base}/fund-loans`, tone: "amber", icon: <Banknote />, title: "Upad interest to collect", subtitle: `${t.activeFundLoans ?? 0} active upad`, trailing: <Money paise={t.fundLoanInterestDuePaise} className="text-sm font-bold text-warning-ink" /> });
  if (olderDue > 0) todos.push({ key: "od", href: `${base}/installments?status=overdue`, tone: "rose", icon: <AlertTriangle />, title: "Older hapta still due", subtitle: "From earlier months", trailing: <Money paise={olderDue} className="text-sm font-bold text-destructive" /> });

  return (
    <>
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground">
          {org.name} · FY {d.financialYear}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">Namaste, {me.user.name.split(" ")[0]}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* ---- this month's hapta: the hero */}
        <section aria-label="This month's hapta" className="bg-hero relative overflow-hidden rounded-3xl p-5 shadow-lg shadow-primary/20 sm:p-6">
          <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-16 -bottom-16 size-32 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/80">{month} hapta collected</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums">{formatINRCompact(collected)}</p>
              <p className="mt-0.5 text-sm text-white/80">of {formatINRShort(expected)} expected</p>
            </div>
            <span className="rounded-2xl bg-white/15 px-3 py-1.5 text-lg font-bold tabular-nums backdrop-blur">{pct}%</span>
          </div>
          <ProgressBar value={pct} className="relative mt-4 h-3 bg-white/20" barClassName="bg-gradient-to-r from-amber-300 to-yellow-200" label={`${month} collection`} />
          <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/90">
              {monthDue > 0 ? (
                <>
                  <span className="font-bold">{formatINRShort(monthDue)}</span> still to collect
                </>
              ) : expected > 0 ? (
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4" /> Everyone has paid
                </span>
              ) : (
                "No hapta due this month"
              )}
            </p>
            {can(org, "payments.record") && (
              <Link href={`${base}/monthly${monthDue > 0 ? "?show=due" : ""}`} className={cn(buttonVariants({ size: "lg" }), "h-11 bg-white text-indigo-700 shadow-md shadow-black/10 hover:bg-white/90 md:h-11")}>
                <HandCoins /> Collect hapta
              </Link>
            )}
          </div>
        </section>

        {/* ---- needs attention */}
        <Card className="gap-2 py-3">
          <CardHeader className="px-4">
            <CardTitle className="text-base font-bold">Needs your attention</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            {todos.length === 0 ? (
              <div className="flex items-center gap-3 px-2 py-3">
                <IconChip tone="emerald">
                  <CheckCircle2 />
                </IconChip>
                <div>
                  <p className="text-sm font-semibold">All caught up</p>
                  <p className="text-xs text-muted-foreground">Nothing is waiting for you right now.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {todos.map(({ key, ...row }) => (
                  <ActionRow key={key} {...row} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {quick.length > 0 && (
        <section className="mt-5" aria-label="Shortcuts">
          <SectionTitle>Quick actions</SectionTitle>
          <QuickGrid actions={quick} row />
        </section>
      )}

      <section className="mt-5" aria-label="Mandal fund">
        <SectionTitle>Mandal at a glance</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Mandal fund" value={formatINRCompact(t.mandalFundPaise ?? t.mandalCashPaise ?? 0)} icon={<Wallet />} accent="emerald" hint={`Cash ${formatINR(t.mandalCashPaise ?? 0)} + upad ${formatINR(t.fundLoansOutstandingPaise ?? 0)}`} href={can(org, "accounts.view") ? `${base}/cashbook` : undefined} />
          <StatCard label="Total member balances" value={formatINRCompact(t.totalMemberBalancesPaise ?? 0)} icon={<PiggyBank />} accent="violet" hint="Savings owed to members" />
          <StatCard label="Upad given out" value={formatINRCompact(t.fundLoansOutstandingPaise ?? 0)} icon={<HandCoins />} accent="orange" hint={<>Interest due <Money paise={t.fundLoanInterestDuePaise ?? 0} className="font-semibold text-foreground" /></>} href={`${base}/fund-loans`} />
          <StatCard label="Members" value={t.activeMembers} icon={<Users />} accent="sky" hint={t.totalMembers !== undefined && t.totalMembers !== t.activeMembers ? `${t.totalMembers} in total` : "active"} href={`${base}/members`} />
          <StatCard label="This year's hapta" value={`${d.collectionPerformance.percent}%`} icon={<TrendingUp />} accent="indigo" hint={<><Money paise={d.collectionPerformance.collectedPaise} /> of <Money paise={d.collectionPerformance.duePaise} /> due</>} />
          <StatCard label="Interest credited" value={formatINRCompact(t.interestThisMonthPaise ?? 0)} icon={<Percent />} accent="pink" hint={t.interestThisFyPaise !== undefined ? `This month · FY ${formatINR(t.interestThisFyPaise)}` : "This month"} />
          <StatCard label="Cash received this month" value={formatINRCompact(t.monthHaptaCashPaise ?? 0)} icon={<ArrowDownToLine />} accent="emerald" hint="Hapta cash, any month" />
          <StatCard label="Pending hapta" value={formatINRCompact(t.outstandingHaptaPaise ?? 0)} icon={<CalendarClock />} tone={(t.outstandingHaptaPaise ?? 0) > 0 ? "warn" : "good"} hint="All months" href={`${base}/monthly?show=due`} />
        </div>
        {isAdmin && (t.activeLoans > 0 || incomeBooks) && (
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {t.fyIncomePaise !== undefined && <StatCard label={`Income FY ${d.financialYear}`} value={formatINRCompact(t.fyIncomePaise)} icon={<Banknote />} accent="emerald" />}
            {t.fyExpensesPaise !== undefined && <StatCard label={`Expenses FY ${d.financialYear}`} value={formatINRCompact(t.fyExpensesPaise)} icon={<Receipt />} accent="pink" />}
            <StatCard label="Active loans" value={t.activeLoans} icon={<Landmark />} accent="violet" hint={`${formatINR(t.loanOutstandingPrincipalPaise)} principal outstanding`} />
            <StatCard label="Overdue" value={formatINRCompact(t.overdueAmountPaise)} icon={<AlertTriangle />} hint={`${t.overdueInstallments} installments`} tone={t.overdueInstallments > 0 ? "bad" : "good"} />
          </div>
        )}
      </section>

      {d.monthlyChart && incomeBooks && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="font-bold">Income vs expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={d.monthlyChart} />
          </CardContent>
        </Card>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Upcoming dues</CardTitle>
            <CardAction>
              <Link href={`${base}/installments?status=upcoming`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}>
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
                  <li key={u._id} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{u.memberName}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.periodLabel} · due {formatDate(u.dueDate)}
                      </span>
                    </span>
                    <Money paise={u.amountPaise - u.paidPaise} className="font-semibold" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Recent activity</CardTitle>
            {can(org, "transactions.view") && (
              <CardAction>
                <Link href={`${base}/transactions`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}>
                  Ledger <ArrowRight />
                </Link>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {d.recentTransactions.length === 0 ? (
              <EmptyState title="No transactions yet" description="Collections, upad and withdrawals will appear here." />
            ) : (
              <ul className="divide-y text-sm">
                {d.recentTransactions.map((tx: any) => {
                  const kind = txKind(tx.type);
                  return (
                    <li key={tx._id} className="flex items-center gap-3 py-2.5">
                      <IconChip tone={kind.tone} size="sm">
                        {kind.icon}
                      </IconChip>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{tx.description}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(tx.date)} · {label({}, tx.type)} {tx.reversedBy && <StatusBadge status="reversed" className="ml-1" />}
                        </span>
                      </span>
                      <Money paise={tx.amountPaise} className="font-semibold" />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {d.recentWithdrawals?.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="font-bold">Recent withdrawals</CardTitle>
            <CardAction>
              <Link href={`${base}/withdrawals`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}>
                All <ArrowRight />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {d.recentWithdrawals.map((w: any) => (
                <li key={w._id}>
                  <Link href={`${base}/withdrawals/${w._id}`} className="flex items-center gap-3 py-2.5">
                    <IconChip tone="rose" size="sm">
                      <ArrowUpFromLine />
                    </IconChip>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{w.memberName}</span>
                      <span className="text-xs text-muted-foreground">
                        {w.number} · {formatDate(w.date)}
                      </span>
                    </span>
                    <Money paise={w.amountPaise} className="font-semibold" />
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
            <CardTitle className="font-bold">Account balances</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {d.accounts.map((a: any) => (
              <div key={a._id} className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/8 px-3 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Wallet className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span className="truncate">{a.name}</span>
                </span>
                <Money paise={a.balancePaise} className="font-bold" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function txKind(type: string): { tone: Tone; icon: React.ReactNode } {
  if (/withdraw/.test(type)) return { tone: "rose", icon: <ArrowUpFromLine /> };
  if (/fund_loan|upad/.test(type)) return { tone: "orange", icon: <HandCoins /> };
  if (/interest/.test(type)) return { tone: "pink", icon: <Percent /> };
  if (/expense/.test(type)) return { tone: "pink", icon: <Receipt /> };
  if (/transfer|adjust/.test(type)) return { tone: "slate", icon: <Wallet /> };
  return { tone: "emerald", icon: <ArrowDownToLine /> };
}
