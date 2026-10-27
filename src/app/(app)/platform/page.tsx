import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import type { Me } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { SummaryBand } from "@/components/app/summary-band";
import { ChipLinks } from "@/components/app/chip-links";
import { EmptyState } from "@/components/app/empty-state";
import { IconChip } from "@/components/app/bits";
import { StatusBadge } from "@/components/app/status-badge";
import { ActionButton } from "@/components/app/action-button";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { TableWrap } from "@/components/app/table-wrap";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

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

const STATUSES = [
  ["", "All"],
  ["pending", "Pending"],
  ["active", "Active"],
  ["suspended", "Suspended"],
  ["archived", "Archived"],
] as const;

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
  const by = stats.organizationsByStatus;
  const actions = (o: PlatformOrg) => (
    <>
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
    </>
  );
  const orgLine = (o: PlatformOrg) => [o.code, o.city, o.registrationNumber && `Reg ${o.registrationNumber}`].filter(Boolean).join(" · ");
  return (
    <>
      <PageHeader title="Platform administration" description="Approve and manage registered organizations. Organization financial data is not visible here." />
      <SummaryBand
        icon={<Building2 />}
        label="Organizations"
        value={stats.organizations}
        sub={`${stats.activeUsers} active user${stats.activeUsers === 1 ? "" : "s"}`}
        stats={[
          { label: "Pending approval", value: by.pending ?? 0 },
          { label: "Active", value: by.active ?? 0 },
          { label: "Suspended", value: by.suspended ?? 0 },
        ]}
      />
      <ChipLinks
        label="Status"
        current={status}
        items={STATUSES.map(([k, l]) => ({ key: k, label: l, href: `/platform${qs({ status: k, q })}`, count: k ? (by[k] ?? 0) : undefined }))}
      />
      <FilterBar resetHref="/platform">
        {status && <input type="hidden" name="status" value={status} />}
        <FilterField label="Name">
          <Input name="q" defaultValue={q} />
        </FilterField>
      </FilterBar>
      {orgs.length === 0 ? (
        <EmptyState icon={<Building2 />} title="No organizations found" description="Try another status or name." />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Organizations">
            {orgs.map((o) => (
              <li key={o._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", o.status === "pending" && "ring-2 ring-amber-400/40", o.status === "archived" && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <IconChip tone="indigo" size="sm">
                    <Building2 />
                  </IconChip>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{o.name}</span>
                    <p className="truncate text-xs text-muted-foreground">{orgLine(o)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.creator?.name} · {o.users} user{o.users === 1 ? "" : "s"} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                {o.statusReason && <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">{o.statusReason}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1 empty:hidden">{actions(o)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
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
                    <TableRow key={o._id} className={cn(o.status === "archived" && "text-muted-foreground")}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <IconChip tone="indigo" size="sm">
                            <Building2 />
                          </IconChip>
                          <div className="min-w-0">
                            <div className="font-semibold">{o.name}</div>
                            <div className="text-xs text-muted-foreground">{orgLine(o)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {o.creator?.name}
                        <div className="text-muted-foreground">{o.creator?.email}</div>
                      </TableCell>
                      <TableCell className="tabular-nums">{o.users}</TableCell>
                      <TableCell>{formatDate(o.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                        {o.statusReason && <div className="mt-1 max-w-48 text-xs text-muted-foreground">{o.statusReason}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">{actions(o)}</div>
                      </TableCell>
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
