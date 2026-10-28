import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, CalendarCheck, ChevronLeft, ChevronRight, HandCoins, Percent, Users, Wallet } from "lucide-react";
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
import { IconChip, MemberAvatar, SectionTitle } from "@/components/app/bits";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requestMonth } from "@/lib/server/today";
import { ExportCsvButton } from "@/components/app/export-csv-button";

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
  cash: {
    openingPaise: number;
    haptaCollectedPaise: number;
    otherReceiptsPaise: number;
    withdrawalsPaidPaise: number;
    otherExpensesPaise: number;
    loansGivenPaise: number;
    loanPaymentsReceivedPaise: number;
    closingPaise: number;
  };
  fundLoans: {
    loans: number;
    interestThisMonthPaise: number;
    collectedThisMonthPaise: number;
    totalDuePaise: number;
    outstandingAtMonthEndPaise: number;
    rows: FundLoanMonthRow[];
  };
  mandalFundPaise: number;
  members: MemberRow[];
  memberTotals: Omit<MemberRow, "memberId" | "name" | "membershipNumber">;
  mandalSurplusPaise: number;
}

const addMonths = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
};
const monthName = (m: string) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${m}-01T00:00:00Z`));

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
            <Link
              href={`${base}?month=${addMonths(m, -1)}`}
              aria-label="Previous month"
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
            >
              <ChevronLeft />
            </Link>
            <Link
              href={`${base}?month=${addMonths(m, 1)}`}
              aria-label="Next month"
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
            >
              <ChevronRight />
            </Link>
            <ExportCsvButton href={`/api/export${qs({ path: `/orgs/${orgId}/monthly-report`, month: m })}`}>Download CSV</ExportCsvButton>
            <PrintButton label="Print" />
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Hapta expected" value={<Money paise={r.hapta.expectedPaise} />} hint={`${r.hapta.members} members`} icon={<CalendarCheck />} accent="indigo" />
        <StatCard
          label="Hapta collected"
          value={<Money paise={r.hapta.collectedPaise} />}
          tone="good"
          icon={<ArrowDownToLine />}
          hint={`${r.hapta.paid} paid · ${r.hapta.partiallyPaid + r.hapta.pending + r.hapta.overdue} not fully paid`}
        />
        <StatCard label="Interest credited" value={<Money paise={r.interestCreditedPaise} />} icon={<Percent />} accent="violet" />
        <StatCard label="Withdrawals paid" value={<Money paise={r.withdrawalsPaidPaise} />} icon={<ArrowUpFromLine />} accent="rose" />
      </div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <IconChip tone="emerald" size="sm">
              <Wallet />
            </IconChip>
            Cash for the month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid max-w-md grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
            <dt>Opening cash</dt>
            <dd className="text-right">
              <Money paise={c.openingPaise} />
            </dd>
            <dt>+ Hapta collected</dt>
            <dd className="text-right">
              <Money paise={c.haptaCollectedPaise} />
            </dd>
            <dt>+ Upad interest &amp; repayments</dt>
            <dd className="text-right">
              <Money paise={c.loanPaymentsReceivedPaise} />
            </dd>
            <dt>+ Other receipts</dt>
            <dd className="text-right">
              <Money paise={c.otherReceiptsPaise} />
            </dd>
            <dt>− Upad given</dt>
            <dd className="text-right">
              <Money paise={c.loansGivenPaise} />
            </dd>
            <dt>− Withdrawals paid</dt>
            <dd className="text-right">
              <Money paise={c.withdrawalsPaidPaise} />
            </dd>
            <dt>− Other expenses</dt>
            <dd className="text-right">
              <Money paise={c.otherExpensesPaise} />
            </dd>
            <dt className="border-t pt-1.5 font-bold">Closing cash</dt>
            <dd className="border-t pt-1.5 text-right font-bold text-success">
              <Money paise={c.closingPaise} colored={c.closingPaise < 0} />
            </dd>
            <dt>Upad still out with members</dt>
            <dd className="text-right">
              <Money paise={r.fundLoans.outstandingAtMonthEndPaise} />
            </dd>
            <dt className="font-semibold">Mandal fund (cash + upad)</dt>
            <dd className="text-right font-semibold">
              <Money paise={r.mandalFundPaise} />
            </dd>
            <dt className="text-muted-foreground">Owed to members (closing balances)</dt>
            <dd className="text-right text-muted-foreground">
              <Money paise={r.memberTotals.closingPaise} />
            </dd>
            <dt className="text-muted-foreground">Fund minus member balances</dt>
            <dd className="text-right">
              <Money paise={r.mandalSurplusPaise} colored />
            </dd>
          </dl>
        </CardContent>
      </Card>
      {r.fundLoans.rows.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <IconChip tone="orange" size="sm">
                <HandCoins />
              </IconChip>
              Upad interest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">
              Due this month <Money paise={r.fundLoans.interestThisMonthPaise} /> · collected <Money paise={r.fundLoans.collectedThisMonthPaise} /> · still unpaid (incl. earlier months){" "}
              <Money paise={r.fundLoans.totalDuePaise} className="font-medium text-foreground" />
            </p>
            <ul className="divide-y text-sm">
              {r.fundLoans.rows.map((x) => (
                <li key={x.loanId} className="flex items-center justify-between gap-2 py-2">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <MemberAvatar name={x.member?.name ?? "?"} size="sm" className="print:hidden" />
                    <span className="min-w-0">
                      <span className="block font-medium">{x.member?.name ?? "—"}</span>
                      <span className="block text-xs text-muted-foreground">
                        {x.number} · <Money paise={x.outstandingPaise} /> @ {x.monthlyRate}%
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <Money paise={x.thisMonth?.interestPaise ?? 0} className="font-semibold" />
                    {x.totalDuePaise > 0 && (
                      <span className="block text-xs text-warning-ink">
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
      <SectionTitle>Member balances</SectionTitle>
      {r.members.length === 0 ? (
        <EmptyState icon={<Users />} title="No member activity" />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden print:hidden" aria-label="Member balances">
            {r.members.map((x) => (
              <li key={x.memberId} className="rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
                <div className="flex items-center gap-3">
                  <MemberAvatar name={x.name} size="sm" />
                  <Link href={`/org/${orgId}/members/${x.memberId}`} className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-semibold hover:underline">{x.name}</span>
                    <span className="block text-xs text-muted-foreground">{x.membershipNumber}</span>
                  </Link>
                  <Money paise={x.closingPaise} colored={x.closingPaise < 0} className="font-bold" />
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 rounded-xl bg-muted/50 px-3 py-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Opening</dt>
                    <dd>
                      <Money paise={x.openingPaise} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Hapta</dt>
                    <dd>
                      <Money paise={x.haptaPaise} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Interest</dt>
                    <dd>
                      <Money paise={x.interestPaise} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Withdrawn</dt>
                    <dd>
                      <Money paise={x.withdrawalsPaise} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Other</dt>
                    <dd>
                      <Money paise={x.otherPaise} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
            <li className="flex items-center justify-between rounded-2xl bg-muted/50 px-3.5 py-2.5 text-sm font-bold">
              <span>Total closing</span>
              <Money paise={r.memberTotals.closingPaise} />
            </li>
          </ul>
          <div className="hidden md:block print:block">
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
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar name={x.name} size="sm" className="print:hidden" />
                          <div>
                            <Link href={`/org/${orgId}/members/${x.memberId}`} className="font-semibold hover:underline">
                              {x.name}
                            </Link>
                            <div className="text-xs text-muted-foreground">{x.membershipNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={x.openingPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={x.haptaPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={x.interestPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={x.withdrawalsPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={x.otherPaise} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money paise={x.closingPaise} colored={x.closingPaise < 0} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      <Money paise={r.memberTotals.openingPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={r.memberTotals.haptaPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={r.memberTotals.interestPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={r.memberTotals.withdrawalsPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={r.memberTotals.otherPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={r.memberTotals.closingPaise} />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
    </>
  );
}
