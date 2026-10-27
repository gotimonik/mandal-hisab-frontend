import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarRange, Calculator, Landmark, Percent, Receipt, User } from "lucide-react";
import type { Loan } from "@/lib/types";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { TableWrap } from "@/components/app/table-wrap";
import { SummaryBand } from "@/components/app/summary-band";
import { EmptyState } from "@/components/app/empty-state";
import { IconChip } from "@/components/app/bits";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { METHOD_LABEL, formatDate, formatDateTime, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { METHOD_INFO } from "./constants";
import { getMoney } from "@/lib/server/data";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LoanDetailData {
  loan: Loan;
  member: { _id: string; name: string; membershipNumber: string; phone?: string } | null;
  repayments: any[];
  interestCalculations: any[];
}

const METHOD_NAME: Record<string, string> = { reducing_balance: "Reducing balance (EMI)", flat: "Flat rate", simple: "Simple interest", compound: "Compound (bullet)" };

const CARD = "rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]";

export async function LoanDetail({ data, orgId, receiptBase, repaymentAction }: { data: LoanDetailData; orgId: string; receiptBase: string; repaymentAction?: (rep: any, isLatest: boolean) => ReactNode }) {
  const money = await getMoney(orgId);
  const l = data.loan;
  const s = l.summary;
  const verified = data.repayments.filter((r) => r.status === "verified");
  const latestId = verified.length ? verified[verified.length - 1]._id : null;
  const principal = l.principalPaise ?? l.approvedPaise ?? l.requestedPaise;
  const overdue = s?.overdueAmountPaise ?? 0;
  const receiptLink = (r: any) =>
    r.receiptId ? (
      <Link href={`${receiptBase}/${r.receiptId}`} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
        <Receipt className="size-3.5" /> Receipt
      </Link>
    ) : null;
  return (
    <>
      <SummaryBand
        icon={<Landmark />}
        label="Outstanding principal"
        value={<Money paise={l.outstandingPrincipalPaise} />}
        sub={`${money.fmt(principal)} ${l.principalPaise ? `disbursed ${formatDate(l.disbursedOn)}` : l.approvedPaise ? "approved" : "requested"}${s?.nextDue ? ` · next ${money.fmt(s.nextDue.amountPaise)} on ${formatDate(s.nextDue.dueDate)}` : ""}`}
        stats={[
          { label: "Interest paid", value: <Money paise={l.totalInterestPaidPaise} short /> },
          { label: "Interest due & unpaid", value: <Money paise={s?.interestOutstandingPaise ?? 0} short /> },
          { label: "Overdue", value: <Money paise={overdue} short /> },
        ]}
      />
      {overdue > 0 && (
        <p className="mb-4 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-500/25 dark:text-rose-300">
          {money.fmt(overdue)} is overdue on this loan.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Info
          icon={<User />}
          tone="sky"
          k="Member"
          v={
            data.member ? (
              <Link className="hover:underline" href={`/org/${orgId}/members/${data.member._id}`}>
                {data.member.name}
              </Link>
            ) : (
              "—"
            )
          }
          sub={data.member?.membershipNumber}
        />
        <Info icon={<Calculator />} tone="violet" k="Method" v={METHOD_NAME[l.interestMethod]} sub={`Day count ${l.dayCount.replace("_", "/")}`} />
        <Info icon={<Percent />} tone="amber" k="Rate" v={`${l.annualRate}% p.a.`} sub={l.rateInput.period === "monthly" ? `${l.rateInput.value}% p.m.` : undefined} />
        <Info icon={<CalendarRange />} tone="indigo" k="Installments" v={`${l.tenure} × ${l.repaymentFrequency}`} sub={`Allocation: ${l.allocationOrder.join(" → ")}`} />
      </div>
      <div className={cn(CARD, "mt-3 text-sm")}>
        {l.purpose && (
          <p>
            <span className="text-muted-foreground">Purpose:</span> {l.purpose}
          </p>
        )}
        {l.rejectionReason && <p className="font-medium text-destructive">Rejected: {l.rejectionReason}</p>}
        <p className={cn("text-xs text-muted-foreground", (l.purpose || l.rejectionReason) && "mt-1")}>{METHOD_INFO[l.interestMethod]}</p>
      </div>

      <Tabs defaultValue="schedule" className="mt-6">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="repayments">Repayments ({data.repayments.length})</TabsTrigger>
          <TabsTrigger value="calc">Interest calculations</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          {l.schedule.length === 0 ? (
            <EmptyState icon={<CalendarRange />} title="No schedule yet" description="The schedule is generated when the loan is disbursed." />
          ) : (
            <>
              <ul className="flex flex-col gap-2 md:hidden" aria-label="Schedule">
                {l.schedule.map((r) => {
                  const paid = r.principalPaidPaise + r.interestPaidPaise + r.penaltyPaidPaise;
                  return (
                    <li key={r.sequence} className={cn(CARD, r.status === "overdue" && "ring-2 ring-rose-400/40")}>
                      <div className="flex items-start gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/12 text-sm font-bold text-indigo-600 tabular-nums dark:bg-indigo-400/15 dark:text-indigo-300">{r.sequence}</span>
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="font-semibold">Due {formatDate(r.dueDate)}</p>
                          <p className="text-xs text-muted-foreground">
                            Principal <Money paise={r.principalDuePaise} /> · interest <Money paise={r.interestDuePaise} /> @ {r.rateApplied}%
                            {r.penaltyPaise ? (
                              <>
                                {" "}
                                · late fee <Money paise={r.penaltyPaise} />
                              </>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Paid <Money paise={paid} /> · opening <Money paise={r.openingPrincipalPaise} />
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Money paise={r.outstandingPaise ?? 0} className="font-bold" />
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden md:block">
                <TableWrap>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="text-right">Opening principal</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Late fee</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance due</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {l.schedule.map((r) => (
                        <TableRow key={r.sequence}>
                          <TableCell className="font-semibold tabular-nums">{r.sequence}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(r.dueDate)}</TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.openingPrincipalPaise} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.principalDuePaise} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.interestDuePaise} />
                            <div className="text-[10px] text-muted-foreground">@ {r.rateApplied}%</div>
                          </TableCell>
                          <TableCell className="text-right">{r.penaltyPaise ? <Money paise={r.penaltyPaise} /> : "—"}</TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.principalPaidPaise + r.interestPaidPaise + r.penaltyPaidPaise} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.outstandingPaise ?? 0} className="font-semibold" />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrap>
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="repayments">
          {data.repayments.length === 0 ? (
            <EmptyState icon={<Receipt />} title="No repayments yet" />
          ) : (
            <>
              <ul className="flex flex-col gap-2 md:hidden" aria-label="Repayments">
                {data.repayments.map((r) => (
                  <li key={r._id} className={cn(CARD, r.status === "reversed" && "opacity-70")}>
                    <div className="flex items-start gap-3">
                      <IconChip tone="emerald" size="sm">
                        <Receipt />
                      </IconChip>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-semibold">
                          {formatDate(r.date)} <span className="font-normal text-muted-foreground capitalize">· {r.kind}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{label(METHOD_LABEL, r.method)}</p>
                        <p className="text-xs text-muted-foreground">
                          Principal <Money paise={r.principalPaise} /> · interest <Money paise={r.interestPaise} />
                          {r.penaltyPaise ? (
                            <>
                              {" "}
                              · late fee <Money paise={r.penaltyPaise} />
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Money paise={r.amountPaise} className="font-bold" />
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-1 empty:hidden">
                      {receiptLink(r)}
                      {repaymentAction?.(r, r._id === latestId)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block">
                <TableWrap>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Kind</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Late fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.repayments.map((r) => (
                        <TableRow key={r._id} className={cn(r.status === "reversed" && "text-muted-foreground")}>
                          <TableCell>
                            {formatDate(r.date)}
                            <div className="text-xs text-muted-foreground">{label(METHOD_LABEL, r.method)}</div>
                          </TableCell>
                          <TableCell className="capitalize">{r.kind}</TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.amountPaise} className="font-semibold" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.principalPaise} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.interestPaise} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money paise={r.penaltyPaise} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {receiptLink(r)}
                              {repaymentAction?.(r, r._id === latestId)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrap>
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="calc">
          {data.interestCalculations.length === 0 ? (
            <EmptyState icon={<Calculator />} title="No calculations recorded yet" />
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.interestCalculations.map((c) => (
                <li key={c._id} className={cn(CARD, "flex items-start gap-3")}>
                  <IconChip tone="violet" size="sm">
                    <Calculator />
                  </IconChip>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold capitalize">{c.purpose.replace(/_/g, " ")}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {METHOD_NAME[c.method]} · principal {money.fmt(c.principalPaise)} · {c.annualRate}% p.a. · {formatDate(c.periodStart)} → {formatDate(c.periodEnd)}
                      {c.days !== undefined && c.days !== null ? ` · ${c.days} days` : ""}
                      {c.periods ? ` · ${c.periods} periods` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold tabular-nums">{money.fmt(c.interestPaise)}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function Info({ k, v, sub, icon, tone }: { k: string; v: ReactNode; sub?: string; icon: ReactNode; tone: Tone }) {
  return (
    <div className={cn(CARD, "flex items-start gap-3")}>
      <IconChip tone={tone} size="sm">
        {icon}
      </IconChip>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{k}</p>
        <p className="truncate font-semibold">{v}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
