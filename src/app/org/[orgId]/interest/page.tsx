import { Percent } from "lucide-react";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { monthLabelYM } from "@/lib/months";
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
  const [org, runs, thisMonth] = await Promise.all([getOrg(orgId), api<Run[]>(`/orgs/${orgId}/interest/runs`), requestMonth()]);
  const canDistribute = can(org, "interest.distribute") && org.status === "active";
  const total = runs.reduce((s, r) => s + r.totalPaise, 0);
  const last = runs[0];
  const method = (r: Run) => (r.mode === "rate" ? `${r.monthlyRate}% per month` : "Entered manually");
  const basis = (r: Run) => (r.basis ? (r.basis === "hapta_contributions" ? "on hapta contributions" : "on previous month's balance") : null);
  return (
    <>
      <PageHeader title="Interest" description="Monthly interest added to members' savings balances. No cash moves until a member withdraws." />
      <SummaryBand
        icon={<Percent />}
        label="Interest credited to members, all time"
        value={<Money paise={total} />}
        sub={last ? `Last credited for ${monthLabelYM(last.period)} on ${formatDate(last.creditDate)}` : "Nothing credited yet"}
        stats={[
          { label: "Months credited", value: runs.length },
          { label: "Last month", value: last ? <Money paise={last.totalPaise} short /> : "—" },
        ]}
      />
      {canDistribute && (
        <div className="mb-6">
          <InterestDistributor defaults={org.settings.interest} defaultPeriod={thisMonth} />
        </div>
      )}
      <SectionTitle>Interest credited</SectionTitle>
      {runs.length === 0 ? (
        <EmptyState icon={<Percent />} title="No interest credited yet" description="Credit the first month above." />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Interest credited">
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
                    {r.createdByName ? ` · by ${r.createdByName}` : ""}
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
                    <TableHead>Month</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Credited on</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>By</TableHead>
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
