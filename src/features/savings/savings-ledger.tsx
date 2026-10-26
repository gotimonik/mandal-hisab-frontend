import { Money } from "@/components/app/money";
import { StatCard } from "@/components/app/stat-card";
import { TableWrap } from "@/components/app/table-wrap";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { MemberLedger } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  opening: "Opening balance",
  hapta: "Hapta",
  interest: "Interest",
  withdrawal: "Withdrawal",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

/** Balance cards: opening + hapta + interest + adjustments − withdrawals = balance. */
export function SavingsSummary({ l }: { l: MemberLedger }) {
  const t = l.totals;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Savings balance" value={<Money paise={l.currentBalancePaise} colored={l.currentBalancePaise < 0} />} tone="good" hint={t.openingCreditsPaise ? <>incl. opening <Money paise={t.openingCreditsPaise} /></> : undefined} />
      <StatCard label="Hapta paid" value={<Money paise={t.haptaPaise} />} />
      <StatCard label="Interest earned" value={<Money paise={t.interestPaise} />} />
      <StatCard label="Withdrawn" value={<Money paise={t.withdrawalsPaise} />} hint={t.adjustmentsPaise ? <>Adjustments <Money paise={t.adjustmentsPaise} /></> : undefined} />
    </div>
  );
}

/** Passbook-style savings ledger with a running balance. */
export function SavingsLedgerTable({ l, csvHref }: { l: MemberLedger; csvHref?: string }) {
  if (l.lines.length === 0 && l.openingBalancePaise === 0) {
    return <EmptyState title="No savings entries yet" description="Hapta payments, interest and withdrawals will appear here." />;
  }
  return (
    <div className="flex flex-col gap-2">
      {csvHref && (
        <div className="flex justify-end">
          <a href={csvHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Download CSV
          </a>
        </div>
      )}
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Particulars</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {l.from && (
              <TableRow className="bg-muted/40">
                <TableCell className="whitespace-nowrap">{formatDate(l.from)}</TableCell>
                <TableCell className="font-medium">Brought forward</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right font-medium">
                  <Money paise={l.openingBalancePaise} />
                </TableCell>
              </TableRow>
            )}
            {l.lines.map((e) => (
              <TableRow key={e._id}>
                <TableCell className="whitespace-nowrap">{formatDate(e.date)}</TableCell>
                <TableCell>
                  <span className="font-medium">{KIND_LABEL[e.kind] ?? e.kind}</span>
                  {e.period ? <span className="text-muted-foreground"> · {e.period}</span> : null}
                  <div className="text-xs text-muted-foreground">
                    {e.description}
                    {e.recordedByName ? ` · by ${e.recordedByName}` : ""}
                  </div>
                </TableCell>
                <TableCell className="text-right">{e.creditPaise ? <Money paise={e.creditPaise} className="text-success" /> : ""}</TableCell>
                <TableCell className="text-right">{e.debitPaise ? <Money paise={e.debitPaise} className="text-destructive" /> : ""}</TableCell>
                <TableCell className="text-right">{e.balancePaise !== undefined ? <Money paise={e.balancePaise} /> : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}
