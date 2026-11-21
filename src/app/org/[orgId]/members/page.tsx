import Link from "next/link";
import { ArrowUpDown, FileSpreadsheet, Languages, Phone, Users } from "lucide-react";
import { SearchBox } from "@/components/app/filter-bar";
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberDialog } from "@/features/members/member-form";
import { CollectDuesDialog } from "@/features/members/collect-dues-dialog";
import { ImportMembersDialog } from "@/features/members/import-dialog";
import { getT } from "@/i18n/server";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Members" };

export default async function MembersPage({
  params,
  searchParams,
}: PageProps<"/org/[orgId]/members">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  // only members who owe hapta or upad interest now
  const due = sp.due === "1" ? "1" : "";
  const page = Number(sp.page ?? 1) || 1;
  const [org, data] = await Promise.all([
    getOrg(orgId),
    api<Paged<Member>>(
      `/orgs/${orgId}/members${qs({ q, status, due, page, pageSize: 25 })}`,
    ),
  ]);
  // getOrg is already in flight above (and cached), so this resolves without a second wait
  const money = await getMoney(orgId);
  const manage = can(org, "members.manage");
  // hapta and upad interest are collected from the list itself
  const canCollect = can(org, "payments.record") && org.status === "active";
  const { t } = await getT();
  return (
    <>
      <PageHeader
        title={t("members.title")}
        description={t("members.desc")}
        actions={
          <>
            <Link href={`/org/${orgId}/members/sheet`} className={buttonVariants({ variant: "outline" })}>
              <FileSpreadsheet /> {t("sheet.button")}
            </Link>
            {manage && (
              <>
                <Link href={`/org/${orgId}/members/order`} className={buttonVariants({ variant: "outline" })}>
                  <ArrowUpDown /> {t("members.reorder")}
                </Link>
                <Link href={`/org/${orgId}/members/names`} className={buttonVariants({ variant: "outline" })}>
                  <Languages /> {t("members.editNames")}
                </Link>
                <ImportMembersDialog orgId={orgId} />
                <MemberDialog orgId={orgId} defaultOpen={sp.new === "1"} />
              </>
            )}
          </>
        }
      />
      <SearchBox className="mb-3" defaultValue={q} placeholder={t("members.searchPh")} label={t("common.search")} buttonLabel={t("common.search")} hidden={{ status, due }} />
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
            aria-current={!due && status === k ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${!due && status === k ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"}`}
          >
            {l}
          </Link>
        ))}
        <Link
          href={`/org/${orgId}/members${qs({ q, due: "1" })}`}
          aria-current={due ? "page" : undefined}
          className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${due ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30" : "bg-rose-500/8 text-rose-700 ring-1 ring-rose-500/20 hover:bg-rose-500/12 dark:text-rose-300"}`}
        >
          {t("members.dueFilter")}
        </Link>
      </div>
      {data.items.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={
            due && !q ? t("members.noneDue") : q || status || due ? t("members.noMatch") : t("members.none")
          }
          description={
            manage ? t("members.noneDesc") : undefined
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("members.title")}>
            {data.items.map((m) => {
              // owed now: unpaid hapta + unpaid upad interest + upad installment due
              const due = (m.outstandingPaise ?? 0) + (m.upadInterestDuePaise ?? 0) + (m.upadInstallmentDuePaise ?? 0);
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
                      <span className="line-clamp-2 font-semibold break-words">{m.name}</span>
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
                      {(m.upadPaise ?? 0) > 0 && (
                        <span className="text-orange-700 dark:text-orange-300">
                          {t("members.upadX", { amount: money.short(m.upadPaise ?? 0) })}
                        </span>
                      )}
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {due > 0 && canCollect ? (
                      <CollectDuesDialog memberId={m._id} memberName={m.name} duePaise={due} stacked />
                    ) : due > 0 ? (
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
                    <TableHead className="text-right">{t("members.colUpad")}</TableHead>
                    <TableHead className="text-right">{t("members.colSavings")}</TableHead>
                    {canCollect && <TableHead className="w-0"><span className="sr-only">{t("collect.collect")}</span></TableHead>}
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
                          paise={(m.outstandingPaise ?? 0) + (m.upadInterestDuePaise ?? 0) + (m.upadInstallmentDuePaise ?? 0)}
                          className={
                            (m.outstandingPaise ?? 0) + (m.upadInterestDuePaise ?? 0) + (m.upadInstallmentDuePaise ?? 0) > 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }
                        />
                        {((m.upadInterestDuePaise ?? 0) > 0 || (m.upadInstallmentDuePaise ?? 0) > 0) && (
                          <span className="block text-xs text-muted-foreground">
                            {t("members.haptaPart")} {money.short(m.outstandingPaise ?? 0)} · {t("members.interestPart")} {money.short(m.upadInterestDuePaise ?? 0)}
                            {(m.upadInstallmentDuePaise ?? 0) > 0 && <> · {t("members.installmentPart")} {money.short(m.upadInstallmentDuePaise ?? 0)}</>}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(m.upadPaise ?? 0) > 0 ? <Money paise={m.upadPaise} className="text-orange-700 dark:text-orange-300" /> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money
                          paise={m.balancePaise ?? 0}
                          colored={(m.balancePaise ?? 0) < 0}
                        />
                      </TableCell>
                      {canCollect && (
                        <TableCell className="text-right">
                          {(m.outstandingPaise ?? 0) + (m.upadInterestDuePaise ?? 0) + (m.upadInstallmentDuePaise ?? 0) > 0 && <CollectDuesDialog memberId={m._id} memberName={m.name} duePaise={(m.outstandingPaise ?? 0) + (m.upadInterestDuePaise ?? 0) + (m.upadInstallmentDuePaise ?? 0)} size="xs" />}
                        </TableCell>
                      )}
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
        params={{ q, status, due }}
      />
    </>
  );
}
