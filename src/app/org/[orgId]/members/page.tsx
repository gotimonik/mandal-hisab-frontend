import Link from "next/link";
import { Phone, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/app/bits";
import { SharesChip } from "@/features/monthly/month-list";
import { api, qs } from "@/lib/server/api";
import { getOrg, can, getMoney } from "@/lib/server/data";
import type { Member, Paged } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberDialog } from "@/features/members/member-form";
import { ImportMembersDialog } from "@/features/members/import-dialog";
import { getT } from "@/i18n/server";

export const metadata = { title: "Members" };

export default async function MembersPage({
  params,
  searchParams,
}: PageProps<"/org/[orgId]/members">) {
  const { orgId } = await params;
  const money = await getMoney(orgId);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Number(sp.page ?? 1) || 1;
  const [org, data] = await Promise.all([
    getOrg(orgId),
    api<Paged<Member>>(
      `/orgs/${orgId}/members${qs({ q, status, page, pageSize: 25 })}`,
    ),
  ]);
  const manage = can(org, "members.manage");
  const { t } = await getT();
  return (
    <>
      <PageHeader
        title={t("members.title")}
        description={t("members.desc")}
        actions={
          manage ? (
            <>
              <ImportMembersDialog orgId={orgId} />
              <MemberDialog orgId={orgId} defaultOpen={sp.new === "1"} />
            </>
          ) : null
        }
      />
      <form method="get" role="search" className="no-print mb-3 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder={t("members.searchPh")} aria-label={t("common.search")} className="pl-9" />
        </div>
        <Button type="submit" variant="secondary">
          {t("common.search")}
        </Button>
      </form>
      <div className="no-print scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label={t("common.status")}>
        {[
          ["", t("common.all")],
          ["active", t("members.active")],
          ["inactive", t("members.inactive")],
          ["left", t("members.left")],
        ].map(([k, l]) => (
          <Link
            key={k}
            href={`/org/${orgId}/members${qs({ q, status: k })}`}
            aria-current={status === k ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${status === k ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"}`}
          >
            {l}
          </Link>
        ))}
      </div>
      {data.items.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={
            q || status ? t("members.noMatch") : t("members.none")
          }
          description={
            manage ? t("members.noneDesc") : undefined
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("members.title")}>
            {data.items.map((m) => {
              const due = m.outstandingPaise ?? 0;
              return (
                <li
                  key={m._id}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card ring-1 ring-foreground/[0.06]"
                >
                  <MemberAvatar name={m.name} />
                  <Link
                    href={`/org/${orgId}/members/${m._id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">{m.name}</span>
                      {(m.haptaShares ?? 1) > 1 && <SharesChip n={m.haptaShares!} />}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="font-mono">{m.membershipNumber}</span>
                      {m.status !== "active" && (
                        <StatusBadge status={m.status} />
                      )}
                      <span>
                        {t("members.savingsX")}{" "}
                        <Money
                          paise={m.balancePaise ?? 0}
                          short
                          className="font-medium text-foreground"
                        />
                      </span>
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {due > 0 ? (
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                        {t("members.due", { amount: money.short(due) })}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {t("members.paidUp")}
                      </span>
                    )}
                    {m.phone && (
                      <a
                        href={`tel:${m.phone}`}
                        aria-label={t("common.callX", { name: m.name })}
                        className="flex size-9 items-center justify-center rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300"
                      >
                        <Phone className="size-4" />
                      </a>
                    )}
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
                    <TableHead>{t("members.colNo")}</TableHead>
                    <TableHead>{t("members.colName")}</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t("members.colMobile")}
                    </TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("members.colOutstanding")}</TableHead>
                    <TableHead className="text-right">{t("members.colSavings")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell className="font-mono text-xs">
                        {m.membershipNumber}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/org/${orgId}/members/${m._id}`}
                          className="inline-flex items-center gap-2.5 font-semibold hover:underline"
                        >
                          <MemberAvatar name={m.name} size="sm" />
                          {m.name}
                        </Link>
                        {(m.haptaShares ?? 1) > 1 && <SharesChip n={m.haptaShares!} className="ml-2" />}
                        {m.userId && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            · {t("members.appUser")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {m.phone ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money
                          paise={m.outstandingPaise ?? 0}
                          className={
                            (m.outstandingPaise ?? 0) > 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money
                          paise={m.balancePaise ?? 0}
                          colored={(m.balancePaise ?? 0) < 0}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        baseHref={`/org/${orgId}/members`}
        params={{ q, status }}
      />
    </>
  );
}
