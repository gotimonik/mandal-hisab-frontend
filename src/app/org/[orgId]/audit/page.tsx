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

import { getT } from "@/i18n/server";
import type { Key, T } from "@/i18n/core";

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
/** "payment.verify" → "Payment verified" in the chosen language; unknown actions fall back to the code. */
const actionLabel = (t: T, action: string) => {
  const key = `act.${action.replace(/\./g, "_")}`;
  const out = t(key as Key);
  return out === key ? pretty(action) : out;
};

function Changes({ e, t }: { e: Entry; t: T }) {
  if (e.after === undefined || e.after === null) return null;
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs font-medium text-primary">{t("aud.showChanges")}</summary>
      <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-muted p-2 text-[11px] whitespace-pre-wrap">{JSON.stringify({ before: e.before, after: e.after }, null, 1)}</pre>
    </details>
  );
}

export default async function AuditPage({ params, searchParams }: PageProps<"/org/[orgId]/audit">) {
  const { orgId } = await params;
  const { t } = await getT();
  const sp = await searchParams;
  const entityType = typeof sp.entityType === "string" ? sp.entityType : "";
  const page = Number(sp.page ?? 1) || 1;
  const items = await api<Entry[]>(`/orgs/${orgId}/audit-logs${qs({ entityType, page })}`);
  return (
    <>
      <PageHeader title={t("aud.title")} description={t("aud.desc")} />
      <FilterBar resetHref={`/org/${orgId}/audit`}>
        <FilterField label={t("aud.recordType")}>
          <NativeSelect name="entityType" defaultValue={entityType}>
            <option value="">{t("ap.all")}</option>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`aud.type.${ty}` as Key)}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
      </FilterBar>
      {items.length === 0 ? (
        <EmptyState icon={<History />} title={t("aud.none")} description={entityType ? t("aud.noneD") : undefined} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("aud.title")}>
            {items.map((e) => {
              const lk = look(e.action);
              return (
                <li key={e._id} className="rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
                  <div className="flex items-start gap-3">
                    <IconChip tone={lk.tone} size="sm">
                      {lk.icon}
                    </IconChip>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold first-letter:uppercase">{actionLabel(t, e.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.actorName ?? t("aud.system")} · {formatDateTime(e.createdAt)}
                      </p>
                      {e.reason && <p className="mt-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">{t("aud.reason", { reason: e.reason })}</p>}
                      <Changes e={e} t={t} />
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
                    <TableHead>{t("aud.action")}</TableHead>
                    <TableHead>{t("aud.who")}</TableHead>
                    <TableHead>{t("aud.when")}</TableHead>
                    <TableHead>{t("aud.details")}</TableHead>
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
                              <span className="block font-semibold first-letter:uppercase">{actionLabel(t, e.action)}</span>
                              <span className="block font-mono text-[11px] text-muted-foreground">{e.action}</span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <MemberAvatar name={e.actorName ?? t("aud.system")} size="sm" />
                            {e.actorName ?? <span className="text-muted-foreground">{t("aud.system")}</span>}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</TableCell>
                        <TableCell className="max-w-md text-xs whitespace-normal">
                          {e.reason && <div>{t("aud.reason", { reason: e.reason })}</div>}
                          <Changes e={e} t={t} />
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
            {t("aud.newer")}
          </Link>
        )}
        {items.length === 50 && (
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/org/${orgId}/audit${qs({ entityType, page: page + 1 })}`}>
            {t("aud.older")}
          </Link>
        )}
      </div>
    </>
  );
}
