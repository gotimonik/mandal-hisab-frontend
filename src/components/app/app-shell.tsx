"use client";

/**
 * Org app shell, split into small client pieces so the layout can render the frame
 * and {children} immediately while the session-dependent parts (org name, nav, user,
 * unread count) stream in behind their own <Suspense> boundaries.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Bell, BarChart3, BookOpenCheck, BookText, CalendarDays, Building2, CalendarClock, Check, ChevronsUpDown, ClipboardList, FileBarChart, HandCoins, Heart, Landmark, LayoutDashboard, Menu, Percent, PiggyBank, Banknote, Plus, Receipt, Send, UserPlus, X, Settings, ShieldCheck, UserRound, Users, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavIcon, NavItem, QuickAction, QuickIcon } from "@/lib/nav";
import { TONE_CHIP } from "@/lib/tones";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "@/i18n/switcher";
import type { Lang } from "@/i18n/core";
import { logoutAction } from "@/app/actions/auth";
import { selectOrg } from "@/app/actions/api";
import { LogoutButton } from "@/components/app/logout-button";
import { OrgLogo } from "@/components/app/org-logo";
import { startNavigationProgress } from "@/components/app/navigation-progress";
import { EdgeSwipeMenu } from "@/components/app/edge-swipe-menu";
import { AppVersion } from "@/components/app/app-version";

const ICONS: Record<NavIcon, typeof Bell> = {
  dashboard: LayoutDashboard,
  my: UserRound,
  members: Users,
  schemes: CalendarClock,
  installments: ClipboardList,
  collections: HandCoins,
  loans: Landmark,
  expenses: Receipt,
  donations: Heart,
  accounts: Wallet,
  transactions: BookText,
  reports: FileBarChart,
  notifications: Bell,
  settings: Settings,
  users: ShieldCheck,
  audit: BookText,
  monthly: CalendarDays,
  interest: Percent,
  withdrawals: ArrowUpFromLine,
  cashbook: BookOpenCheck,
  fundloans: HandCoins,
};

const QUICK_ICONS: Record<QuickIcon, typeof Bell> = {
  collect: HandCoins,
  receive: ArrowDownToLine,
  give: Banknote,
  withdraw: ArrowUpFromLine,
  member: UserPlus,
  cash: Wallet,
  summary: BarChart3,
  pay: Send,
  request: HandCoins,
  statement: PiggyBank,
};

export interface ShellOrg {
  id: string;
  name: string;
  role: string;
  status: string;
  logoUrl?: string | null;
}

export interface ShellData {
  org: ShellOrg;
  orgs: ShellOrg[];
  nav: NavItem[];
  quick: QuickAction[];
  lang: Lang;
  user: { name: string; email: string; isPlatformAdmin: boolean };
  unread: number;
}

/* ------------------------------------------------------------------ frame + menu state */

const MenuCtx = createContext<{ open: boolean; setOpen: (o: boolean) => void }>({ open: false, setOpen: () => {} });

export function ShellFrame({ sidebar, mobileHeader, topbar, bottomNav, mobileSheet, children }: { sidebar: ReactNode; mobileHeader: ReactNode; topbar: ReactNode; bottomNav: ReactNode; mobileSheet: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MenuCtx value={{ open, setOpen }}>
      <div className="flex min-h-dvh w-full">
        <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-3 border-r bg-sidebar p-3 lg:flex">{sidebar}</aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-1 border-b pt-[env(safe-area-inset-top)] border-border/60 bg-background/85 pr-2 pl-1 backdrop-blur-md lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu />
            </Button>
            {mobileHeader}
          </header>
          <div className="no-print hidden h-12 items-center justify-end gap-2 border-b border-border/60 bg-background/70 px-6 backdrop-blur lg:flex">{topbar}</div>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6 lg:pt-6 lg:pb-10">{children}</main>
        </div>
        <nav
          className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_oklch(0.3_0.08_278/0.18)] backdrop-blur-md lg:hidden"
          aria-label="Quick"
        >
          <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-end px-1">{bottomNav}</div>
        </nav>
        <EdgeSwipeMenu open={open} setOpen={setOpen} />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[19rem] bg-sidebar p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <SheetHeader className="p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
            {mobileSheet}
          </SheetContent>
        </Sheet>
      </div>
    </MenuCtx>
  );
}

/* ------------------------------------------------------------------ pieces */

function isActive(pathname: string, href: string, base: string) {
  return href === base ? pathname === base : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ items, base }: { items: NavItem[]; base: string }) {
  const pathname = usePathname();
  const t = useT();
  const { setOpen } = use(MenuCtx);
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {items.map((it, idx) => {
        const Icon = ICONS[it.icon];
        const firstMore = it.more && !items[idx - 1]?.more;
        const active = isActive(pathname, it.href, base);
        return (
          <div key={it.href} className="contents">
          {firstMore && <div className="mt-4 px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t("nav.moreTools")}</div>}
          <Link
            href={it.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground lg:py-2",
              active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
            )}
          >
            <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "opacity-70")} />
            {it.label}
          </Link>
          </div>
        );
      })}
    </nav>
  );
}

function OrgSwitcher({ current, orgs, isPlatformAdmin }: { current: ShellOrg; orgs: ShellOrg[]; isPlatformAdmin: boolean }) {
  const router = useRouter();
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto w-full justify-between gap-2 rounded-xl px-2 py-2 text-left md:h-auto" />}>
        <span className="flex min-w-0 items-center gap-2">
          <OrgAvatar name={current.name} logoUrl={current.logoUrl} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{current.name}</span>
            <span className="block text-xs text-muted-foreground">{roleLabel(t, current.role)}</span>
          </span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("shell.organizations")}</DropdownMenuLabel>
          {orgs.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onClick={async () => {
                if (o.id === current.id) return;
                startNavigationProgress();
                await selectOrg(o.id);
                router.push(`/org/${o.id}`);
              }}
            >
              {o.logoUrl ? <OrgAvatar name={o.name} logoUrl={o.logoUrl} className="size-5 rounded-md" /> : <Building2 />}
              <span className="flex-1 truncate">{o.name}</span>
              {o.id === current.id && <Check />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/onboarding" />}>
          <Plus /> {t("shell.createOrJoin")}
        </DropdownMenuItem>
        {isPlatformAdmin && (
          <DropdownMenuItem
            onClick={() => {
              startNavigationProgress();
              router.push("/platform");
            }}
          >
            <ShieldCheck /> {t("shell.platformAdmin")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The Mandal's logo when it has one, otherwise its first letter. */
function OrgAvatar({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  return (
    <OrgLogo logoUrl={logoUrl} className={cn("size-9 rounded-xl shadow-sm", className)}>
      <span className={cn("bg-hero flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm", className)}>{name.slice(0, 1).toUpperCase()}</span>
    </OrgLogo>
  );
}

function UserMenu({ user }: { user: { name: string; email: string } }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <LanguageSwitcher className="self-start" />
    <div className="flex items-center gap-2">
      <Link href="/account" className="min-w-0 flex-1 rounded-lg px-1 py-1 hover:bg-sidebar-accent">
        <span className="block truncate text-sm font-medium">{user.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
      </Link>
      <form action={logoutAction} data-track="logout">
        <LogoutButton size="icon-sm" iconOnly />
      </form>
    </div>
    </div>
  );
}

const roleLabel = (t: ReturnType<typeof useT>, role: string) => (role === "admin" || role === "manager" || role === "member" ? t(`shell.roles.${role}`) : role);

/** Desktop sidebar and mobile slide-out menu share the same content. */
export function SidebarContent({ data }: { data: ShellData }) {
  return (
    <>
      <OrgSwitcher current={data.org} orgs={data.orgs} isPlatformAdmin={data.user.isPlatformAdmin} />
      {/* overscroll-contain: scrolling the menu to its end must not carry on and scroll the page behind it (Safari trackpad momentum) */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <NavLinks items={data.nav} base={`/org/${data.org.id}`} />
      </div>
      <UserMenu user={data.user} />
      <AppVersion />
    </>
  );
}

function Bell_({ href, unread, small }: { href: string; unread: number; small?: boolean }) {
  const t = useT();
  return (
    <Link href={href} aria-label={unread ? t("shell.notificationsUnread", { n: unread }) : t("shell.notifications")} className="relative rounded-full p-2.5 hover:bg-muted">
      <Bell className={small ? "size-4" : "size-5"} />
      {unread > 0 &&
        (small ? (
          <span className="absolute -top-0.5 -right-0.5 rounded-full bg-destructive px-1 text-[10px] leading-4 text-white">{unread > 9 ? "9+" : unread}</span>
        ) : (
          <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-background">{unread > 9 ? "9+" : unread}</span>
        ))}
    </Link>
  );
}

export function MobileHeaderContent({ data }: { data: ShellData }) {
  const t = useT();
  return (
    <>
      <Link href={`/org/${data.org.id}`} className="flex min-w-0 flex-1 items-center gap-2">
        <OrgAvatar name={data.org.name} logoUrl={data.org.logoUrl} className="size-8 rounded-lg text-xs" />
        <span className="min-w-0">
          <span className="block truncate text-[15px] leading-tight font-semibold">{data.org.name}</span>
          <span className="block text-[11px] leading-tight text-muted-foreground">{roleLabel(t, data.org.role)}</span>
        </span>
      </Link>
      <Bell_ href={`/org/${data.org.id}/notifications`} unread={data.unread} />
    </>
  );
}

export function TopbarContent({ data }: { data: ShellData }) {
  return (
    <>
      {data.org.status !== "active" && <span className="mr-auto rounded-md bg-warning/20 px-2 py-0.5 text-xs font-medium capitalize">Organization {data.org.status}</span>}
      <Bell_ href={`/org/${data.org.id}/notifications`} unread={data.unread} small />
    </>
  );
}

export function BottomNavContent({ data }: { data: ShellData }) {
  const pathname = usePathname();
  const t = useT();
  const { setOpen } = use(MenuCtx);
  const [quickOpen, setQuickOpen] = useState(false);
  const base = `/org/${data.org.id}`;
  const primary = data.nav.filter((n) => n.primary).slice(0, 4);
  const hasQuick = data.quick.length > 0;
  const tab = (it: NavItem) => {
    const Icon = ICONS[it.icon];
    const active = isActive(pathname, it.href, base);
    return (
      <Link key={it.href} href={it.href} className={cn("group flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground", active && "text-primary")} aria-current={active ? "page" : undefined}>
        <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active ? "bg-secondary" : "group-active:bg-muted")}>
          <Icon className="size-5" />
        </span>
        <span className="max-w-full truncate px-0.5">{it.short ?? it.label.split(" ")[0]}</span>
      </Link>
    );
  };
  const menuTab = (
    <button key="menu" type="button" onClick={() => setOpen(true)} className="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground">
      <span className="flex h-7 w-12 items-center justify-center rounded-full">
        <Menu className="size-5" />
      </span>
      {t("nav.short.menu")}
    </button>
  );
  if (!hasQuick) return <>{[...primary.map(tab), menuTab].slice(0, 5)}</>;
  // two tabs | + | two tabs (Menu fills a gap when there are fewer tabs)
  const slots: ReactNode[] = primary.map(tab);
  while (slots.length < 4) slots.push(slots.length === 3 ? menuTab : <span key={`gap${slots.length}`} />);
  return (
    <>
      {slots.slice(0, 2)}
      <div className="flex h-full items-start justify-center">
        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          aria-label={t("shell.quickActions")}
          aria-haspopup="dialog"
          className="bg-hero -mt-5 flex size-14 items-center justify-center rounded-2xl shadow-lg shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
        >
          <Plus className="size-7" strokeWidth={2.5} />
        </button>
      </div>
      {slots.slice(2, 4)}
      <Sheet open={quickOpen} onOpenChange={setQuickOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-3xl border-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-foreground/15" />
          <SheetHeader className="flex-row items-center justify-between p-0">
            <SheetTitle className="text-lg font-semibold">{t("shell.whatToDo")}</SheetTitle>
            <Button variant="ghost" size="icon-sm" className="rounded-full bg-muted/70" aria-label={t("common.close")} onClick={() => setQuickOpen(false)}>
              <X />
            </Button>
          </SheetHeader>
          <QuickGrid actions={data.quick.filter((a) => a.key !== "summary")} onPick={() => setQuickOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}


/** Colourful shortcut tiles — the phone "+" sheet and the dashboard share them. */
export function QuickGrid({ actions, onPick, className, row = false }: { actions: QuickAction[]; onPick?: () => void; className?: string; row?: boolean }) {
  return (
    <div className={cn(
      // scroll-px-4: snap the first tile to the page padding, not the screen edge.
      // pt/pb: room for the tiles' ring and shadow, which a horizontal scroller would clip (-mt keeps the spacing).
      row ? "scrollbar-none -mx-4 -mt-1.5 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pt-1.5 pb-2 sm:mx-0 sm:mt-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pt-0 sm:pb-1 lg:grid-cols-7"
         : "grid grid-cols-3 gap-2.5", className)}>
      {actions.map((a) => {
        const Icon = QUICK_ICONS[a.icon];
        return (
          <Link
            key={a.key}
            href={a.href}
            onClick={onPick}
            data-track="quick_action"
            data-track-action={a.key}
            className={cn("flex flex-col items-center gap-2 rounded-2xl bg-card px-1.5 py-3.5 text-center shadow-card ring-1 ring-foreground/[0.06] transition-transform active:scale-[0.97]", row && "w-[6.5rem] shrink-0 snap-start sm:w-auto")}
          >
            <span className={cn("flex size-12 items-center justify-center rounded-2xl", TONE_CHIP[a.tone])}>
              <Icon className="size-6" />
            </span>
            <span className="text-[13px] leading-tight font-semibold">{a.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
