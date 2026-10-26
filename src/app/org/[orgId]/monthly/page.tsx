import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { can, getOrg } from "@/lib/server/data";
import type { FundLoanMonth, MonthView } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { ActionButton } from "@/components/app/action-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate, formatINR, paiseToRupeeInput } from "@/lib/format";
import { requestMonth } from "@/lib/server/today";
import { CollectDialog } from "@/features/monthly/collect-dialog";
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

  const rows = view.rows.filter((r) => (filter === "due" ? r.outstandingPaise > 0 : filter === "paid" ? r.status === "paid" : true));
  const s = view.summary;
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
                Month summary
              </Link>
            )}
            {isAdmin && <ChangeHaptaDialog currentRupees={paiseToRupeeInput(hapta.amountPaise)} nextMonth={addMonths(thisMonth, 1)} />}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`${base}?month=${addMonths(m, -1)}`} aria-label="Previous month" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
          <ChevronLeft />
        </Link>
        <form action={base} className="flex items-center gap-2">
          <Input type="month" name="month" defaultValue={m} className="w-40" aria-label="Month" />
          <Button type="submit" size="sm" variant="secondary">
            Go
          </Button>
        </form>
        <Link href={`${base}?month=${addMonths(m, 1)}`} aria-label="Next month" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
          <ChevronRight />
        </Link>
        <span className="ml-1 font-medium">{monthName(m)}</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Expected" value={<Money paise={s.expectedPaise} />} hint={`${s.members} member${s.members === 1 ? "" : "s"}`} />
        <StatCard label="Collected" value={<Money paise={s.collectedPaise} />} tone="good" hint={`${s.paid} paid · ${s.partiallyPaid} part paid`} />
        <StatCard label="Still due" value={<Money paise={s.outstandingPaise} />} tone={s.outstandingPaise > 0 ? "warn" : "default"} hint={`${s.pending} pending · ${s.overdue} overdue`} />
        <StatCard label="Cash received this month" value={<Money paise={s.cashReceivedInMonthPaise} />} hint="Hapta cash by date received (any month)" />
      </div>

      <div className="mb-3 flex gap-1 text-sm">
        {[
          ["", "All"],
          ["due", "Due"],
          ["paid", "Paid"],
        ].map(([k, l]) => (
          <Link key={k} href={`${base}${qs({ month: m, show: k })}`} className={`rounded-full px-3 py-1 ${filter === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {l}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title={view.rows.length ? "Nothing in this filter" : "No hapta for this month"} description={view.rows.length ? undefined : "This month is before the hapta started, or no members are enrolled."} />
      ) : (
        <Card className="divide-y p-0">
          <div className="hidden grid-cols-[1.6fr_repeat(3,1fr)_1fr_1.2fr_auto] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
            <span>Member</span>
            <span className="text-right">Expected</span>
            <span className="text-right">Collected</span>
            <span className="text-right">Due</span>
            <span>Status</span>
            <span>Paid on · by</span>
            <span className="w-20" />
          </div>
          {rows.map((r) => (
            <div key={r.installmentId} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[1.6fr_repeat(3,1fr)_1fr_1.2fr_auto]">
              <div className="min-w-0">
                <Link href={`/org/${orgId}/members/${r.memberId}`} className="truncate font-medium hover:underline">
                  {r.member?.name ?? "—"}
                </Link>
                <div className="text-xs text-muted-foreground">{r.member?.membershipNumber}</div>
              </div>
              <Money paise={r.expectedPaise} className="hidden text-right md:block" />
              <Money paise={r.collectedPaise} className="hidden text-right md:block" />
              <Money paise={r.outstandingPaise} className={`hidden text-right md:block ${r.outstandingPaise > 0 ? "font-medium" : "text-muted-foreground"}`} />
              <div className="row-start-2 flex items-center gap-2 md:row-start-auto">
                <StatusBadge status={r.status} />
                {r.status === "overdue" && r.collectedPaise > 0 && <span className="text-xs text-muted-foreground">part paid</span>}
              </div>
              <div className="col-span-2 row-start-3 text-xs text-muted-foreground md:col-span-1 md:row-start-auto">
                <span className="md:hidden">
                  <Money paise={r.collectedPaise} /> of <Money paise={r.expectedPaise} />
                  {r.lastPaymentDate ? " · " : ""}
                </span>
                {r.lastPaymentDate ? `${formatDate(r.lastPaymentDate)}${r.recordedBy.length ? ` · ${r.recordedBy.join(", ")}` : ""}` : <span className="hidden md:inline">—</span>}
              </div>
              <div className="col-start-2 row-span-2 row-start-1 flex justify-end md:col-start-auto md:row-span-1 md:row-start-auto md:w-20">
                {canCollect && r.state === "active" && r.outstandingPaise > 0 ? (
                  <CollectDialog installmentId={r.installmentId} memberName={r.member?.name ?? "member"} period={monthName(m)} outstandingPaise={r.outstandingPaise} />
                ) : r.payments.at(-1)?.receiptId ? (
                  <Link href={`/org/${orgId}/receipts/${r.payments.at(-1)!.receiptId}`} className="text-xs font-medium text-primary hover:underline">
                    Receipt
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </Card>
      )}

      {loans.rows.length > 0 && (
        <section className="mt-6" aria-label="Upad interest">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-semibold">Upad interest — {monthName(m)}</h2>
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
                    <span className="text-warning">
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
