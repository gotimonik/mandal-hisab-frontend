import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getOrg, getSchemes, can } from "@/lib/server/data";
import type { Installment, Paged } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { Pagination } from "@/components/app/pagination";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { InstallmentActionDialog } from "@/features/installments/installment-action";

export const metadata = { title: "Installments" };

const STATUSES = ["outstanding", "overdue", "pending", "partially_paid", "upcoming", "paid", "deferred", "waived", "cancelled"];

export default async function InstallmentsPage({ params, searchParams }: PageProps<"/org/[orgId]/installments">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const f = {
    schemeId: typeof sp.schemeId === "string" ? sp.schemeId : "",
    memberId: typeof sp.memberId === "string" ? sp.memberId : "",
    status: typeof sp.status === "string" ? sp.status : "",
    from: typeof sp.from === "string" ? sp.from : "",
    to: typeof sp.to === "string" ? sp.to : "",
  };
  const page = Number(sp.page ?? 1) || 1;
  const [org, schemes, data] = await Promise.all([getOrg(orgId), getSchemes(orgId), api<Paged<Installment>>(`/orgs/${orgId}/installments${qs({ ...f, page, pageSize: 50 })}`)]);
  const manage = can(org, "installments.manage");
  return (
    <>
      <PageHeader title="Installments" description="Every generated hapta obligation. Status is calculated from verified payments, never edited by hand." />
      <FilterBar resetHref={`/org/${orgId}/installments`}>
        <FilterField label="Scheme">
          <NativeSelect name="schemeId" defaultValue={f.schemeId}>
            <option value="">All schemes</option>
            {schemes.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label="Status">
          <NativeSelect name="status" defaultValue={f.status}>
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label="Due from">
          <Input type="date" name="from" defaultValue={f.from} />
        </FilterField>
        <FilterField label="Due to">
          <Input type="date" name="to" defaultValue={f.to} />
        </FilterField>
        {f.memberId && <input type="hidden" name="memberId" value={f.memberId} />}
      </FilterBar>
      {data.items.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="No installments match" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Scheme / period</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                {manage && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((i) => (
                <TableRow key={i._id}>
                  <TableCell>
                    <Link href={`/org/${orgId}/members/${i.memberId}`} className="font-medium hover:underline">
                      {i.member?.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{i.member?.membershipNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div>{i.schemeName}</div>
                    <div className="text-xs text-muted-foreground">{i.periodLabel}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(i.dueDate)}</TableCell>
                  <TableCell className="text-right">
                    <Money paise={i.amountPaise + i.penaltyPaise} />
                    {i.penaltyPaise > 0 && <div className="text-xs text-muted-foreground">incl. late fee</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={i.paidPaise + i.penaltyPaidPaise} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={i.outstandingPaise} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={i.status} />
                    {i.stateReason && <div className="max-w-40 truncate text-xs text-muted-foreground" title={i.stateReason}>{i.stateReason}</div>}
                  </TableCell>
                  {manage && (
                    <TableCell className="text-right">
                      {i.status !== "paid" && i.state !== "cancelled" ? <InstallmentActionDialog inst={i} /> : null}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/installments`} params={f} />
    </>
  );
}
