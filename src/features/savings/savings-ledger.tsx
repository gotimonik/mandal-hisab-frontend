import { Money } from "@/components/app/money";
import { StatCard } from "@/components/app/stat-card";
import { TableWrap } from "@/components/app/table-wrap";
import { EmptyState } from "@/components/app/empty-state";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { MemberLedger } from "@/lib/types";
import { getT } from "@/i18n/server";
import type { Key } from "@/i18n/core";
import { moneyFmt } from "@/lib/currency";
import { ExportCsvButton } from "@/components/app/export-csv-button";

const KIND_LABEL: Record<string, string> = {
  opening: "Opening balance",
  hapta: "Hapta",
  interest: "Interest",
  withdrawal: "Withdrawal",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

/** Balance cards: opening + hapta + interest + adjustments − withdrawals = balance. */
export async function SavingsSummary({ l, currency }: { l: MemberLedger; currency?: string }) {
  const money = moneyFmt(currency);
  const t = l.totals;
  const { t: tr } = await getT();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label={tr("savings.balance")} value={<Money paise={l.currentBalancePaise} colored={l.currentBalancePaise < 0} />} tone="good" hint={t.openingCreditsPaise ? tr("savings.inclOpeningX", { amount: money.fmt(t.openingCreditsPaise) }) : undefined} />
      <StatCard label={tr("savings.haptaPaid")} value={<Money paise={t.haptaPaise} />} />
      <StatCard label={tr("savings.interestEarned")} value={<Money paise={t.interestPaise} />} />
      <StatCard label={tr("savings.withdrawn")} value={<Money paise={t.withdrawalsPaise} />} hint={t.adjustmentsPaise ? tr("savings.adjustmentsX", { amount: money.fmt(t.adjustmentsPaise) }) : undefined} />
    </div>
  );
}

/** Passbook-style savings ledger with a running balance. */
export async function SavingsLedgerTable({ l, csvHref }: { l: MemberLedger; csvHref?: string }) {
  const { t } = await getT();
  const kindLabel = (k: string) => (k in KIND_LABEL ? t(`savings.kind.${k}` as Key) : k);
  if (l.lines.length === 0 && l.openingBalancePaise === 0) {
    return <EmptyState title={t("savings.none")} description={t("savings.noneDesc")} />;
  }
  return (
    <div className="flex flex-col gap-2">
      {csvHref && (
        <div className="flex justify-end">
          <ExportCsvButton href={csvHref}>{t("common.downloadCsv")}</ExportCsvButton>
        </div>
      )}
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("savings.colDate")}</TableHead>
              <TableHead>{t("savings.colParticulars")}</TableHead>
              <TableHead className="text-right">{t("savings.colCredit")}</TableHead>
              <TableHead className="text-right">{t("savings.colDebit")}</TableHead>
              <TableHead className="text-right">{t("savings.colBalance")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {l.from && (
              <TableRow className="bg-muted/40">
                <TableCell className="whitespace-nowrap">{formatDate(l.from)}</TableCell>
                <TableCell className="font-medium">{t("savings.broughtForward")}</TableCell>
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
                  <span className="font-medium">{kindLabel(e.kind)}</span>
                  {e.period ? <span className="text-muted-foreground"> · {e.period}</span> : null}
                  <div className="text-xs text-muted-foreground">
                    {e.description}
                    {e.recordedByName ? t("savings.byX", { name: e.recordedByName }) : ""}
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
