"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { MonthRow } from "@/lib/types";
import { Money } from "@/components/app/money";
import { MemberAvatar } from "@/components/app/bits";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CollectDialog } from "./collect-dialog";
import { useT } from "@/i18n/client";

type Filter = "" | "due" | "paid";

/** "×3" — this member pays 3 haptas a month */
export function SharesChip({ n, className }: { n: number; className?: string }) {
  const t = useT();
  return (
    <span title={t("monthly.haptasX", { n })} aria-label={t("mdash.haptasN", { n })} className={cn("shrink-0 rounded-md bg-violet-500/12 px-1.5 py-0.5 text-[11px] font-bold text-violet-700 tabular-nums dark:text-violet-300", className)}>
      ×{n}
    </span>
  );
}

/** ‹ October 2026 › — tapping the month opens the phone's month picker. */
export function MonthSwitcher({ month, label, base, prev, next }: { month: string; label: string; base: string; prev: string; next: string }) {
  const router = useRouter();
  const t = useT();
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-card p-1 shadow-card ring-1 ring-foreground/[0.06]">
      <Link href={`${base}?month=${prev}`} aria-label={t("monthly.prevMonth")} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-xl")}>
        <ChevronLeft />
      </Link>
      <label className="relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-[15px] font-bold hover:bg-muted">
        <CalendarDays className="size-4 text-primary" />
        {label}
        <input
          type="month"
          aria-label={t("monthly.month")}
          defaultValue={month}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => e.target.value && router.push(`${base}?month=${e.target.value}`)}
        />
      </label>
      <Link href={`${base}?month=${next}`} aria-label={t("monthly.nextMonth")} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-xl")}>
        <ChevronRight />
      </Link>
    </div>
  );
}

/**
 * Who has paid this month. Search and the All / Due / Paid chips filter instantly on the phone;
 * each unpaid row has one big "Collect" button showing the amount.
 */
export function MonthList({ orgId, rows, period, canCollect, initialFilter }: { orgId: string; rows: MonthRow[]; period: string; canCollect: boolean; initialFilter: string }) {
  const [filter, setFilter] = useState<Filter>(initialFilter === "due" || initialFilter === "paid" ? initialFilter : "");
  const [q, setQ] = useState("");
  const t = useT();
  const counts = useMemo(() => ({ all: rows.length, due: rows.filter((r) => r.outstandingPaise > 0).length, paid: rows.filter((r) => r.status === "paid").length }), [rows]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => (filter === "due" ? r.outstandingPaise > 0 : filter === "paid" ? r.status === "paid" : true))
      .filter((r) => !needle || `${r.member?.name ?? ""} ${r.member?.membershipNumber ?? ""} ${r.member?.phone ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.outstandingPaise > 0) - Number(a.outstandingPaise > 0));
  }, [rows, filter, q]);

  const chip = (k: Filter, l: string, n: number) => (
    <button
      key={k}
      type="button"
      onClick={() => setFilter(k)}
      aria-pressed={filter === k}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
        filter === k ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground",
      )}
    >
      {l}
      <span className={cn("rounded-full px-1.5 text-xs tabular-nums", filter === k ? "bg-white/20" : "bg-muted")}>{n}</span>
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("monthly.searchPh")} aria-label={t("monthly.searchMembers")} className="pr-9 pl-9" />
          {q && (
            <button type="button" aria-label={t("common.clearSearch")} onClick={() => setQ("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {chip("", t("monthly.chipAll"), counts.all)}
          {chip("due", t("monthly.chipToCollect"), counts.due)}
          {chip("paid", t("monthly.chipPaid"), counts.paid)}
        </div>
      </div>

      {shown.length === 0 ? (
        rows.length === 0 ? (
          <EmptyState icon={<CalendarDays />} title={t("monthly.noneThisMonth")} description={t("monthly.noneThisMonthDesc")} />
        ) : filter === "due" && !q ? (
          <EmptyState icon={<CheckCircle2 />} title={t("monthly.everyonePaid")} description={t("monthly.everyonePaidDesc", { month: period })} />
        ) : (
          <EmptyState icon={<Search />} title={t("monthly.nobody")} description={t("monthly.nobodyDesc")} />
        )
      ) : (
        <ul className="flex flex-col gap-2 md:gap-0 md:divide-y md:overflow-hidden md:rounded-2xl md:bg-card md:shadow-card md:ring-1 md:ring-foreground/[0.06]">
          {shown.map((r) => {
            const name = r.member?.name ?? "—";
            const due = r.outstandingPaise > 0;
            const receipt = r.payments.at(-1)?.receiptId;
            return (
              <li key={r.installmentId} className={cn("flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card ring-1 ring-foreground/[0.06] md:rounded-none md:px-4 md:shadow-none md:ring-0", !due && "bg-card/70")}>
                <MemberAvatar name={name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/org/${orgId}/members/${r.memberId}`} className="truncate font-semibold hover:underline">
                      {name}
                    </Link>
                    {(r.shares ?? 1) > 1 && <SharesChip n={r.shares!} />}
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{r.member?.membershipNumber}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <StatusBadge status={r.status} />
                    {r.collectedPaise > 0 && due && (
                      <span>
                        {t("monthly.paidOf", { a: formatINR(r.collectedPaise), b: formatINR(r.expectedPaise) })}
                      </span>
                    )}
                    {r.lastPaymentDate && !due && (
                      <span className="truncate">
                        {formatDate(r.lastPaymentDate)}
                        {r.recordedBy.length ? ` · ${r.recordedBy.join(", ")}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {canCollect && r.state === "active" && due ? (
                    <CollectDialog installmentId={r.installmentId} memberName={name} period={period} outstandingPaise={r.outstandingPaise} size="sm" showAmount />
                  ) : due ? (
                    <Money paise={r.outstandingPaise} className="font-bold text-destructive" />
                  ) : receipt ? (
                    <Link href={`/org/${orgId}/receipts/${receipt}`} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                      <CheckCircle2 className="size-3.5" /> {t("common.receipt")}
                    </Link>
                  ) : (
                    <Money paise={r.collectedPaise} className="text-sm text-muted-foreground" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
