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
  Lock,
  Percent,
  PiggyBank,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/server/api";
import { getMe, getOrg, can, getMoney } from "@/lib/server/data";
import { buildQuickActions } from "@/lib/nav";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { ActionRow, CountPill, IconChip, ProgressBar, SectionTitle } from "@/components/app/bits";
import { QuickGrid } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { MonthlyChart } from "@/features/dashboard/monthly-chart";
import { monthsBetween } from "@/lib/months";
import { MemberDashboard } from "@/features/dashboard/member-dashboard";
import { SchemesOverview } from "@/features/dashboard/schemes-overview";
import { getT } from "@/i18n/server";
import { intlLocale, monthName, type Lang, type T } from "@/i18n/core";
import type { MoneyFmt } from "@/lib/currency";
import { OrgLogo } from "@/components/app/org-logo";

export const metadata = { title: "Dashboard" };

const monthLabel = (lang: Lang, iso: string) => new Intl.DateTimeFormat(intlLocale(lang), { month: "long", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 7)}-01T00:00:00Z`));

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function DashboardPage({ params }: PageProps<"/org/[orgId]">) {
  const { orgId } = await params;
  const [org, d, me] = await Promise.all([getOrg(orgId), api<any>(`/orgs/${orgId}/dashboard`), getMe()]);
  // getOrg is already in flight above (and cached), so this resolves without a second wait
  const money = await getMoney(orgId);
  if (d.role === "member") return <MemberDashboard orgId={orgId} data={d} org={org} />;
  const t = d.totals;
  const { t: tr, lang } = await getT();
  const base = `/org/${orgId}`;
  const isAdmin = d.role === "admin";
  // In member-savings Mandals hapta is not income, so the income/expense views would mislead.
  const incomeBooks = org.settings.haptaTreatment === "income";
  const quick = buildQuickActions(orgId, org.myPermissions, org.myRole, { live: org.status === "active" }, tr);

  const expected = t.monthExpectedPaise ?? 0;
  const collected = t.monthCollectedAgainstDuePaise ?? 0;
  const monthDue = t.monthPendingPaise ?? 0;
  const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  const olderDue = Math.max(0, (t.outstandingHaptaPaise ?? 0) - monthDue);
  const month = monthLabel(lang, d.asOf);
  const monthsLeft = org.settings.endMonth ? monthsBetween(String(d.asOf).slice(0, 7), org.settings.endMonth) : 0;

  type Todo = { key: string; href: string; tone: Tone; icon: React.ReactNode; title: string; subtitle?: string; trailing: React.ReactNode };
  const todos: Todo[] = [];
  const pend = d.pending;
  if ((pend.upadRequests ?? 0) > 0 && can(org, "withdrawals.record")) todos.push({ key: "ur", href: `${base}/fund-loans`, tone: "orange", icon: <HandCoins />, title: tr("dash.upadRequests"), subtitle: tr("dash.upadRequestsSub"), trailing: <CountPill n={pend.upadRequests} tone="orange" /> });
  if ((pend.upadPayments ?? 0) > 0 && can(org, "payments.verify")) todos.push({ key: "up", href: `${base}/fund-loans`, tone: "orange", icon: <ClipboardCheck />, title: tr("dash.upadPayments"), subtitle: tr("dash.upadPaymentsSub"), trailing: <CountPill n={pend.upadPayments} tone="orange" /> });
  if (pend.payments > 0) todos.push({ key: "p", href: `${base}/collections?status=pending`, tone: "indigo", icon: <ClipboardCheck />, title: tr("dash.paymentsToVerify"), subtitle: tr("dash.paymentsToVerifySub"), trailing: <CountPill n={pend.payments} tone="indigo" /> });
  if (pend.memberships > 0 && can(org, "memberships.manage")) todos.push({ key: "m", href: `${base}/users`, tone: "sky", icon: <UserPlus />, title: tr("dash.joinRequests"), subtitle: tr("dash.joinRequestsSub"), trailing: <CountPill n={pend.memberships} tone="sky" /> });
  if (pend.expenses > 0) todos.push({ key: "e", href: `${base}/expenses?status=pending`, tone: "pink", icon: <Receipt />, title: tr("dash.expensesToApprove"), trailing: <CountPill n={pend.expenses} tone="pink" /> });
  if (pend.loans > 0) todos.push({ key: "l", href: `${base}/loans?status=applied`, tone: "violet", icon: <Landmark />, title: tr("dash.loanApplications"), trailing: <CountPill n={pend.loans} tone="violet" /> });
  if ((t.fundLoanInterestDuePaise ?? 0) > 0) todos.push({ key: "ui", href: `${base}/fund-loans`, tone: "amber", icon: <Banknote />, title: tr("dash.upadInterest"), subtitle: tr("dash.activeUpad", { n: t.activeFundLoans ?? 0 }), trailing: <Money paise={t.fundLoanInterestDuePaise} className="text-sm font-bold text-warning-ink" /> });
  if (olderDue > 0) todos.push({ key: "od", href: `${base}/installments?status=overdue`, tone: "rose", icon: <AlertTriangle />, title: tr("dash.olderHapta"), subtitle: tr("dash.earlierMonths"), trailing: <Money paise={olderDue} className="text-sm font-bold text-destructive" /> });

  return (
    <>
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <OrgLogo logoUrl={org.logoUrl} className="size-6 rounded-md">
            {null}
          </OrgLogo>
          <span className="min-w-0 truncate">
            {org.name} · {tr("dash.fy", { fy: d.financialYear })}
          </span>
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">{tr("dash.namaste", { name: me.user.name.split(" ")[0] })}</h1>
        {org.settings.endMonth && !org.settings.settlement && (
          <p className="mt-1.5 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
            {tr("dash.runsUntil", { month: monthName(lang, org.settings.endMonth) })} · {monthsLeft > 0 ? (monthsLeft === 1 ? tr("dash.oneMonthLeft") : tr("dash.monthsLeft", { n: monthsLeft })) : tr("dash.ended")}
          </p>
        )}
      </div>
      {isAdmin && (org.settings.settlement || (org.settings.endMonth && monthsLeft <= 1)) && org.status === "active" && (
        <Link href={`${base}/settings/close`} className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-500/12 p-3.5 text-sm ring-1 ring-amber-500/30">
          <Lock className="size-5 shrink-0 text-amber-700 dark:text-amber-300" />
          <span className="min-w-0 flex-1">
            <b>{org.settings.settlement ? tr("dash.closingProgress") : monthsLeft > 0 ? tr("dash.endsThisMonth") : tr("dash.endPassed")}</b>
            <span className="block text-xs text-muted-foreground">{org.settings.settlement ? tr("dash.paidOutSoFar", { n: org.settings.settlement.payouts.length }) : tr("dash.settleWhenReady")}</span>
          </span>
          <ArrowRight className="size-4" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* ---- this month's hapta: the hero */}
        <section aria-label="This month's hapta" className="bg-hero relative overflow-hidden rounded-3xl p-5 shadow-lg shadow-primary/20 sm:p-6">
          <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-16 -bottom-16 size-32 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/80">{tr("dash.haptaCollected", { month })}</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums">{money.compact(collected)}</p>
              <p className="mt-0.5 text-sm text-white/80">{tr("dash.ofExpected", { amount: money.short(expected) })}</p>
            </div>
            <span className="rounded-2xl bg-white/15 px-3 py-1.5 text-lg font-bold tabular-nums backdrop-blur">{pct}%</span>
          </div>
          <ProgressBar value={pct} className="relative mt-4 h-3 bg-white/20" barClassName="bg-gradient-to-r from-amber-300 to-yellow-200" label={`${month} collection`} />
          <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/90">
              {monthDue > 0 ? (
                <span className="font-bold">{tr("dash.stillToCollect", { amount: money.short(monthDue) })}</span>
              ) : expected > 0 ? (
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4" /> {tr("dash.everyonePaid")}
                </span>
              ) : (
                tr("dash.noHaptaThisMonth")
              )}
            </p>
            {can(org, "payments.record") && (
              <Link href={`${base}/monthly${monthDue > 0 ? "?show=due" : ""}`} className={cn(buttonVariants({ size: "lg" }), "h-11 bg-white text-indigo-700 shadow-md shadow-black/10 hover:bg-white/90 md:h-11")}>
                <HandCoins /> {tr("dash.collectHapta")}
              </Link>
            )}
          </div>
        </section>

        {/* ---- needs attention */}
        <Card className="gap-2 py-3">
          <CardHeader className="px-4">
            <CardTitle className="text-base font-bold">{tr("dash.needsAttention")}</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            {todos.length === 0 ? (
              <div className="flex items-center gap-3 px-2 py-3">
                <IconChip tone="emerald">
                  <CheckCircle2 />
                </IconChip>
                <div>
                  <p className="text-sm font-semibold">{tr("dash.allCaughtUp")}</p>
                  <p className="text-xs text-muted-foreground">{tr("dash.nothingWaiting")}</p>
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
          <SectionTitle>{tr("dash.quickActions")}</SectionTitle>
          <QuickGrid actions={quick} row />
        </section>
      )}

      <SchemesOverview schemes={d.schemes} orgId={orgId} money={money} />

      <section className="mt-5" aria-label="Mandal fund">
        <SectionTitle>{tr("dash.glance")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={tr("dash.mandalFund")} value={money.compact(t.mandalFundPaise ?? t.mandalCashPaise ?? 0)} icon={<Wallet />} accent="emerald" hint={tr("dash.mandalFundHint", { cash: money.fmt(t.mandalCashPaise ?? 0), upad: money.fmt(t.fundLoansOutstandingPaise ?? 0) })} href={can(org, "accounts.view") ? `${base}/cashbook` : undefined} />
          <StatCard label={tr("dash.memberBalances")} value={money.compact(t.totalMemberBalancesPaise ?? 0)} icon={<PiggyBank />} accent="violet" hint={<BalanceParts parts={t.memberBalanceParts} tr={tr} money={money} />} />
          <StatCard label={tr("dash.upadOut")} value={money.compact(t.fundLoansOutstandingPaise ?? 0)} icon={<HandCoins />} accent="orange" hint={tr("dash.interestDueX", { amount: money.fmt(t.fundLoanInterestDuePaise ?? 0) })} href={`${base}/fund-loans`} />
          <StatCard label={tr("dash.membersCard")} value={t.activeMembers} icon={<Users />} accent="sky" hint={t.totalMembers !== undefined && t.totalMembers !== t.activeMembers ? tr("dash.inTotal", { n: t.totalMembers }) : tr("dash.activeLower")} href={`${base}/members`} />
          <StatCard label={tr("dash.yearHapta")} value={`${d.collectionPerformance.percent}%`} icon={<TrendingUp />} accent="indigo" hint={tr("dash.ofDue", { a: money.fmt(d.collectionPerformance.collectedPaise), b: money.fmt(d.collectionPerformance.duePaise) })} />
          <StatCard label={tr("dash.interestCredited")} value={money.compact(t.interestThisMonthPaise ?? 0)} icon={<Percent />} accent="pink" hint={t.interestThisFyPaise !== undefined ? tr("dash.thisMonthFy", { amount: money.fmt(t.interestThisFyPaise) }) : tr("dash.thisMonth")} />
          <StatCard label={tr("dash.cashReceived")} value={money.compact(t.monthHaptaCashPaise ?? 0)} icon={<ArrowDownToLine />} accent="emerald" hint={tr("dash.haptaAnyMonth")} />
          <StatCard label={tr("dash.pendingHapta")} value={money.compact(t.outstandingHaptaPaise ?? 0)} icon={<CalendarClock />} tone={(t.outstandingHaptaPaise ?? 0) > 0 ? "warn" : "good"} hint={tr("dash.allMonths")} href={`${base}/monthly?show=due`} />
        </div>
        <MemberShare
          cashPaise={t.mandalCashPaise ?? 0}
          upadPaise={t.fundLoansOutstandingPaise ?? 0}
          pendingHaptaPaise={t.outstandingHaptaPaise ?? 0}
          upadInterestPaise={t.fundLoanInterestDuePaise ?? 0}
          members={t.activeMembers ?? 0}
          shares={t.activeShares ?? t.activeMembers ?? 0}
          tr={tr}
          money={money}
        />
        {isAdmin && (t.activeLoans > 0 || incomeBooks) && (
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {t.fyIncomePaise !== undefined && <StatCard label={tr("dash.incomeFy", { fy: d.financialYear })} value={money.compact(t.fyIncomePaise)} icon={<Banknote />} accent="emerald" />}
            {t.fyExpensesPaise !== undefined && <StatCard label={tr("dash.expensesFy", { fy: d.financialYear })} value={money.compact(t.fyExpensesPaise)} icon={<Receipt />} accent="pink" />}
            <StatCard label={tr("dash.activeLoans")} value={t.activeLoans} icon={<Landmark />} accent="violet" hint={tr("dash.principalOut", { amount: money.fmt(t.loanOutstandingPrincipalPaise) })} />
            <StatCard label={tr("dash.overdueCard")} value={money.compact(t.overdueAmountPaise)} icon={<AlertTriangle />} hint={tr("dash.installmentsN", { n: t.overdueInstallments })} tone={t.overdueInstallments > 0 ? "bad" : "good"} />
          </div>
        )}
      </section>

      {d.monthlyChart && incomeBooks && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="font-bold">{tr("dash.incomeVsExpenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={d.monthlyChart} />
          </CardContent>
        </Card>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">{tr("dash.upcoming")}</CardTitle>
            <CardAction>
              <Link href={`${base}/installments?status=upcoming`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}>
                {tr("common.all")} <ArrowRight />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.upcomingDues.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tr("dash.nothingUpcoming")}</p>
            ) : (
              <ul className="divide-y text-sm">
                {d.upcomingDues.map((u: any) => (
                  <li key={u._id} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{u.memberName}</span>
                      <span className="text-xs text-muted-foreground">
                        {tr("dash.dueOn", { period: u.periodLabel, date: formatDate(u.dueDate) })}
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
            <CardTitle className="font-bold">{tr("dash.activity")}</CardTitle>
            {can(org, "transactions.view") && (
              <CardAction>
                <Link href={`${base}/transactions`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}>
                  {tr("dash.ledger")} <ArrowRight />
                </Link>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {d.recentTransactions.length === 0 ? (
              <EmptyState title={tr("dash.noTx")} description={tr("dash.noTxDesc")} />
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
            <CardTitle className="font-bold">{tr("dash.recentWithdrawals")}</CardTitle>
            <CardAction>
              <Link href={`${base}/withdrawals`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}>
                {tr("common.all")} <ArrowRight />
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
            <CardTitle className="font-bold">{tr("dash.accountBalances")}</CardTitle>
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

/** "Opening ₹1,000 + hapta ₹9,000 + interest ₹10 − withdrawn ₹500" — how the total member balances is made up. */
function BalanceParts({ parts, tr, money }: { tr: T; money: MoneyFmt; parts?: { openingPaise: number; haptaPaise: number; interestPaise: number; withdrawalsPaise: number; otherPaise: number } }) {
  if (!parts) return <>{tr("dash.owedToMembers")}</>;
  const plus = [
    [tr("dash.opening"), parts.openingPaise],
    [tr("dash.hapta"), parts.haptaPaise],
    [tr("dash.interestLower"), parts.interestPaise],
  ].filter(([, v]) => (v as number) !== 0) as [string, number][];
  return (
    <span className="leading-relaxed">
      {plus.map(([l, v], i) => (
        <span key={l}>
          {i > 0 && " + "}
          {i === 0 ? l.charAt(0).toUpperCase() + l.slice(1) : l} <span className="font-semibold text-foreground">{money.short(v)}</span>
        </span>
      ))}
      {plus.length === 0 && tr("dash.owedToMembers")}
      {parts.withdrawalsPaise !== 0 && (
        <>
          {" "}
          − {tr("dash.withdrawn")} <span className="font-semibold text-rose-600 dark:text-rose-300">{money.short(parts.withdrawalsPaise)}</span>
        </>
      )}
      {parts.otherPaise !== 0 && (
        <>
          {" "}
          {parts.otherPaise > 0 ? "+" : "−"} {tr("dash.adjustments")} <span className="font-semibold text-foreground">{money.short(Math.abs(parts.otherPaise))}</span>
        </>
      )}
    </span>
  );
}

/**
 * Everything the Mandal has or is owed — cash, upad still out, hapta not yet paid and upad interest
 * due — shared equally by the active members.
 */
function MemberShare({ cashPaise, upadPaise, pendingHaptaPaise, upadInterestPaise, members, shares, tr, money }: { tr: T; money: MoneyFmt; cashPaise: number; upadPaise: number; pendingHaptaPaise: number; upadInterestPaise: number; members: number; shares: number }) {
  const total = cashPaise + upadPaise + pendingHaptaPaise + upadInterestPaise;
  // members paying several haptas count once per hapta
  const byShares = shares !== members;
  const parts = byShares ? shares : members;
  const each = parts > 0 ? Math.floor(total / parts) : 0;
  const rows: [string, number, Tone][] = [
    [tr("dash.shareCash"), cashPaise, "emerald"],
    [tr("dash.shareUpad"), upadPaise, "orange"],
    [tr("dash.shareHapta2"), pendingHaptaPaise, "indigo"],
    [tr("dash.shareInterest"), upadInterestPaise, "amber"],
  ];
  return (
    <Card className="mt-3 gap-0 p-0 md:flex-row" aria-label="Each member's share">
      <div className="bg-hero-green flex flex-col justify-center gap-1 p-5 md:w-72 md:shrink-0">
        <p className="text-sm font-medium text-white/85">{byShares ? tr("dash.shareHapta") : tr("dash.shareMember")}</p>
        <p className="text-4xl font-extrabold tracking-tight tabular-nums">{money.short(each)}</p>
        <p className="text-sm text-white/85">
          {byShares ? tr("dash.shareDivShares", { total: money.short(total), shares, n: members }) : tr("dash.shareDiv", { total: money.short(total), n: members })}
        </p>
        {byShares && <p className="mt-1 text-xs text-white/75">{tr("dash.share3", { amount: money.short(each * 3) })}</p>}
      </div>
      <div className="flex-1 p-4 sm:px-5">
        <ul className="divide-y text-sm">
          {rows.map(([l, v, tone]) => (
            <li key={l} className="flex items-center justify-between gap-3 py-2">
              <span className="flex items-center gap-2.5">
                <span className={cn("size-2.5 rounded-full", TONE_DOT[tone])} />
                {l}
              </span>
              <Money paise={v} short className={cn("font-semibold", v === 0 && "text-muted-foreground")} />
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 py-2 font-bold">
            <span>{tr("dash.shareTotal")}</span>
            <Money paise={total} short />
          </li>
        </ul>
        <p className="mt-1 text-xs text-muted-foreground">
          {byShares ? tr("dash.shareNoteShares") : tr("dash.shareNoteMembers")}
        </p>
      </div>
    </Card>
  );
}

const TONE_DOT: Partial<Record<Tone, string>> = { emerald: "bg-emerald-500", orange: "bg-orange-500", indigo: "bg-indigo-500", amber: "bg-amber-500" };
