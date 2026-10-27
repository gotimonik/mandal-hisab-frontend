import Link from "next/link";
import { Ban, Check, CircleDot, FilePen, History, PlusCircle, RotateCcw, ShieldCheck, Trash2, X } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { TableWrap } from "@/components/app/table-wrap";
import { EmptyState } from "@/components/app/empty-state";
import { IconChip, MemberAvatar } from "@/components/app/bits";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { Tone } from "@/lib/tones";

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

/** Icon chip by the verb at the end of the action ("payment.reverse" → reverse). */
const VERB: { test: RegExp; tone: Tone; icon: React.ReactNode }[] = [
  { test: /reverse|revers/, tone: "rose", icon: <RotateCcw /> },
  {
    test: /reject|revoke|cancel|deactivat|suspend/,
    tone: "rose",
    icon: <Ban />,
  },
  { test: /delete|remove/, tone: "rose", icon: <Trash2 /> },
  { test: /verify|approve|accept/, tone: "emerald", icon: <Check /> },
  {
    test: /create|record|register|add|submit|request|repay|payout|setup|start/,
    tone: "violet",
    icon: <PlusCircle />,
  },
  {
    test: /update|change|edit|rate|transfer|waive/,
    tone: "sky",
    icon: <FilePen />,
  },
  { test: /login|password|session|role/, tone: "amber", icon: <ShieldCheck /> },
  { test: /decline|close/, tone: "slate", icon: <X /> },
];
const look = (action: string) => {
  const verb = action.split(".").slice(1).join(".") || action;
  return (
    VERB.find((v) => v.test.test(verb)) ?? {
      tone: "slate" as Tone,
      icon: <CircleDot />,
    }
  );
};
const pretty = (action: string) => action.replace(/[._]/g, " ");

function Changes({ e }: { e: Entry }) {
  if (e.after === undefined || e.after === null) return null;
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs font-medium text-primary">Show changes</summary>
      <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-muted p-2 text-[11px] whitespace-pre-wrap">{JSON.stringify({ before: e.before, after: e.after }, null, 1)}</pre>
    </details>
  );
}

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
      {items.length === 0 ? (
        <EmptyState icon={<History />} title="No changes recorded" description={entityType ? "Try another record type." : undefined} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Audit log">
            {items.map((e) => {
              const lk = look(e.action);
              return (
                <li key={e._id} className="rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
                  <div className="flex items-start gap-3">
                    <IconChip tone={lk.tone} size="sm">
                      {lk.icon}
                    </IconChip>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold capitalize">{pretty(e.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.actorName ?? "System"} · {formatDateTime(e.createdAt)}
                      </p>
                      {e.reason && <p className="mt-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">Reason: {e.reason}</p>}
                      <Changes e={e} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Who</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((e) => {
                    const lk = look(e.action);
                    return (
                      <TableRow key={e._id}>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <IconChip tone={lk.tone} size="sm">
                              {lk.icon}
                            </IconChip>
                            <span>
                              <span className="block font-semibold capitalize">{pretty(e.action)}</span>
                              <span className="block font-mono text-[11px] text-muted-foreground">{e.action}</span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <MemberAvatar name={e.actorName ?? "System"} size="sm" />
                            {e.actorName ?? <span className="text-muted-foreground">System</span>}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</TableCell>
                        <TableCell className="max-w-md text-xs whitespace-normal">
                          {e.reason && <div>Reason: {e.reason}</div>}
                          <Changes e={e} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
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
