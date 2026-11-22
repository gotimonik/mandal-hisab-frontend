import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight, Landmark, Users, Wallet } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getMoney, getOrg } from "@/lib/server/data";
import type { FundLoanMonthRow, MonthView } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { TableWrap } from "@/components/app/table-wrap";
import { PrintButton } from "@/components/app/print-button";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requestMonth } from "@/lib/server/today";
import { ExportCsvButton } from "@/components/app/export-csv-button";
import { getT } from "@/i18n/server";
import { monthName } from "@/i18n/core";
import { cn } from "@/lib/utils";

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
interface ActivityRow {
  memberId: string;
  name: string;
  membershipNumber: string;
  haptaPaise: number;
  upadInterestPaise: number;
  upadReturnedPaise: number;
  totalInPaise: number;
  upadGivenPaise: number;
  withdrawnPaise: number;
  upadLeftPaise: number;
  haptaPendingPaise: number;
}
type ActivityTotals = Omit<ActivityRow, "memberId" | "name" | "membershipNumber">;
interface Report {
  month: string;
  hapta: MonthView["summary"];
  cash: {
    openingPaise: number;
    haptaCollectedPaise: number;
    otherReceiptsPaise: number;
    withdrawalsPaidPaise: number;
    otherExpensesPaise: number;
    loansGivenPaise: number;
    loanPaymentsReceivedPaise: number;
    upadInterestPaise: number;
    upadReturnedPaise: number;
    closingPaise: number;
  };
  activity: { rows: ActivityRow[]; totals: ActivityTotals };
  fundLoans: { outstandingAtMonthEndPaise: number; rows: FundLoanMonthRow[] };
  mandalFundPaise: number;
  members: MemberRow[];
  memberTotals: Omit<MemberRow, "memberId" | "name" | "membershipNumber">;
  mandalSurplusPaise: number;
}

const addMonths = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
};

/** A money cell that shows a soft dash for zero, so the figures that matter stand out. */
function Amt({ paise, className }: { paise: number; className?: string }) {
  return paise ? <Money paise={paise} className={className} /> : <span className="text-muted-foreground/50">—</span>;
}

export default async function MonthlyReportPage({ params, searchParams }: PageProps<"/org/[orgId]/monthly/report">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const m = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : await requestMonth();
  const [r, org, { t, lang }] = await Promise.all([api<Report>(`/orgs/${orgId}/monthly-report${qs({ month: m })}`), getOrg(orgId), getT()]);
  const money = await getMoney(orgId); // org already fetched above, so this is instant
  const fmtPlain = (p: number) => money.fmt(p);
  const base = `/org/${orgId}/monthly/report`;
  const c = r.cash;
  const month = monthName(lang, r.month);
  const a = r.activity;
  const totalIn = c.haptaCollectedPaise + c.loanPaymentsReceivedPaise + c.otherReceiptsPaise;
  const totalOut = c.loansGivenPaise + c.withdrawalsPaidPaise + c.otherExpensesPaise;
  const showWithdrawn = a.totals.withdrawnPaise !== 0;
  // unpaid upad interest per member (this month and earlier), shown under the interest they paid
  const unpaidInterest = new Map<string, number>();
  for (const x of r.fundLoans.rows) if (x.totalDuePaise > 0) unpaidInterest.set(x.memberId, (unpaidInterest.get(x.memberId) ?? 0) + x.totalDuePaise);
  const pendingMembers = a.rows.filter((x) => x.haptaPendingPaise > 0).length;

  const inLines: [string, number][] = [
    [t("mreport.hapta"), c.haptaCollectedPaise],
    [t("mreport.upadInterest"), c.upadInterestPaise],
    [t("mreport.upadReturned"), c.upadReturnedPaise],
    [t("mreport.otherIncome"), c.otherReceiptsPaise],
  ];
  const outLines: [string, number][] = [
    [t("mreport.upadGiven"), c.loansGivenPaise],
    [t("mreport.withdrawals"), c.withdrawalsPaidPaise],
    [t("mreport.expenses"), c.otherExpensesPaise],
  ];

  return (
    <>
      {/* this report prints on A4 landscape (wide member table); other pages keep portrait */}
      <style>{"@media print { @page { size: A4 landscape; margin: 10mm; } }"}</style>
      {/* on paper: Mandal name, code and month instead of the app header */}
      <div className="mb-4 hidden text-center print:block">
        <div className="text-lg font-bold">
          {org.name} <span className="font-normal text-muted-foreground">[{org.code}]</span>
        </div>
        <div className="text-base">{t("mreport.title", { month })}</div>
      </div>
      <div className="print:hidden">
        <PageHeader
          title={t("mreport.title", { month })}
          description={t("mreport.desc")}
          actions={
            <>
              <Link href={`${base}?month=${addMonths(m, -1)}`} aria-label={t("mreport.prev")} className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
                <ChevronLeft />
              </Link>
              <Link href={`${base}?month=${addMonths(m, 1)}`} aria-label={t("mreport.next")} className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
                <ChevronRight />
              </Link>
              <ExportCsvButton href={`/api/export${qs({ path: `/orgs/${orgId}/monthly-report`, month: m })}`}>{t("mreport.csv")}</ExportCsvButton>
              <PrintButton label={t("mreport.print")} />
            </>
          }
        />
      </div>

      {/* 1 — the month in four numbers: start + in − out = end */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4 print:grid-cols-4">
        <StatCard label={t("mreport.cashStart")} value={<Money paise={c.openingPaise} />} icon={<Wallet />} accent="indigo" />
        <StatCard
          label={t("mreport.moneyIn")}
          value={<Money paise={totalIn} />}
          tone="good"
          icon={<ArrowDownToLine />}
          hint={r.hapta.members > 0 ? t("mreport.haptaHint", { a: fmtPlain(r.hapta.collectedPaise), b: fmtPlain(r.hapta.expectedPaise) }) : undefined}
        />
        <StatCard label={t("mreport.moneyOut")} value={<Money paise={totalOut} />} icon={<ArrowUpFromLine />} accent="rose" />
        <StatCard
          label={t("mreport.cashEnd")}
          value={<Money paise={c.closingPaise} colored={c.closingPaise < 0} />}
          icon={<Landmark />}
          accent="emerald"
          hint={t("mreport.upadOutHint", { amount: fmtPlain(r.fundLoans.outstandingAtMonthEndPaise) })}
        />
      </div>

      {/* 2 — where the cash came from and went */}
      <Card className="mb-5 print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <IconChip tone="emerald" size="sm">
              <Wallet />
            </IconChip>
            {t("mreport.cashCard")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 print:grid-cols-2">
            <CashColumn title={t("mreport.moneyIn")} lines={inLines} totalLabel={t("mreport.totalIn")} total={totalIn} tone="in" />
            <CashColumn title={t("mreport.moneyOut")} lines={outLines} totalLabel={t("mreport.totalOut")} total={totalOut} tone="out" />
          </div>
          <div className="mt-4 rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
              <span>{t("mreport.cashEnd")}</span>
              <span className="tabular-nums">
                <Money paise={c.openingPaise} className="font-normal text-muted-foreground" /> <span className="text-muted-foreground">+</span> <Money paise={totalIn} className="font-normal text-success" />{" "}
                <span className="text-muted-foreground">−</span> <Money paise={totalOut} className="font-normal text-destructive" /> <span className="text-muted-foreground">=</span>{" "}
                <Money paise={c.closingPaise} className="text-base" />
              </span>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm sm:max-w-md">
            <dt className="text-muted-foreground">{t("mreport.upadOut")}</dt>
            <dd className="text-right">
              <Money paise={r.fundLoans.outstandingAtMonthEndPaise} />
            </dd>
            <dt className="font-semibold">{t("mreport.mandalFund")}</dt>
            <dd className="text-right font-semibold">
              <Money paise={r.mandalFundPaise} />
            </dd>
            <dt className="text-muted-foreground">{t("mreport.owedMembers")}</dt>
            <dd className="text-right text-muted-foreground">
              <Money paise={r.memberTotals.closingPaise} />
            </dd>
            <dt className="text-muted-foreground">{t("mreport.surplus")}</dt>
            <dd className="text-right">
              <Money paise={r.mandalSurplusPaise} colored />
            </dd>
          </dl>
        </CardContent>
      </Card>

      {/* 3 — one row per member: everything they paid or took this month */}
      <SectionTitle>{t("mreport.perMember")}</SectionTitle>
      <p className="-mt-1 mb-2 px-0.5 text-sm text-muted-foreground">
        {t("mreport.perMemberDesc")}{" "}
        {r.hapta.members > 0 && (
          <span className={cn("font-medium", pendingMembers ? "text-warning-ink" : "text-success")}>
            {pendingMembers ? t("mreport.pendingNote", { n: pendingMembers, amount: fmtPlain(a.totals.haptaPendingPaise) }) : t("mreport.allPaidNote")}
          </span>
        )}
      </p>
      {a.rows.length === 0 ? (
        <EmptyState icon={<Users />} title={t("mreport.noActivity")} />
      ) : (
        <>
          <ul className="mb-6 flex flex-col gap-2 md:hidden print:hidden" aria-label={t("mreport.perMember")}>
            {a.rows.map((x) => {
              const parts: [string, number][] = [
                [t("mreport.hapta"), x.haptaPaise],
                [t("mreport.upadInterest"), x.upadInterestPaise],
                [t("mreport.upadReturned"), x.upadReturnedPaise],
                [t("mreport.upadGiven"), x.upadGivenPaise],
                [t("mreport.withdrawals"), x.withdrawnPaise],
                [t("mreport.upadLeft"), x.upadLeftPaise],
              ];
              return (
                <li key={x.memberId} className="rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/org/${orgId}/members/${x.memberId}`} className="min-w-0 text-sm">
                      <span className="block truncate font-semibold hover:underline">{x.name}</span>
                      <span className="block text-xs text-muted-foreground">{x.membershipNumber}</span>
                    </Link>
                    <span className="text-right">
                      <span className="block text-[11px] text-muted-foreground">{t("mreport.totalPaid")}</span>
                      <Money paise={x.totalInPaise} className="font-bold" />
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 rounded-xl bg-muted/50 px-3 py-2 text-xs">
                    {parts
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd>
                            <Money paise={v} />
                          </dd>
                        </div>
                      ))}
                  </dl>
                  <Owing hapta={x.haptaPendingPaise} interest={unpaidInterest.get(x.memberId) ?? 0} t={t} fmt={fmtPlain} />
                </li>
              );
            })}
            <li className="flex items-center justify-between rounded-2xl bg-muted/50 px-3.5 py-2.5 text-sm font-bold">
              <span>{t("mreport.totalPaid")}</span>
              <Money paise={a.totals.totalInPaise} />
            </li>
          </ul>
          <div className="mb-6 hidden md:block print:block">
            <TableWrap>
              <Table className="print:text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>{t("mreport.member")}</TableHead>
                    <TableHead className="text-right">{t("mreport.hapta")}</TableHead>
                    <TableHead className="text-right">{t("mreport.upadInterest")}</TableHead>
                    <TableHead className="text-right">{t("mreport.upadReturned")}</TableHead>
                    <TableHead className="bg-muted/50 text-right">{t("mreport.totalPaid")}</TableHead>
                    <TableHead className="text-right">{t("mreport.upadGiven")}</TableHead>
                    {showWithdrawn && <TableHead className="text-right">{t("mreport.withdrawals")}</TableHead>}
                    <TableHead className="text-right">{t("mreport.upadLeft")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {a.rows.map((x, i) => (
                    <TableRow key={x.memberId} className="print:break-inside-avoid">
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <Link href={`/org/${orgId}/members/${x.memberId}`} className="font-semibold hover:underline">
                          {x.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{x.membershipNumber}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Amt paise={x.haptaPaise} />
                        {x.haptaPendingPaise > 0 && <div className="text-xs text-warning-ink">{t("mreport.haptaDue", { amount: fmtPlain(x.haptaPendingPaise) })}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Amt paise={x.upadInterestPaise} />
                        {(unpaidInterest.get(x.memberId) ?? 0) > 0 && <div className="text-xs text-warning-ink">{t("mreport.interestUnpaid", { amount: fmtPlain(unpaidInterest.get(x.memberId) ?? 0) })}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Amt paise={x.upadReturnedPaise} />
                      </TableCell>
                      <TableCell className="bg-muted/50 text-right font-semibold">
                        <Amt paise={x.totalInPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Amt paise={x.upadGivenPaise} />
                      </TableCell>
                      {showWithdrawn && (
                        <TableCell className="text-right">
                          <Amt paise={x.withdrawnPaise} />
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Amt paise={x.upadLeftPaise} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell />
                    <TableCell>{t("mreport.total")}</TableCell>
                    <TableCell className="text-right">
                      <Money paise={a.totals.haptaPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={a.totals.upadInterestPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={a.totals.upadReturnedPaise} />
                    </TableCell>
                    <TableCell className="bg-muted text-right">
                      <Money paise={a.totals.totalInPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={a.totals.upadGivenPaise} />
                    </TableCell>
                    {showWithdrawn && (
                      <TableCell className="text-right">
                        <Money paise={a.totals.withdrawnPaise} />
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Money paise={a.totals.upadLeftPaise} />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableWrap>
          </div>
        </>
      )}

      {/* 4 — savings per member (opening → closing) */}
      <SectionTitle className="print:break-before-page">{t("mreport.balances")}</SectionTitle>
      {r.members.length === 0 ? (
        <EmptyState icon={<Users />} title={t("mreport.noActivity")} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden print:hidden" aria-label={t("mreport.balances")}>
            {r.members.map((x) => (
              <li key={x.memberId} className="flex items-center justify-between gap-3 rounded-2xl bg-card px-3.5 py-3 shadow-card ring-1 ring-foreground/[0.06]">
                <Link href={`/org/${orgId}/members/${x.memberId}`} className="min-w-0 text-sm">
                  <span className="block truncate font-semibold hover:underline">{x.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    <Money paise={x.openingPaise} /> → <Money paise={x.closingPaise} />
                  </span>
                </Link>
                <Money paise={x.closingPaise} colored={x.closingPaise < 0} className="font-bold" />
              </li>
            ))}
            <li className="flex items-center justify-between rounded-2xl bg-muted/50 px-3.5 py-2.5 text-sm font-bold">
              <span>{t("mreport.total")}</span>
              <Money paise={r.memberTotals.closingPaise} />
            </li>
          </ul>
          <div className="hidden md:block print:block">
            <TableWrap>
              <Table className="print:text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>{t("mreport.member")}</TableHead>
                    <TableHead className="text-right">{t("mreport.opening")}</TableHead>
                    <TableHead className="text-right">{t("mreport.hapta")}</TableHead>
                    <TableHead className="text-right">{t("mreport.interest")}</TableHead>
                    <TableHead className="text-right">{t("mreport.withdrawals")}</TableHead>
                    <TableHead className="text-right">{t("mreport.other")}</TableHead>
                    <TableHead className="text-right">{t("mreport.closing")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.members.map((x, i) => (
                    <TableRow key={x.memberId} className="print:break-inside-avoid">
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <Link href={`/org/${orgId}/members/${x.memberId}`} className="font-semibold hover:underline">
                          {x.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={x.openingPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Amt paise={x.haptaPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Amt paise={x.interestPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Amt paise={x.withdrawalsPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Amt paise={x.otherPaise} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <Money paise={x.closingPaise} colored={x.closingPaise < 0} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell />
                    <TableCell>{t("mreport.total")}</TableCell>
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

function CashColumn({ title, lines, totalLabel, total, tone }: { title: string; lines: [string, number][]; totalLabel: string; total: number; tone: "in" | "out" }) {
  return (
    <div>
      <div className={cn("mb-1.5 text-xs font-semibold tracking-wide uppercase", tone === "in" ? "text-success" : "text-destructive")}>{title}</div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
        {lines.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className={cn(!v && "text-muted-foreground")}>{k}</dt>
            <dd className="text-right">
              <Amt paise={v} />
            </dd>
          </div>
        ))}
        <dt className="border-t pt-1.5 font-bold">{totalLabel}</dt>
        <dd className="border-t pt-1.5 text-right font-bold">
          <Money paise={total} />
        </dd>
      </dl>
    </div>
  );
}

function Owing({ hapta, interest, t, fmt: fmtPlain }: { hapta: number; interest: number; t: Awaited<ReturnType<typeof getT>>["t"]; fmt: (p: number) => string }) {
  if (!hapta && !interest) return null;
  return (
    <p className="mt-1.5 text-xs text-warning-ink">
      {[hapta ? t("mreport.haptaDue", { amount: fmtPlain(hapta) }) : null, interest ? t("mreport.interestUnpaid", { amount: fmtPlain(interest) }) : null].filter(Boolean).join(" · ")}
    </p>
  );
}
