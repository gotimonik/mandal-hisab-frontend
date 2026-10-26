import { Percent } from "lucide-react";
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
  return (
    <>
      <PageHeader title="Interest" description="Monthly interest credited to members' savings balances." />
      {canDistribute && (
        <div className="mb-6">
          <InterestDistributor defaults={org.settings.interest} defaultPeriod={thisMonth} />
        </div>
      )}
      <h2 className="mb-2 font-medium">Interest credited</h2>
      {runs.length === 0 ? (
        <EmptyState icon={<Percent />} title="No interest credited yet" />
      ) : (
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
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell>
                    {r.mode === "rate" ? `${r.monthlyRate}% per month` : "Manual"}
                    {r.basis && <div className="text-xs text-muted-foreground">{r.basis === "hapta_contributions" ? "on hapta contributions" : "on previous month's balance"}</div>}
                    {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(r.creditDate)}</TableCell>
                  <TableCell className="text-right">
                    <Money paise={r.totalPaise} />
                  </TableCell>
                  <TableCell>{r.createdByName ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
