import Link from "next/link";
import { BarChart3, BookText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { api, qs } from "@/lib/server/api";
import { requestToday } from "@/lib/server/today";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { Input } from "@/components/ui/input";
import { SummaryBand } from "@/components/app/summary-band";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { SectionTitle } from "@/components/app/bits";
import { TableWrap } from "@/components/app/table-wrap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getT } from "@/i18n/server";
import { monthName, type Key } from "@/i18n/core";
import { formatDate } from "@/lib/format";
import { TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { MonthsChart } from "@/features/personal/charts";
import { categoryName, type CategoryTotal, type Summary } from "@/features/personal/types";
import type { T } from "@/i18n/core";

export const metadata = { title: "Personal Hisab · Reports" };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const monthStart = (y: number, m: number) => new Date(Date.UTC(y, m, 1));
const monthEnd = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0));

function presets(today: string) {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7)) - 1;
  return [
    { key: "thisMonth", from: iso(monthStart(y, m)), to: today },
    { key: "lastMonth", from: iso(monthStart(y, m - 1)), to: iso(monthEnd(y, m - 1)) },
    { key: "last3", from: iso(monthStart(y, m - 2)), to: today },
    { key: "thisYear", from: `${y}-01-01`, to: today },
    { key: "lastYear", from: `${y - 1}-01-01`, to: `${y - 1}-12-31` },
  ];
}

function Breakdown({ title, rows, total, t }: { title: string; rows: CategoryTotal[]; total: number; t: T }) {
  if (!rows.length) return null;
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5">
      <SectionTitle>{title}</SectionTitle>
      <ul className="flex flex-col divide-y divide-border/60">
        {rows.map((r, i) => (
          <li key={r.category?._id ?? i} className="flex items-center gap-2 py-2 text-sm">
            <span className={cn("size-2.5 shrink-0 rounded-full", TONE_SOLID[r.category?.tone ?? "slate"])} aria-hidden />
            <span className="min-w-0 flex-1 truncate font-medium">{categoryName(t, r.category)}</span>
            <span className="text-xs text-muted-foreground">{total ? Math.round((r.totalPaise / total) * 100) : 0}%</span>
            <Money paise={r.totalPaise} className="w-28 text-right font-semibold" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function PersonalReportPage({ searchParams }: PageProps<"/personal/report">) {
  const sp = await searchParams;
  const today = await requestToday();
  const str = (k: string) => (typeof sp[k] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp[k] as string) ? (sp[k] as string) : "");
  const from = str("from") || `${today.slice(0, 4)}-01-01`;
  const to = str("to") || today;
  const [s, { t, lang }] = await Promise.all([api<Summary>(`/me/personal/summary${qs({ from, to })}`), getT()]);
  const empty = s.totals.incomePaise === 0 && s.totals.expensePaise === 0;

  return (
    <>
      <PageHeader
        title={t("ph.report.title")}
        description={t("ph.report.desc")}
        actions={
          <Link href={`/personal/passbook?from=${from}&to=${to}`} className={buttonVariants({ variant: "outline" })}>
            <BookText /> {t("ph.passbook.title")}
          </Link>
        }
      />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {presets(today).map((p) => (
          <Link key={p.key} href={`/personal/report?from=${p.from}&to=${p.to}`} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors", p.from === from && p.to === to ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10 hover:bg-muted")}>
            {t(`ph.report.presets.${p.key}` as Key)}
          </Link>
        ))}
      </div>
      <FilterBar resetHref="/personal/report">
        <FilterField label={t("ph.list.from")}>
          <Input type="date" name="from" defaultValue={from} />
        </FilterField>
        <FilterField label={t("ph.list.to")}>
          <Input type="date" name="to" defaultValue={to} />
        </FilterField>
      </FilterBar>

      <SummaryBand
        tone={s.totals.netPaise < 0 ? "warm" : "green"}
        label={s.totals.netPaise < 0 ? t("ph.overspent") : t("ph.saved")}
        value={<Money paise={s.totals.netPaise} />}
        sub={`${formatDate(s.from)} – ${formatDate(s.to)}`}
        icon={<BarChart3 />}
        stats={[
          { label: t("ph.moneyIn"), value: <Money paise={s.totals.incomePaise} /> },
          { label: t("ph.spent"), value: <Money paise={s.totals.expensePaise} /> },
        ]}
      />

      {empty ? (
        <EmptyState icon={<BarChart3 />} title={t("ph.report.nothing")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {s.months.length > 1 && (
            <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5 lg:col-span-2">
              <SectionTitle>{t("ph.report.byMonth")}</SectionTitle>
              <MonthsChart months={s.months} />
            </section>
          )}
          <Breakdown title={t("ph.spendingBy")} rows={s.spending} total={s.totals.expensePaise} t={t} />
          <Breakdown title={t("ph.incomeBy")} rows={s.income} total={s.totals.incomePaise} t={t} />
          <section className="lg:col-span-2">
            <SectionTitle>{t("ph.report.byMonth")}</SectionTitle>
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ph.report.month")}</TableHead>
                    <TableHead className="text-right">{t("ph.report.in")}</TableHead>
                    <TableHead className="text-right">{t("ph.report.out")}</TableHead>
                    <TableHead className="text-right">{t("ph.report.net")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.months.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{monthName(lang, m.month)}</TableCell>
                      <TableCell className="text-right">
                        <Money paise={m.incomePaise} className="text-success" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={m.expensePaise} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <Money paise={m.netPaise} colored />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </section>
        </div>
      )}
    </>
  );
}
