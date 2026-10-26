import type { ReactNode } from "react";
import Link from "next/link";
import type { Loan } from "@/lib/types";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { TableWrap } from "@/components/app/table-wrap";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { METHOD_LABEL, formatDate, formatDateTime, label } from "@/lib/format";
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

export async function LoanDetail({ data, orgId, receiptBase, repaymentAction }: { data: LoanDetailData; orgId: string; receiptBase: string; repaymentAction?: (rep: any, isLatest: boolean) => ReactNode }) {
  const money = await getMoney(orgId);
  const l = data.loan;
  const s = l.summary;
  const verified = data.repayments.filter((r) => r.status === "verified");
  const latestId = verified.length ? verified[verified.length - 1]._id : null;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Principal" value={money.fmt(l.principalPaise ?? l.approvedPaise ?? l.requestedPaise)} hint={l.principalPaise ? `disbursed ${formatDate(l.disbursedOn)}` : l.approvedPaise ? "approved" : "requested"} />
        <StatCard label="Outstanding principal" value={money.fmt(l.outstandingPrincipalPaise)} tone={l.outstandingPrincipalPaise > 0 ? "warn" : "good"} />
        <StatCard label="Interest paid / due" value={money.fmt(l.totalInterestPaidPaise)} hint={s ? `${money.fmt(s.interestOutstandingPaise)} due & unpaid` : undefined} />
        <StatCard label="Overdue" value={money.fmt(s?.overdueAmountPaise ?? 0)} tone={(s?.overdueAmountPaise ?? 0) > 0 ? "bad" : "good"} hint={s?.nextDue ? `next ${money.fmt(s.nextDue.amountPaise)} on ${formatDate(s.nextDue.dueDate)}` : undefined} />
      </div>
      <Card size="sm" className="mt-4">
        <CardHeader>
          <CardTitle>Terms</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <span>
            Member:{" "}
            {data.member ? (
              <Link className="font-medium hover:underline" href={`/org/${orgId}/members/${data.member._id}`}>
                {data.member.name} ({data.member.membershipNumber})
              </Link>
            ) : (
              "—"
            )}
          </span>
          <span>Method: {METHOD_NAME[l.interestMethod]}</span>
          <span>
            Rate: {l.annualRate}% p.a. {l.rateInput.period === "monthly" && `(${l.rateInput.value}% p.m.)`}
          </span>
          <span>
            {l.tenure} × {l.repaymentFrequency} installments
          </span>
          <span>Day count: {l.dayCount.replace("_", "/")}</span>
          <span>Allocation: {l.allocationOrder.join(" → ")}</span>
          {l.purpose && <span>Purpose: {l.purpose}</span>}
          {l.rejectionReason && <span className="text-destructive">Rejected: {l.rejectionReason}</span>}
          <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">{METHOD_INFO[l.interestMethod]}</p>
        </CardContent>
      </Card>
      <Tabs defaultValue="schedule" className="mt-4">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="repayments">Repayments ({data.repayments.length})</TabsTrigger>
          <TabsTrigger value="calc">Interest calculations</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          {l.schedule.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">The schedule is generated when the loan is disbursed.</p>
          ) : (
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
                      <TableCell>{r.sequence}</TableCell>
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
                        <Money paise={r.outstandingPaise ?? 0} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          )}
        </TabsContent>
        <TabsContent value="repayments">
          {data.repayments.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No repayments yet.</p>
          ) : (
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
                    <TableRow key={r._id}>
                      <TableCell>
                        {formatDate(r.date)}
                        <div className="text-xs text-muted-foreground">{label(METHOD_LABEL, r.method)}</div>
                      </TableCell>
                      <TableCell className="capitalize">{r.kind}</TableCell>
                      <TableCell className="text-right">
                        <Money paise={r.amountPaise} />
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
                        <div className="flex justify-end gap-1">
                          {r.receiptId && (
                            <Link href={`${receiptBase}/${r.receiptId}`} className="px-2 text-xs font-medium text-primary hover:underline">
                              Receipt
                            </Link>
                          )}
                          {repaymentAction?.(r, r._id === latestId)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          )}
        </TabsContent>
        <TabsContent value="calc">
          {data.interestCalculations.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No calculations recorded yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.interestCalculations.map((c) => (
                <li key={c._id} className="rounded-lg p-3 ring-1 ring-foreground/10">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium capitalize">{c.purpose.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {METHOD_NAME[c.method]} · principal {money.fmt(c.principalPaise)} · {c.annualRate}% p.a. · {formatDate(c.periodStart)} → {formatDate(c.periodEnd)}
                    {c.days !== undefined && c.days !== null ? ` · ${c.days} days` : ""}
                    {c.periods ? ` · ${c.periods} periods` : ""} · interest <span className="font-medium text-foreground">{money.fmt(c.interestPaise)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
