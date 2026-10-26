import Link from "next/link";
import { Landmark, Plus } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getOrg, can } from "@/lib/server/data";
import type { Loan } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Loans" };

export default async function LoansPage({ params, searchParams }: PageProps<"/org/[orgId]/loans">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const [org, loans] = await Promise.all([getOrg(orgId), api<Loan[]>(`/orgs/${orgId}/loans${qs({ status })}`)]);
  return (
    <>
      <PageHeader
        title="Loans"
        description="Loans to members are tracked separately from hapta: principal is an asset, only interest and late fees are income."
        actions={
          can(org, "loans.manage") && org.status === "active" ? (
            <Link href={`/org/${orgId}/loans/new`} className={buttonVariants()}>
              <Plus /> New loan
            </Link>
          ) : null
        }
      />
      <FilterBar resetHref={`/org/${orgId}/loans`}>
        <FilterField label="Status">
          <NativeSelect name="status" defaultValue={status}>
            <option value="">All</option>
            {["applied", "approved", "active", "closed", "rejected"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
      </FilterBar>
      {loans.length === 0 ? (
        <EmptyState icon={<Landmark />} title="No loans" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Terms</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((l) => (
                <TableRow key={l._id}>
                  <TableCell>
                    <Link href={`/org/${orgId}/loans/${l._id}`} className="font-mono text-xs font-medium hover:underline">
                      {l.loanNumber}
                    </Link>
                    {l.disbursedOn && <div className="text-xs text-muted-foreground">{formatDate(l.disbursedOn)}</div>}
                  </TableCell>
                  <TableCell>{l.member?.name}</TableCell>
                  <TableCell className="text-xs">
                    {l.annualRate}% · {l.interestMethod.replace("_", " ")} · {l.tenure} {l.repaymentFrequency}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={l.principalPaise ?? l.approvedPaise ?? l.requestedPaise} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={l.outstandingPrincipalPaise} />
                  </TableCell>
                  <TableCell className="text-right">{l.summary?.overdueAmountPaise ? <Money paise={l.summary.overdueAmountPaise} className="text-destructive" /> : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
