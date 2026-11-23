import { Percent } from "lucide-react";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { api } from "@/lib/server/api";
import { can, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { requestMonth } from "@/lib/server/today";
import { InterestDistributor } from "@/features/interest/interest-distributor";

import { getT } from "@/i18n/server";
import { monthName } from "@/i18n/core";

export const metadata = { title: "Interest" };

interface Run {
  _id: string;
  period: string;
  mode: "manual" | "rate";
  monthlyRate: string | null;
  basis: string | null;
  creditDate: string;
  totalPaise: number;
  note?: string;
  createdByName: string | null;
}

export default async function InterestPage({ params }: PageProps<"/org/[orgId]/interest">) {
  const { orgId } = await params;
  const { t, lang } = await getT();
  const monthLabelYM = (ym: string) => monthName(lang, ym);
  const [org, runs, thisMonth] = await Promise.all([getOrg(orgId), api<Run[]>(`/orgs/${orgId}/interest/runs`), requestMonth()]);
  const canDistribute = can(org, "interest.distribute") && org.status === "active";
  const total = runs.reduce((s, r) => s + r.totalPaise, 0);
  const last = runs[0];
  const method = (r: Run) => (r.mode === "rate" ? t("int.perMonth", { rate: r.monthlyRate ?? "" }) : t("int.manual"));
  const basis = (r: Run) => (r.basis ? (r.basis === "hapta_contributions" ? t("int.onHapta") : t("int.onPrev")) : null);
  return (
    <>
      <PageHeader title={t("int.title")} description={t("int.desc")} />
      <SummaryBand
        icon={<Percent />}
        label={t("int.allTime")}
        value={<Money paise={total} />}
        sub={last ? t("int.last", { month: monthLabelYM(last.period), date: formatDate(last.creditDate) }) : t("int.nothing")}
        stats={[
          { label: t("int.months"), value: runs.length },
          { label: t("int.lastMonth"), value: last ? <Money paise={last.totalPaise} short /> : "—" },
        ]}
      />
      {canDistribute && (
        <div className="mb-6">
          <InterestDistributor defaults={org.settings.interest} defaultPeriod={thisMonth} />
        </div>
      )}
      <SectionTitle>{t("int.credited")}</SectionTitle>
      {runs.length === 0 ? (
        <EmptyState icon={<Percent />} title={t("int.none")} description={t("int.noneD")} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("int.credited")}>
            {runs.map((r) => (
              <li key={r._id} className="flex items-start gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
                <IconChip tone="pink" size="sm">
                  <Percent />
                </IconChip>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{monthLabelYM(r.period)}</p>
                  <p className="text-xs text-muted-foreground">
                    {method(r)}
                    {basis(r) ? ` · ${basis(r)}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.creditDate)}
                    {r.createdByName ? t("int.by", { name: r.createdByName }) : ""}
                  </p>
                  {r.note && <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>}
                </div>
                <Money paise={r.totalPaise} className="shrink-0 font-bold" />
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("int.month")}</TableHead>
                    <TableHead>{t("int.method")}</TableHead>
                    <TableHead>{t("int.creditedOn")}</TableHead>
                    <TableHead className="text-right">{t("int.total")}</TableHead>
                    <TableHead>{t("int.byCol")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <span className="flex items-center gap-2.5 font-semibold">
                          <IconChip tone="pink" size="sm">
                            <Percent />
                          </IconChip>
                          {monthLabelYM(r.period)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {method(r)}
                        {basis(r) && <div className="text-xs text-muted-foreground">{basis(r)}</div>}
                        {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(r.creditDate)}</TableCell>
                      <TableCell className="text-right">
                        <Money paise={r.totalPaise} className="font-semibold" />
                      </TableCell>
                      <TableCell>{r.createdByName ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
    </>
  );
}
