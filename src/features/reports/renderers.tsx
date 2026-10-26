import Link from "next/link";
import type { ReactNode } from "react";
import { Money } from "@/components/app/money";
import { TableWrap } from "@/components/app/table-wrap";
import { StatusBadge } from "@/components/app/status-badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FREQUENCY_LABEL, METHOD_LABEL, formatDate, label } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

const R = ({ children }: { children: ReactNode }) => <TableCell className="text-right">{children}</TableCell>;
const H = ({ children }: { children: ReactNode }) => <TableHead className="text-right">{children}</TableHead>;

function Simple({ headers, rows, footer }: { headers: ReactNode[]; rows: ReactNode[][]; footer?: ReactNode[] }) {
  return (
    <TableWrap>
      <Table>
        <TableHeader>
          <TableRow>{headers.map((h, i) => (typeof h === "string" && h.startsWith(">") ? <H key={i}>{h.slice(1)}</H> : <TableHead key={i}>{h}</TableHead>))}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={headers.length} className="py-8 text-center text-muted-foreground">
                No data for this period.
              </TableCell>
            </TableRow>
          )}
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => (typeof headers[j] === "string" && (headers[j] as string).startsWith(">") ? <R key={j}>{c}</R> : <TableCell key={j}>{c}</TableCell>))}
            </TableRow>
          ))}
        </TableBody>
        {footer && (
          <TableFooter>
            <TableRow>{footer.map((c, j) => (typeof headers[j] === "string" && (headers[j] as string).startsWith(">") ? <R key={j}>{c}</R> : <TableCell key={j} className="font-medium">{c}</TableCell>))}</TableRow>
          </TableFooter>
        )}
      </Table>
    </TableWrap>
  );
}

const M = (p: number) => <Money paise={p} />;

export function renderReport(kind: string, d: any, orgId: string): ReactNode {
  switch (kind) {
    case "collections":
      return (
        <Simple
          headers={["Period", ...d.categories.map((c: any) => `>${c.name}`), ">Total"]}
          rows={d.rows.map((r: any) => [r.period, ...d.categories.map((c: any) => M(r.byCategory[c.key] ?? 0)), <strong key="t">{M(r.totalPaise)}</strong>])}
          footer={["Total", ...d.categories.map((c: any) => M(d.rows.reduce((s: number, r: any) => s + (r.byCategory[c.key] ?? 0), 0))), M(d.totalPaise)]}
        />
      );
    case "hapta":
      return (
        <Simple
          headers={["Scheme", "Frequency", ">Members", ">Due", ">Collected", ">Outstanding", ">Overdue", ">Collection %"]}
          rows={d.rows.map((r: any) => [r.schemeName, label(FREQUENCY_LABEL, r.frequency), r.members, M(r.duePaise), M(r.collectedPaise), M(r.outstandingPaise), M(r.overduePaise), `${r.collectionPercent}%`])}
          footer={["Total", "", "", M(d.totals.duePaise), M(d.totals.collectedPaise), M(d.totals.outstandingPaise), M(d.totals.overduePaise), ""]}
        />
      );
    case "overdue":
      return (
        <Simple
          headers={["Member", "Phone", "Scheme / period", "Due date", ">Days late", ">Outstanding"]}
          rows={d.rows.map((r: any) => [
            <Link key="m" href={`/org/${orgId}/members/${r.memberId}`} className="font-medium hover:underline">
              {r.memberName} <span className="text-xs text-muted-foreground">{r.membershipNumber}</span>
            </Link>,
            r.phone ?? "—",
            `${r.schemeName} · ${r.periodLabel}`,
            formatDate(r.dueDate),
            r.daysOverdue,
            M(r.outstandingPaise),
          ])}
          footer={["Total", "", "", "", "", M(d.totalOutstandingPaise)]}
        />
      );
    case "donations":
      return (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>By event</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {d.byEvent.map((e: any) => (
                  <div key={e.eventName} className="flex justify-between py-0.5">
                    <span>
                      {e.eventName} <span className="text-muted-foreground">({e.count})</span>
                    </span>
                    {M(e.totalPaise)}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>By method</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {d.byMethod.map((e: any) => (
                  <div key={e.method} className="flex justify-between py-0.5">
                    <span>
                      {label(METHOD_LABEL, e.method)} <span className="text-muted-foreground">({e.count})</span>
                    </span>
                    {M(e.totalPaise)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Simple
            headers={["Date", "Donor", "PAN", "Event / purpose", "Method", ">Amount"]}
            rows={d.items.map((x: any) => [formatDate(x.date), x.donorName, x.donorPan ?? "—", [x.eventName, x.purpose].filter(Boolean).join(" · ") || "—", label(METHOD_LABEL, x.method), M(x.amountPaise)])}
            footer={["Total", "", "", "", "", M(d.totalPaise)]}
          />
        </div>
      );
    case "events":
      return <Simple headers={["Event", ">Income", ">Expenses", ">Net"]} rows={d.rows.map((r: any) => [r.eventName, M(r.incomePaise), M(r.expensePaise), <Money key="n" paise={r.netPaise} colored />])} />;
    case "loans":
      return (
        <Simple
          headers={["Loan", "Member", "Terms", ">Principal", ">Outstanding principal", ">Interest due", ">Overdue", "Next due"]}
          rows={d.rows.map((r: any) => [
            <Link key="l" href={`/org/${orgId}/loans/${r.loanId}`} className="font-mono text-xs hover:underline">
              {r.loanNumber}
            </Link>,
            r.memberName,
            `${r.annualRate}% ${r.method.replace("_", " ")}`,
            M(r.principalPaise ?? 0),
            M(r.outstandingPrincipalPaise),
            M(r.interestOutstandingPaise),
            M(r.overdueAmountPaise),
            r.nextDue ? formatDate(r.nextDue.dueDate) : "—",
          ])}
          footer={["Total", "", "", M(d.totals.principalPaise), M(d.totals.outstandingPrincipalPaise), M(d.totals.interestOutstandingPaise), M(d.totals.overdueAmountPaise), ""]}
        />
      );
    case "interest":
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Interest received in the period (ledger): <Money paise={d.interestReceivedPaise} className="font-semibold" />
          </p>
          <Simple
            headers={["Loan", "Member", "Method / rates", ">Charged", ">Paid", ">Outstanding", ">Scheduled (not due)"]}
            rows={d.rows.map((r: any) => [r.loanNumber, r.memberName, `${r.method.replace("_", " ")} · ${r.rates.map((x: any) => `${x.annualRate}% from ${formatDate(x.effectiveFrom)}`).join(", ")}`, M(r.interestChargedPaise), M(r.interestPaidPaise), M(r.interestOutstandingPaise), M(r.scheduledNotYetDuePaise)])}
          />
        </div>
      );
    case "income-expense":
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Simple headers={["Income", ">Amount"]} rows={d.income.map((x: any) => [x.name, M(x.amountPaise)])} footer={["Total income", M(d.totalIncomePaise)]} />
          <Simple headers={["Expenditure", ">Amount"]} rows={d.expense.map((x: any) => [x.name, M(x.amountPaise)])} footer={["Total expenditure", M(d.totalExpensePaise)]} />
          <Card size="sm" className="lg:col-span-2">
            <CardContent className="flex items-center justify-between text-base font-semibold">
              <span>{d.surplusPaise >= 0 ? "Surplus" : "Deficit"}</span>
              <Money paise={d.surplusPaise} colored />
            </CardContent>
          </Card>
        </div>
      );
    case "cash-flow":
      return (
        <Simple
          headers={["Activity", "Section", ">Inflow", ">Outflow", ">Net"]}
          rows={[["Opening cash & bank", "", "", "", M(d.openingCashPaise)], ...d.lines.map((l: any) => [l.name, l.section, M(l.inflowPaise), M(l.outflowPaise), <Money key="n" paise={l.netPaise} colored />])]}
          footer={["Closing cash & bank", "", "", "", M(d.closingCashPaise)]}
        />
      );
    case "account-summary":
      return (
        <Simple
          headers={["Account", "Type", ">Opening", ">Receipts", ">Payments", ">Closing"]}
          rows={d.rows.map((r: any) => [r.name, r.type, M(r.openingPaise), M(r.receiptsPaise), M(r.paymentsPaise), M(r.closingPaise)])}
          footer={["Total", "", M(d.totals.openingPaise), M(d.totals.receiptsPaise), M(d.totals.paymentsPaise), M(d.totals.closingPaise)]}
        />
      );
    case "trial-balance":
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{d.balanced ? <StatusBadge status="balanced" className="bg-success/15 text-success" /> : <StatusBadge status="unbalanced" className="bg-destructive/12 text-destructive" />}</p>
          <Simple headers={["Account", "Class", ">Debit", ">Credit"]} rows={d.lines.map((l: any) => [l.name, l.class, l.debitPaise ? M(l.debitPaise) : "", l.creditPaise ? M(l.creditPaise) : ""])} footer={["Total", "", M(d.totalDebitPaise), M(d.totalCreditPaise)]} />
        </div>
      );
    case "balance-sheet":
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Simple headers={["Assets", ">Amount"]} rows={d.assets.map((x: any) => [x.name, M(x.amountPaise)])} footer={["Total assets", M(d.totalAssetsPaise)]} />
          <Simple
            headers={["Liabilities & funds", ">Amount"]}
            rows={[...d.liabilities.map((x: any) => [x.name, M(x.amountPaise)]), ...d.equity.map((x: any) => [x.name, M(x.amountPaise)])]}
            footer={["Total", M(d.totalLiabilitiesPaise + d.totalEquityPaise)]}
          />
        </div>
      );
    default:
      return null;
  }
}
