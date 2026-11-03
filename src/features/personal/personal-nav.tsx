"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BarChart3, BellRing, Building2, ChevronRight, LayoutDashboard, ListOrdered, Lock, Menu, Plus, Tags, Target, Wallet, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { useT } from "@/i18n/client";
import type { Key } from "@/i18n/core";
import { NewEntryDialog, TYPE_LOOK, type Book } from "./entry-dialog";
import type { ManualType } from "./types";

/** Every Personal Hisab page, in menu order. */
export const SECTIONS: { href: string; key: string; icon: typeof Wallet; tone: Tone }[] = [
  { href: "/personal", key: "overview", icon: LayoutDashboard, tone: "indigo" },
  { href: "/personal/entries", key: "entries", icon: ListOrdered, tone: "sky" },
  { href: "/personal/report", key: "report", icon: BarChart3, tone: "violet" },
  { href: "/personal/wallets", key: "wallets", icon: Wallet, tone: "emerald" },
  { href: "/personal/categories", key: "categories", icon: Tags, tone: "orange" },
  { href: "/personal/budgets", key: "budgets", icon: Target, tone: "rose" },
  { href: "/personal/reminders", key: "reminders", icon: BellRing, tone: "amber" },
];
const isActive = (path: string, href: string) => (href === "/personal" ? path === href : path === href || path.startsWith(`${href}/`));

/** Desktop: a row of tabs over every page. */
function TopTabs() {
  const t = useT();
  const path = usePathname();
  return (
    <nav aria-label={t("ph.title")} className="mb-2 hidden flex-wrap gap-1.5 lg:flex">
      {SECTIONS.map((s) => {
        const active = isActive(path, s.href);
        const Icon = s.icon;
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors", active ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground ring-1 ring-foreground/[0.08] hover:text-foreground")}
          >
            <Icon className="size-4" />
            {t(`ph.tabs.${s.key}` as Key)}
          </Link>
        );
      })}
    </nav>
  );
}

function SheetFrame({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
  const t = useT();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-3xl border-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-foreground/15" />
        <SheetHeader className="flex-row items-center justify-between p-0">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          <Button variant="ghost" size="icon-sm" className="rounded-full bg-muted/70" aria-label={t("common.close")} onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

/** Phones: Home · Entries · ＋ · Reports · More, always at the bottom. */
export function BottomBar({ book }: { book: Book }) {
  const t = useT();
  const path = usePathname();
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [entryType, setEntryType] = useState<ManualType | null>(null);
  const tab = (href: string, key: string, Icon: typeof Wallet) => {
    const active = isActive(path, href);
    return (
      <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("group flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground", active && "text-primary")}>
        <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active ? "bg-secondary" : "group-active:bg-muted")}>
          <Icon className="size-5" />
        </span>
        <span className="max-w-full truncate px-0.5">{t(`ph.short.${key}` as Key)}</span>
      </Link>
    );
  };
  const moreActive = ["/personal/wallets", "/personal/categories", "/personal/budgets", "/personal/reminders"].some((h) => isActive(path, h));
  return (
    <>
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_oklch(0.3_0.08_278/0.18)] backdrop-blur-md lg:hidden">
        <nav aria-label={t("ph.title")} className="mx-auto grid h-16 max-w-md grid-cols-5 items-end px-1">
          {tab("/personal", "home", LayoutDashboard)}
          {tab("/personal/entries", "entries", ListOrdered)}
          <div className="flex h-full items-start justify-center">
            <button type="button" onClick={() => setAddOpen(true)} aria-label={t("ph.addEntry")} aria-haspopup="dialog" className="-mt-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-background transition-transform active:scale-95">
              <Plus className="size-7" strokeWidth={2.5} />
            </button>
          </div>
          {tab("/personal/report", "report", BarChart3)}
          <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" className={cn("flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground", moreActive && "text-primary")}>
            <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", moreActive && "bg-secondary")}>
              <Menu className="size-5" />
            </span>
            {t("ph.short.more")}
          </button>
        </nav>
      </div>

      <SheetFrame open={addOpen} onOpenChange={setAddOpen} title={t("ph.addEntry")}>
        <div className="grid grid-cols-3 gap-2">
          {(["expense", "income", "transfer"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setAddOpen(false);
                setEntryType(k);
              }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-card ring-1 ring-foreground/[0.06] active:scale-[0.98]"
            >
              <IconChip tone={TYPE_LOOK[k].tone} size="lg">
                {TYPE_LOOK[k].icon}
              </IconChip>
              <span className="text-sm font-bold">{t(`ph.add.${k}`)}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">{t(`ph.add.${k}Hint`)}</span>
            </button>
          ))}
        </div>
      </SheetFrame>

      <SheetFrame open={moreOpen} onOpenChange={setMoreOpen} title={t("ph.title")}>
        <ul className="flex flex-col gap-1">
          {SECTIONS.filter((s) => ["wallets", "categories", "budgets", "reminders"].includes(s.key)).map((s) => (
            <li key={s.href}>
              <Link href={s.href} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-muted/60 active:bg-muted">
                <IconChip tone={s.tone}>
                  <s.icon />
                </IconChip>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{t(`ph.tabs.${s.key}` as Key)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t(`ph.sections.${s.key}` as Key)}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t pt-1">
            <Link href="/onboarding" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-muted/60 active:bg-muted">
              <IconChip tone="slate">
                <Building2 />
              </IconChip>
              <span className="min-w-0 flex-1 text-sm font-semibold">{t("ph.backToMandals")}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        </ul>
      </SheetFrame>

      <NewEntryDialog book={book} type={entryType} onClose={() => setEntryType(null)} />
    </>
  );
}

/** Around every Personal Hisab page: tabs (desktop) or the bottom bar (phones), and the privacy note. */
export function PersonalShell({ bottomBar, children }: { bottomBar: ReactNode; children: ReactNode }) {
  const t = useT();
  return (
    <div className="pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
      <TopTabs />
      <p className="no-print mb-4 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <Lock className="size-3.5 shrink-0" /> {t("ph.private")}
      </p>
      {children}
      {bottomBar}
    </div>
  );
}

/** Big tappable tiles for every section (on the overview). */
export function SectionTiles({ stats }: { stats: Partial<Record<string, ReactNode>> }) {
  const t = useT();
  return (
    <nav aria-label={t("ph.sectionsTitle")} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {SECTIONS.filter((s) => s.key !== "overview").map((s) => (
        <Link key={s.href} href={s.href} className="flex flex-col gap-2 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06] transition-[background-color,transform] hover:bg-muted/50 active:scale-[0.98]">
          <span className="flex items-center justify-between">
            <IconChip tone={s.tone} size="sm">
              <s.icon />
            </IconChip>
            <ChevronRight className="size-4 text-muted-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">{t(`ph.tabs.${s.key}` as Key)}</span>
            <span className="block truncate text-xs text-muted-foreground">{stats[s.key] ?? t(`ph.sections.${s.key}` as Key)}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
