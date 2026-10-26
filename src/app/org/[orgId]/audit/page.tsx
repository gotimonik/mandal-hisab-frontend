import { api, qs } from "@/lib/server/api";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { TableWrap } from "@/components/app/table-wrap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Audit log" };

interface Entry {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorName: string | null;
  reason?: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
}

const TYPES = ["payment", "donation", "expense", "loan", "loanRepayment", "installment", "scheme", "member", "membership", "financialAccount", "financialTransaction", "organization"];

export default async function AuditPage({ params, searchParams }: PageProps<"/org/[orgId]/audit">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const entityType = typeof sp.entityType === "string" ? sp.entityType : "";
  const page = Number(sp.page ?? 1) || 1;
  const items = await api<Entry[]>(`/orgs/${orgId}/audit-logs${qs({ entityType, page })}`);
  return (
    <>
      <PageHeader title="Audit log" description="Append-only record of who changed what, when and why." />
      <FilterBar resetHref={`/org/${orgId}/audit`}>
        <FilterField label="Record type">
          <NativeSelect name="entityType" defaultValue={entityType}>
            <option value="">All</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
      </FilterBar>
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((e) => (
              <TableRow key={e._id}>
                <TableCell className="whitespace-nowrap text-xs">{formatDateTime(e.createdAt)}</TableCell>
                <TableCell>{e.actorName ?? "System"}</TableCell>
                <TableCell className="font-mono text-xs">{e.action}</TableCell>
                <TableCell className="max-w-md text-xs">
                  {e.reason && <div>Reason: {e.reason}</div>}
                  {e.after !== undefined && e.after !== null && (
                    <details>
                      <summary className="cursor-pointer text-muted-foreground">changes</summary>
                      <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-[11px] whitespace-pre-wrap">{JSON.stringify({ before: e.before, after: e.after }, null, 1)}</pre>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
      <div className="mt-3 flex gap-2">
        {page > 1 && (
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/org/${orgId}/audit${qs({ entityType, page: page - 1 })}`}>
            Newer
          </Link>
        )}
        {items.length === 50 && (
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/org/${orgId}/audit${qs({ entityType, page: page + 1 })}`}>
            Older
          </Link>
        )}
      </div>
    </>
  );
}
