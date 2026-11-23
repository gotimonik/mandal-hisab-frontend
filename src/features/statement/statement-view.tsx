import { Download } from "lucide-react";
import { getT } from "@/i18n/server";
import { Money } from "@/components/app/money";
import { TableWrap } from "@/components/app/table-wrap";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { formatDate } from "@/lib/format";
import { PrintButton } from "@/components/app/print-button";
import { ExportCsvButton } from "@/components/app/export-csv-button";

export interface Statement {
  from: string;
  to: string;
  openingBalancePaise: number;
  closingBalancePaise: number;
  totalDebitPaise: number;
  totalCreditPaise: number;
  note: string;
  lines: { date: string; description: string; ref?: string; debitPaise: number; creditPaise: number; balancePaise: number }[];
  loans: { loanNumber: string; status: string; principalPaise: number; summary: { outstandingPrincipalPaise: number; interestOutstandingPaise: number } }[];
}

export async function StatementView({ s, csvHref }: { s: Statement; csvHref: string }) {
  const { t } = await getT();
  return (
    <div className="flex flex-col gap-3">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {formatDate(s.from)} – {formatDate(s.to)} · {s.note}
        </p>
        <div className="flex gap-2">
          <ExportCsvButton href={csvHref}>
            <Download /> CSV
          </ExportCsvButton>
          <PrintButton />
        </div>
      </div>
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("ap.date")}</TableHead>
              <TableHead>{t("doc.particulars")}</TableHead>
              <TableHead className="text-right">{t("doc.dr")}</TableHead>
              <TableHead className="text-right">{t("doc.cr")}</TableHead>
              <TableHead className="text-right">{t("doc.balance")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/40">
              <TableCell />
              <TableCell className="font-medium">{t("doc.opening")}</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-right">
                <Money paise={s.openingBalancePaise} />
              </TableCell>
            </TableRow>
            {s.lines.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap">{formatDate(l.date)}</TableCell>
                <TableCell className="min-w-56">
                  {l.description}
                  {l.ref && <span className="ml-1 text-xs text-muted-foreground">({l.ref})</span>}
                </TableCell>
                <TableCell className="text-right">{l.debitPaise ? <Money paise={l.debitPaise} /> : ""}</TableCell>
                <TableCell className="text-right">{l.creditPaise ? <Money paise={l.creditPaise} /> : ""}</TableCell>
                <TableCell className="text-right">
                  <Money paise={l.balancePaise} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell />
              <TableCell className="font-medium">{t("doc.closing")}</TableCell>
              <TableCell className="text-right">
                <Money paise={s.totalDebitPaise} />
              </TableCell>
              <TableCell className="text-right">
                <Money paise={s.totalCreditPaise} />
              </TableCell>
              <TableCell className="text-right font-semibold">
                <Money paise={s.closingBalancePaise} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableWrap>
    </div>
  );
}
