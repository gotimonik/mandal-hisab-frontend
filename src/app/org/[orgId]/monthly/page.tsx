import Link from "next/link";
import { ArrowDownToLine, BarChart3, CalendarDays } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { can, getOrg } from "@/lib/server/data";
import type { FundLoanMonth, MonthView } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { ActionButton } from "@/components/app/action-button";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatINR, paiseToRupeeInput } from "@/lib/format";
import { requestMonth } from "@/lib/server/today";
import { MonthList, MonthSwitcher } from "@/features/monthly/month-list";
import { IconChip, ProgressBar } from "@/components/app/bits";
import { ChangeHaptaDialog, HaptaSetupForm } from "@/features/monthly/hapta-setup";
import { LoanPaymentDialog } from "@/features/fund-loans/loan-payment-dialog";

export const metadata = { title: "Monthly hapta" };

const addMonths = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
};
const monthName = (m: string) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

export default async function MonthlyPage({ params, searchParams }: PageProps<"/org/[orgId]/monthly">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const thisMonth = await requestMonth();
  const m = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth;
  const filter = typeof sp.show === "string" ? sp.show : "";
  const [org, view, loans] = await Promise.all([getOrg(orgId), api<MonthView>(`/orgs/${orgId}/monthly${qs({ month: m })}`), api<FundLoanMonth>(`/orgs/${orgId}/fund-loans/month${qs({ month: m })}`)]);
  const base = `/org/${orgId}/monthly`;
  const canCollect = can(org, "payments.record") && org.status === "active";
  const isAdmin = can(org, "org.settings.manage");
  const hapta = org.settings.monthlyHapta;

  if (!hapta) {
    return (
      <>
        <PageHeader title="Monthly hapta" description="Each active member pays a fixed amount every month, in cash." />
        {isAdmin ? (
          <Card className="p-5">
            <h2 className="mb-1 font-medium">Set up your Mandal&apos;s monthly hapta</h2>
            <p className="mb-4 text-sm text-muted-foreground">For example ₹500 for a family Mandal or ₹1,000 for a friends&apos; Mandal. You can change it later — changes apply to future months only.</p>
            <HaptaSetupForm inline />
          </Card>
        ) : (
          <EmptyState icon={<CalendarDays />} title="Monthly hapta isn't set up yet" description="Ask the Mandal admin to set the monthly amount in Settings." />
        )}
      </>
    );
  }

  const s = view.summary;
  const pct = s.expectedPaise > 0 ? Math.round((s.collectedPaise / s.expectedPaise) * 100) : 0;
  const toCollect = view.rows.filter((r) => r.outstandingPaise > 0).length;
  return (
    <>
      <PageHeader
        title="Monthly hapta"
        description={
          <>
            {formatINR(hapta.amountPaise)} per member, due by day {hapta.dueDay} of each month
          </>
        }
        actions={
          <>
            {can(org, "reports.view") && (
              <Link href={`${base}/report?month=${m}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <BarChart3 /> Month summary
              </Link>
            )}
            {isAdmin && <ChangeHaptaDialog currentRupees={paiseToRupeeInput(hapta.amountPaise)} nextMonth={addMonths(thisMonth, 1)} />}
          </>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-stretch">
        <MonthSwitcher month={m} label={monthName(m)} base={base} prev={addMonths(m, -1)} next={addMonths(m, 1)} />
        <section aria-label={`${monthName(m)} collection`} className="bg-hero relative overflow-hidden rounded-3xl p-4 shadow-lg shadow-primary/20 sm:p-5 lg:row-span-2">
          <div className="pointer-events-none absolute -top-12 -right-8 size-36 rounded-full bg-white/10" />
          <div className="relative flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white/80">Collected in {monthName(m)}</p>
              <p className="text-3xl font-extrabold tracking-tight tabular-nums">
                <Money paise={s.collectedPaise} short />
              </p>
              <p className="text-xs text-white/80">
                of <Money paise={s.expectedPaise} short /> expected · {s.members} member{s.members === 1 ? "" : "s"}
              </p>
            </div>
            <span className="rounded-2xl bg-white/15 px-3 py-1.5 text-lg font-bold tabular-nums">{pct}%</span>
          </div>
          <ProgressBar value={pct} className="relative mt-3 h-2.5 bg-white/20" barClassName="bg-gradient-to-r from-amber-300 to-yellow-200" label="Collected this month" />
          <div className="relative mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/12 px-2 py-2">
              <p className="text-lg leading-tight font-bold tabular-nums">{s.paid}</p>
              <p className="text-[11px] text-white/80">paid</p>
            </div>
            <div className="rounded-2xl bg-white/12 px-2 py-2">
              <p className="text-lg leading-tight font-bold tabular-nums">{toCollect}</p>
              <p className="text-[11px] text-white/80">to collect</p>
            </div>
            <div className="rounded-2xl bg-white/12 px-2 py-2">
              <p className="text-lg leading-tight font-bold tabular-nums">
                <Money paise={s.outstandingPaise} short />
              </p>
              <p className="text-[11px] text-white/80">still due</p>
            </div>
          </div>
        </section>
        <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm shadow-card ring-1 ring-foreground/[0.06]">
          <IconChip tone="emerald" size="sm">
            <ArrowDownToLine />
          </IconChip>
          <span className="min-w-0 flex-1 text-muted-foreground">Cash received in {monthName(m)} (any month&apos;s hapta)</span>
          <Money paise={s.cashReceivedInMonthPaise} className="font-bold text-foreground" />
        </div>
      </div>

      <MonthList orgId={orgId} rows={view.rows} period={monthName(m)} canCollect={canCollect} initialFilter={filter} />

      {loans.rows.length > 0 && (
        <section className="mt-8" aria-label="Upad interest">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">Upad interest — {monthName(m)}</h2>
              <p className="text-sm text-muted-foreground">
                Interest on upad given from the fund. This month <Money paise={loans.summary.interestThisMonthPaise} />, collected <Money paise={loans.summary.collectedThisMonthPaise} />, still due (incl. earlier months) <Money paise={loans.summary.totalDuePaise} className="font-medium text-foreground" />.
              </p>
            </div>
            <Link href={`/org/${orgId}/fund-loans`} className="text-sm font-medium text-primary hover:underline">
              All upad
            </Link>
          </div>
          <Card className="divide-y p-0">
            {loans.rows.map((r) => (
              <div key={r.loanId} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
                <div className="min-w-0">
                  <Link href={`/org/${orgId}/fund-loans/${r.loanId}`} className="truncate font-medium hover:underline">
                    {r.member?.name ?? "—"}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {r.number} · <Money paise={r.outstandingPaise} /> @ {r.monthlyRate}%
                  </div>
                </div>
                <div className="col-span-2 row-start-2 text-sm md:col-span-1 md:row-start-auto">
                  <span className="text-xs text-muted-foreground md:hidden">This month </span>
                  {r.thisMonth ? <Money paise={r.thisMonth.interestPaise} /> : "—"}
                  {r.thisMonth && r.thisMonth.paidPaise > 0 && r.thisMonth.paidPaise < r.thisMonth.interestPaise && <span className="text-xs text-muted-foreground"> (paid <Money paise={r.thisMonth.paidPaise} />)</span>}
                </div>
                <div className="col-span-2 row-start-3 text-sm md:col-span-1 md:row-start-auto">
                  {r.carriedForwardPaise > 0 ? (
                    <span className="text-warning-ink">
                      + <Money paise={r.carriedForwardPaise} /> unpaid from {r.carriedForwardMonths.length} earlier month{r.carriedForwardMonths.length === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="hidden text-muted-foreground md:inline">No earlier dues</span>
                  )}
                </div>
                <div className="col-span-2 row-start-4 flex items-center gap-2 md:col-span-1 md:row-start-auto">
                  <StatusBadge status={r.status} />
                  {r.totalDuePaise > 0 && <Money paise={r.totalDuePaise} className="text-sm font-medium" />}
                </div>
                <div className="col-start-2 row-start-1 flex justify-end md:col-start-auto md:row-start-auto md:w-24">
                  {canCollect && r.totalDuePaise > 0 && <LoanPaymentDialog loanId={r.loanId} number={r.number} memberName={r.member?.name ?? "member"} interestDuePaise={r.totalDuePaise} outstandingPaise={r.outstandingPaise} size="xs" label="Receive" />}
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {view.notEnrolled.length > 0 && can(org, "members.manage") && (
        <Card className="mt-4 gap-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-medium">Not in the monthly hapta for {monthName(m)}</h2>
              <p className="text-sm text-muted-foreground">These active members have no hapta for this month (added without hapta, or joined later).</p>
            </div>
            {org.status === "active" && (
              <ActionButton path={`/orgs/${orgId}/monthly/enroll`} body={{ memberIds: view.notEnrolled.map((x) => x._id), startMonth: m }} successMessage="Members added to the monthly hapta" confirm={{ title: `Add ${view.notEnrolled.length} member(s) to the monthly hapta from ${monthName(m)}?`, confirmLabel: "Add" }}>
                Add all from {monthName(m)}
              </ActionButton>
            )}
          </div>
          <p className="text-sm">{view.notEnrolled.map((x) => x.name).join(", ")}</p>
        </Card>
      )}
    </>
  );
}
