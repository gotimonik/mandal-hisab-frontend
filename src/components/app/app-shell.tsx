"use client";

/**
 * Org app shell, split into small client pieces so the layout can render the frame
 * and {children} immediately while the session-dependent parts (org name, nav, user,
 * unread count) stream in behind their own <Suspense> boundaries.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useState, type ReactNode } from "react";
import {
  ArrowUpFromLine,
  Bell,
  BookOpenCheck,
  BookText,
  CalendarDays,
  Building2,
  CalendarClock,
  Check,
  ChevronsUpDown,
  ClipboardList,
  FileBarChart,
  HandCoins,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavIcon, NavItem } from "@/lib/nav";
import { logoutAction } from "@/app/actions/auth";
import { selectOrg } from "@/app/actions/api";

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

export interface ShellOrg {
  id: string;
  name: string;
  role: string;
  status: string;
}

export interface ShellData {
  org: ShellOrg;
  orgs: ShellOrg[];
  nav: NavItem[];
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
        <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-3 border-r bg-sidebar p-3 lg:flex">{sidebar}</aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu />
            </Button>
            {mobileHeader}
          </header>
          <div className="no-print hidden h-12 items-center justify-end gap-2 border-b px-6 lg:flex">{topbar}</div>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-24 sm:px-6 lg:pb-10">{children}</main>
        </div>
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid min-h-14 grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Quick">
          {bottomNav}
          <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground">
            <Menu className="size-5" />
            More
          </button>
        </nav>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-3">
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
  const { setOpen } = use(MenuCtx);
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {items.map((it, idx) => {
        const Icon = ICONS[it.icon];
        const firstMore = it.more && !items[idx - 1]?.more;
        const active = isActive(pathname, it.href, base);
        return (
          <div key={it.href} className="contents">
          {firstMore && <div className="mt-3 px-2.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">More</div>}
          <Link
            href={it.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto w-full justify-between gap-2 px-2 py-1.5 text-left" />}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">{current.name.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{current.name}</span>
            <span className="block text-xs capitalize text-muted-foreground">{current.role}</span>
          </span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {orgs.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onClick={async () => {
                await selectOrg(o.id);
                router.push(`/org/${o.id}`);
              }}
            >
              <Building2 />
              <span className="flex-1 truncate">{o.name}</span>
              {o.id === current.id && <Check />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/onboarding" />}>
          <Plus /> Create or join a Mandal
        </DropdownMenuItem>
        {isPlatformAdmin && (
          <DropdownMenuItem onClick={() => router.push("/platform")}>
            <ShieldCheck /> Platform admin
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user }: { user: { name: string; email: string } }) {
  return (
    <div className="flex items-center gap-2 border-t pt-3">
      <Link href="/account" className="min-w-0 flex-1 rounded-lg px-1 py-1 hover:bg-sidebar-accent">
        <span className="block truncate text-sm font-medium">{user.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
      </Link>
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sign out">
          <LogOut />
        </Button>
      </form>
    </div>
  );
}

/** Desktop sidebar and mobile slide-out menu share the same content. */
export function SidebarContent({ data }: { data: ShellData }) {
  return (
    <>
      <OrgSwitcher current={data.org} orgs={data.orgs} isPlatformAdmin={data.user.isPlatformAdmin} />
      <div className="flex-1 overflow-y-auto">
        <NavLinks items={data.nav} base={`/org/${data.org.id}`} />
      </div>
      <UserMenu user={data.user} />
    </>
  );
}

function Bell_({ href, unread, small }: { href: string; unread: number; small?: boolean }) {
  return (
    <Link href={href} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative rounded-lg p-2 hover:bg-muted">
      <Bell className={small ? "size-4" : "size-5"} />
      {unread > 0 &&
        (small ? (
          <span className="absolute -top-0.5 -right-0.5 rounded-full bg-destructive px-1 text-[10px] leading-4 text-white">{unread > 9 ? "9+" : unread}</span>
        ) : (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
        ))}
    </Link>
  );
}

export function MobileHeaderContent({ data }: { data: ShellData }) {
  return (
    <>
      <span className="min-w-0 flex-1 truncate font-medium">{data.org.name}</span>
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
  const base = `/org/${data.org.id}`;
  return (
    <>
      {data.nav
        .filter((n) => n.primary)
        .slice(0, 4)
        .map((it) => {
          const Icon = ICONS[it.icon];
          const active = isActive(pathname, it.href, base);
          return (
            <Link key={it.href} href={it.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground", active && "text-primary")} aria-current={active ? "page" : undefined}>
              <Icon className="size-5" />
              <span className="truncate">{it.label.split(" ")[0]}</span>
            </Link>
          );
        })}
    </>
  );
}
