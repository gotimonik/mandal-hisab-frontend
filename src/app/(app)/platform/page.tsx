import { redirect } from "next/navigation";
import { api, qs } from "@/lib/server/api";
import type { Me } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { ActionButton } from "@/components/app/action-button";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { TableWrap } from "@/components/app/table-wrap";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Platform admin" };

interface PlatformOrg {
  _id: string;
  name: string;
  code: string;
  city?: string;
  status: string;
  statusReason?: string;
  createdAt: string;
  users: number;
  registrationNumber?: string;
  creator?: { name: string; email: string };
}

export default async function PlatformPage({ searchParams }: PageProps<"/platform">) {
  const sp = await searchParams;
  const me = await api<Me>("/auth/me");
  if (!me.user.isPlatformAdmin) redirect("/onboarding");
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q : "";
  const [stats, orgs] = await Promise.all([
    api<{ organizations: number; activeUsers: number; organizationsByStatus: Record<string, number> }>("/platform/stats"),
    api<PlatformOrg[]>(`/platform/organizations${qs({ status, q })}`),
  ]);
  return (
    <>
      <PageHeader title="Platform administration" description="Approve and manage registered organizations. Organization financial data is not visible here." />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Organizations" value={stats.organizations} />
        <StatCard label="Pending approval" value={stats.organizationsByStatus.pending ?? 0} tone={(stats.organizationsByStatus.pending ?? 0) > 0 ? "warn" : "default"} />
        <StatCard label="Suspended" value={stats.organizationsByStatus.suspended ?? 0} />
        <StatCard label="Active users" value={stats.activeUsers} />
      </div>
      <FilterBar resetHref="/platform">
        <FilterField label="Status">
          <NativeSelect name="status" defaultValue={status}>
            <option value="">All</option>
            {["pending", "active", "suspended", "archived"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label="Name">
          <Input name="q" defaultValue={q} />
        </FilterField>
      </FilterBar>
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Registered by</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((o) => (
              <TableRow key={o._id}>
                <TableCell>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.code}
                    {o.city ? ` · ${o.city}` : ""}
                    {o.registrationNumber ? ` · Reg ${o.registrationNumber}` : ""}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  {o.creator?.name}
                  <div className="text-muted-foreground">{o.creator?.email}</div>
                </TableCell>
                <TableCell>{o.users}</TableCell>
                <TableCell>{formatDate(o.createdAt)}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                  {o.statusReason && <div className="mt-1 max-w-48 text-xs text-muted-foreground">{o.statusReason}</div>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {o.status === "pending" && (
                      <ActionButton path={`/platform/organizations/${o._id}`} method="PATCH" body={{ action: "approve" }} successMessage="Organization approved" variant="default">
                        Approve
                      </ActionButton>
                    )}
                    {(o.status === "active" || o.status === "pending") && (
                      <ActionButton path={`/platform/organizations/${o._id}`} method="PATCH" body={{ action: "suspend" }} successMessage="Organization suspended" confirm={{ title: `Suspend ${o.name}?`, description: "Its users lose access until it is reactivated.", reason: "required", destructive: true, confirmLabel: "Suspend" }}>
                        Suspend
                      </ActionButton>
                    )}
                    {(o.status === "suspended" || o.status === "archived") && (
                      <ActionButton path={`/platform/organizations/${o._id}`} method="PATCH" body={{ action: "reactivate" }} successMessage="Organization reactivated">
                        Reactivate
                      </ActionButton>
                    )}
                    {o.status !== "archived" && (
                      <ActionButton path={`/platform/organizations/${o._id}`} method="PATCH" body={{ action: "archive" }} successMessage="Organization archived" variant="ghost" confirm={{ title: `Archive ${o.name}?`, description: "Archived organizations become read-only.", reason: "required", confirmLabel: "Archive" }}>
                        Archive
                      </ActionButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </>
  );
}
