import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import type { FundLoanMonthRow, MonthView } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { TableWrap } from "@/components/app/table-wrap";
import { PrintButton } from "@/components/app/print-button";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requestMonth } from "@/lib/server/today";

export const metadata = { title: "Monthly summary" };

interface MemberRow {
  memberId: string;
  name: string;
  membershipNumber: string;
  openingPaise: number;
  haptaPaise: number;
  interestPaise: number;
  withdrawalsPaise: number;
  otherPaise: number;
  closingPaise: number;
}
interface Report {
  month: string;
  hapta: MonthView["summary"];
  interestCreditedPaise: number;
  withdrawalsPaidPaise: number;
  cash: { openingPaise: number; haptaCollectedPaise: number; otherReceiptsPaise: number; withdrawalsPaidPaise: number; otherExpensesPaise: number; loansGivenPaise: number; loanPaymentsReceivedPaise: number; closingPaise: number };
  fundLoans: { loans: number; interestThisMonthPaise: number; collectedThisMonthPaise: number; totalDuePaise: number; outstandingAtMonthEndPaise: number; rows: FundLoanMonthRow[] };
  mandalFundPaise: number;
  members: MemberRow[];
  memberTotals: Omit<MemberRow, "memberId" | "name" | "membershipNumber">;
  mandalSurplusPaise: number;
}

const addMonths = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
};
const monthName = (m: string) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

export default async function MonthlyReportPage({ params, searchParams }: PageProps<"/org/[orgId]/monthly/report">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const m = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : await requestMonth();
  const r = await api<Report>(`/orgs/${orgId}/monthly-report${qs({ month: m })}`);
  const base = `/org/${orgId}/monthly/report`;
  const c = r.cash;
  return (
    <>
      <PageHeader
        title={`Monthly summary — ${monthName(r.month)}`}
        description="Hapta, interest, withdrawals, cash and every member's balance for the month."
        actions={
          <>
            <Link href={`${base}?month=${addMonths(m, -1)}`} aria-label="Previous month" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
              <ChevronLeft />
            </Link>
            <Link href={`${base}?month=${addMonths(m, 1)}`} aria-label="Next month" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
              <ChevronRight />
            </Link>
            <a href={`/api/export${qs({ path: `/orgs/${orgId}/monthly-report`, month: m })}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Download CSV
            </a>
            <PrintButton label="Print" />
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Hapta expected" value={<Money paise={r.hapta.expectedPaise} />} hint={`${r.hapta.members} members`} />
        <StatCard label="Hapta collected" value={<Money paise={r.hapta.collectedPaise} />} tone="good" hint={`${r.hapta.paid} paid · ${r.hapta.partiallyPaid + r.hapta.pending + r.hapta.overdue} not fully paid`} />
        <StatCard label="Interest credited" value={<Money paise={r.interestCreditedPaise} />} />
        <StatCard label="Withdrawals paid" value={<Money paise={r.withdrawalsPaidPaise} />} />
      </div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Cash for the month</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid max-w-md grid-cols-[1fr_auto] gap-y-1.5 text-sm">
            <dt>Opening cash</dt>
            <dd className="text-right"><Money paise={c.openingPaise} /></dd>
            <dt>+ Hapta collected</dt>
            <dd className="text-right"><Money paise={c.haptaCollectedPaise} /></dd>
            <dt>+ Upad interest &amp; repayments</dt>
            <dd className="text-right"><Money paise={c.loanPaymentsReceivedPaise} /></dd>
            <dt>+ Other receipts</dt>
            <dd className="text-right"><Money paise={c.otherReceiptsPaise} /></dd>
            <dt>− Upad given</dt>
            <dd className="text-right"><Money paise={c.loansGivenPaise} /></dd>
            <dt>− Withdrawals paid</dt>
            <dd className="text-right"><Money paise={c.withdrawalsPaidPaise} /></dd>
            <dt>− Other expenses</dt>
            <dd className="text-right"><Money paise={c.otherExpensesPaise} /></dd>
            <dt className="border-t pt-1.5 font-semibold">Closing cash</dt>
            <dd className="border-t pt-1.5 text-right font-semibold"><Money paise={c.closingPaise} /></dd>
            <dt>Upad still out with members</dt>
            <dd className="text-right"><Money paise={r.fundLoans.outstandingAtMonthEndPaise} /></dd>
            <dt className="font-semibold">Mandal fund (cash + upad)</dt>
            <dd className="text-right font-semibold"><Money paise={r.mandalFundPaise} /></dd>
            <dt className="text-muted-foreground">Owed to members (closing balances)</dt>
            <dd className="text-right text-muted-foreground"><Money paise={r.memberTotals.closingPaise} /></dd>
            <dt className="text-muted-foreground">Fund minus member balances</dt>
            <dd className="text-right"><Money paise={r.mandalSurplusPaise} colored /></dd>
          </dl>
        </CardContent>
      </Card>
      {r.fundLoans.rows.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Upad interest</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">
              Due this month <Money paise={r.fundLoans.interestThisMonthPaise} /> · collected <Money paise={r.fundLoans.collectedThisMonthPaise} /> · still unpaid (incl. earlier months) <Money paise={r.fundLoans.totalDuePaise} className="font-medium text-foreground" />
            </p>
            <ul className="divide-y text-sm">
              {r.fundLoans.rows.map((x) => (
                <li key={x.loanId} className="flex items-center justify-between gap-2 py-1.5">
                  <span>
                    {x.member?.name ?? "—"} <span className="text-xs text-muted-foreground">{x.number} · <Money paise={x.outstandingPaise} /> @ {x.monthlyRate}%</span>
                  </span>
                  <span className="text-right">
                    <Money paise={x.thisMonth?.interestPaise ?? 0} />
                    {x.totalDuePaise > 0 && (
                      <span className="block text-xs text-warning">
                        <Money paise={x.totalDuePaise} /> unpaid
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <h2 className="mb-2 font-semibold">Member balances</h2>
      {r.members.length === 0 ? (
        <EmptyState title="No member activity" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Hapta</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">Withdrawn</TableHead>
                <TableHead className="text-right">Other</TableHead>
                <TableHead className="text-right">Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.members.map((x) => (
                <TableRow key={x.memberId}>
                  <TableCell>
                    <Link href={`/org/${orgId}/members/${x.memberId}`} className="font-medium hover:underline">
                      {x.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{x.membershipNumber}</div>
                  </TableCell>
                  <TableCell className="text-right"><Money paise={x.openingPaise} /></TableCell>
                  <TableCell className="text-right"><Money paise={x.haptaPaise} /></TableCell>
                  <TableCell className="text-right"><Money paise={x.interestPaise} /></TableCell>
                  <TableCell className="text-right"><Money paise={x.withdrawalsPaise} /></TableCell>
                  <TableCell className="text-right"><Money paise={x.otherPaise} /></TableCell>
                  <TableCell className="text-right font-medium"><Money paise={x.closingPaise} colored={x.closingPaise < 0} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right"><Money paise={r.memberTotals.openingPaise} /></TableCell>
                <TableCell className="text-right"><Money paise={r.memberTotals.haptaPaise} /></TableCell>
                <TableCell className="text-right"><Money paise={r.memberTotals.interestPaise} /></TableCell>
                <TableCell className="text-right"><Money paise={r.memberTotals.withdrawalsPaise} /></TableCell>
                <TableCell className="text-right"><Money paise={r.memberTotals.otherPaise} /></TableCell>
                <TableCell className="text-right"><Money paise={r.memberTotals.closingPaise} /></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
