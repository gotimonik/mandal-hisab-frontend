import Link from "next/link";
import type { ReactNode } from "react";
import { Money } from "@/components/app/money";
import { TableWrap } from "@/components/app/table-wrap";
import { StatusBadge } from "@/components/app/status-badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { T } from "@/i18n/core";
import { frequencyLabel, methodLabel } from "@/i18n/labels";

const R = ({ children }: { children: ReactNode }) => <TableCell className="text-right">{children}</TableCell>;
const H = ({ children }: { children: ReactNode }) => <TableHead className="text-right">{children}</TableHead>;

function SimpleTable({ headers, rows, footer, empty }: { headers: ReactNode[]; rows: ReactNode[][]; footer?: ReactNode[]; empty: string }) {
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
                {empty}
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

export function renderReport(kind: string, d: any, orgId: string, t: T): ReactNode {
  const Simple = (p: { headers: ReactNode[]; rows: ReactNode[][]; footer?: ReactNode[] }) => <SimpleTable {...p} empty={t("rep.noData")} />;
  const h = (s: string) => `>${s}`;
  const total = t("rep.h.total");
  switch (kind) {
    case "collections":
      return (
        <Simple
          headers={[t("rep.h.period"), ...d.categories.map((c: any) => `>${c.name}`), h(total)]}
          rows={d.rows.map((r: any) => [r.period, ...d.categories.map((c: any) => M(r.byCategory[c.key] ?? 0)), <strong key="t">{M(r.totalPaise)}</strong>])}
          footer={[total, ...d.categories.map((c: any) => M(d.rows.reduce((s: number, r: any) => s + (r.byCategory[c.key] ?? 0), 0))), M(d.totalPaise)]}
        />
      );
    case "hapta":
      return (
        <Simple
          headers={[t("rep.scheme"), t("rep.h.frequency"), h(t("rep.h.members")), h(t("rep.h.due")), h(t("rep.h.collected")), h(t("rep.h.outstanding")), h(t("rep.h.overdue")), h(t("rep.h.pct"))]}
          rows={d.rows.map((r: any) => [r.schemeName, frequencyLabel(t, r.frequency), r.members, M(r.duePaise), M(r.collectedPaise), M(r.outstandingPaise), M(r.overduePaise), `${r.collectionPercent}%`])}
          footer={[total, "", "", M(d.totals.duePaise), M(d.totals.collectedPaise), M(d.totals.outstandingPaise), M(d.totals.overduePaise), ""]}
        />
      );
    case "overdue":
      return (
        <Simple
          headers={[t("rep.h.member"), t("rep.h.phone"), t("rep.h.schemePeriod"), t("rep.h.dueDate"), h(t("rep.h.daysLate")), h(t("rep.h.outstanding"))]}
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
          footer={[total, "", "", "", "", M(d.totalOutstandingPaise)]}
        />
      );
    case "donations":
      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("rep.byEvent")}</CardTitle>
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
                <CardTitle>{t("rep.byMethod")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {d.byMethod.map((e: any) => (
                  <div key={e.method} className="flex justify-between py-0.5">
                    <span>
                      {methodLabel(t, e.method)} <span className="text-muted-foreground">({e.count})</span>
                    </span>
                    {M(e.totalPaise)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Simple
            headers={[t("rep.h.date"), t("rep.h.donor"), t("rep.h.eventPurpose"), t("rep.method"), h(t("rep.h.amount"))]}
            rows={d.items.map((x: any) => [formatDate(x.date), x.donorName, [x.eventName, x.purpose].filter(Boolean).join(" · ") || "—", methodLabel(t, x.method), M(x.amountPaise)])}
            footer={[total, "", "", "", M(d.totalPaise)]}
          />
        </div>
      );
    case "events":
      return <Simple headers={[t("rep.h.event"), h(t("rep.h.income")), h(t("rep.h.expenses")), h(t("rep.h.net"))]} rows={d.rows.map((r: any) => [r.eventName, M(r.incomePaise), M(r.expensePaise), <Money key="n" paise={r.netPaise} colored />])} />;
    case "loans":
      return (
        <Simple
          headers={[t("rep.h.loan"), t("rep.h.member"), t("rep.h.terms"), h(t("rep.h.principal")), h(t("rep.h.outPrincipal")), h(t("rep.h.interestDue")), h(t("rep.h.overdue")), t("rep.h.nextDue")]}
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
          footer={[total, "", "", M(d.totals.principalPaise), M(d.totals.outstandingPrincipalPaise), M(d.totals.interestOutstandingPaise), M(d.totals.overdueAmountPaise), ""]}
        />
      );
    case "interest":
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {t("rep.interestReceived")} <Money paise={d.interestReceivedPaise} className="font-semibold" />
          </p>
          <Simple
            headers={[t("rep.h.loan"), t("rep.h.member"), t("rep.h.methodRates"), h(t("rep.h.charged")), h(t("rep.h.paid")), h(t("rep.h.outstanding")), h(t("rep.h.scheduled"))]}
            rows={d.rows.map((r: any) => [r.loanNumber, r.memberName, `${r.method.replace("_", " ")} · ${r.rates.map((x: any) => t("rep.rateFrom", { rate: x.annualRate, date: formatDate(x.effectiveFrom) })).join(", ")}`, M(r.interestChargedPaise), M(r.interestPaidPaise), M(r.interestOutstandingPaise), M(r.scheduledNotYetDuePaise)])}
          />
        </div>
      );
    case "income-expense":
      return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Simple headers={[t("rep.h.income"), h(t("rep.h.amount"))]} rows={d.income.map((x: any) => [x.name, M(x.amountPaise)])} footer={[t("rep.totalIncome"), M(d.totalIncomePaise)]} />
          <Simple headers={[t("rep.h.expenditure"), h(t("rep.h.amount"))]} rows={d.expense.map((x: any) => [x.name, M(x.amountPaise)])} footer={[t("rep.totalExpenditure"), M(d.totalExpensePaise)]} />
          <Card size="sm" className="lg:col-span-2">
            <CardContent className="flex items-center justify-between text-base font-semibold">
              <span>{d.surplusPaise >= 0 ? t("rep.surplus") : t("rep.deficit")}</span>
              <Money paise={d.surplusPaise} colored />
            </CardContent>
          </Card>
        </div>
      );
    case "cash-flow":
      return (
        <Simple
          headers={[t("rep.h.activity"), t("rep.h.section"), h(t("rep.h.inflow")), h(t("rep.h.outflow")), h(t("rep.h.net"))]}
          rows={[[t("rep.opening"), "", "", "", M(d.openingCashPaise)], ...d.lines.map((l: any) => [l.name, l.section, M(l.inflowPaise), M(l.outflowPaise), <Money key="n" paise={l.netPaise} colored />])]}
          footer={[t("rep.closing"), "", "", "", M(d.closingCashPaise)]}
        />
      );
    case "account-summary":
      return (
        <Simple
          headers={[t("rep.h.account"), t("rep.h.type"), h(t("rep.h.opening")), h(t("rep.h.receipts")), h(t("rep.h.payments")), h(t("rep.h.closing"))]}
          rows={d.rows.map((r: any) => [r.name, r.type, M(r.openingPaise), M(r.receiptsPaise), M(r.paymentsPaise), M(r.closingPaise)])}
          footer={[total, "", M(d.totals.openingPaise), M(d.totals.receiptsPaise), M(d.totals.paymentsPaise), M(d.totals.closingPaise)]}
        />
      );
    case "trial-balance":
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{d.balanced ? <StatusBadge status="balanced" className="bg-success/15 text-success" /> : <StatusBadge status="unbalanced" className="bg-destructive/12 text-destructive" />}</p>
          <Simple headers={[t("rep.h.account"), t("rep.h.class"), h(t("rep.h.debit")), h(t("rep.h.credit"))]} rows={d.lines.map((l: any) => [l.name, l.class, l.debitPaise ? M(l.debitPaise) : "", l.creditPaise ? M(l.creditPaise) : ""])} footer={[total, "", M(d.totalDebitPaise), M(d.totalCreditPaise)]} />
        </div>
      );
    case "balance-sheet":
      return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Simple headers={[t("rep.h.assets"), h(t("rep.h.amount"))]} rows={d.assets.map((x: any) => [x.name, M(x.amountPaise)])} footer={[t("rep.totalAssets"), M(d.totalAssetsPaise)]} />
          <Simple
            headers={[t("rep.h.liabilities"), h(t("rep.h.amount"))]}
            rows={[...d.liabilities.map((x: any) => [x.name, M(x.amountPaise)]), ...d.equity.map((x: any) => [x.name, M(x.amountPaise)])]}
            footer={[total, M(d.totalLiabilitiesPaise + d.totalEquityPaise)]}
          />
        </div>
      );
    default:
      return null;
  }
}
