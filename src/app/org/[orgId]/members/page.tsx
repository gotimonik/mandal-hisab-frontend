import Link from "next/link";
import { Users } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getOrg, can } from "@/lib/server/data";
import type { Member, Paged } from "@/lib/types";
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
import { MemberDialog } from "@/features/members/member-form";
import { ImportMembersDialog } from "@/features/members/import-dialog";

export const metadata = { title: "Members" };

export default async function MembersPage({ params, searchParams }: PageProps<"/org/[orgId]/members">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Number(sp.page ?? 1) || 1;
  const [org, data] = await Promise.all([getOrg(orgId), api<Paged<Member>>(`/orgs/${orgId}/members${qs({ q, status, page, pageSize: 25 })}`)]);
  const manage = can(org, "members.manage");
  return (
    <>
      <PageHeader
        title="Members"
        description="Everyone in your Mandal. Members do not need an app login."
        actions={
          manage ? (
            <>
              <ImportMembersDialog orgId={orgId} />
              <MemberDialog orgId={orgId} />
            </>
          ) : null
        }
      />
      <FilterBar resetHref={`/org/${orgId}/members`}>
        <FilterField label="Search" className="col-span-2 sm:w-64">
          <Input name="q" defaultValue={q} placeholder="Name, number or phone" />
        </FilterField>
        <FilterField label="Status">
          <NativeSelect name="status" defaultValue={status}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="left">Left</option>
          </NativeSelect>
        </FilterField>
      </FilterBar>
      {data.items.length === 0 ? (
        <EmptyState icon={<Users />} title={q || status ? "No members match these filters" : "No members yet"} description={manage ? "Add members one by one or import a CSV file." : undefined} />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((m) => (
                <TableRow key={m._id}>
                  <TableCell className="font-mono text-xs">{m.membershipNumber}</TableCell>
                  <TableCell>
                    <Link href={`/org/${orgId}/members/${m._id}`} className="font-medium hover:underline">
                      {m.name}
                    </Link>
                    {m.userId && <span className="ml-2 text-xs text-muted-foreground">· app user</span>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{m.phone ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={m.outstandingPaise ?? 0} className={(m.outstandingPaise ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={m.balancePaise ?? 0} colored={(m.balancePaise ?? 0) < 0} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/members`} params={{ q, status }} />
    </>
  );
}
