"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Building2, ChevronDown, Loader2, LogOut, PiggyBank, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import { useT } from "@/i18n/client";

export interface AccountUser {
  name: string;
  email: string;
  isPlatformAdmin: boolean;
}

/** "Monik Goti" → "MG" */
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

/** The round badge with the person's initials. */
export function UserAvatar({ name, className = "size-8 text-xs" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`bg-hero flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}>
      {initials(name)}
    </span>
  );
}

/**
 * The top bar's main menu (Personal Hisab, the Mandal list, Account): who is signed in, their
 * account & settings, Personal Hisab's wallets & categories, the way between Personal Hisab and
 * their Mandals, and Sign out.
 */
export function AccountMenu({ user }: { user: AccountUser }) {
  const t = useT();
  const [signingOut, startSignOut] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-1.5 rounded-full px-1 sm:pr-2" aria-label={t("shell.accountMenu")} />}>
        <UserAvatar name={user.name} />
        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{user.name.split(/\s+/)[0]}</span>
        <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 py-2">
            <UserAvatar name={user.name} className="size-10 text-sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{user.name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>
          <UserRound /> {t("shell.account")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/personal/settings" />}>
          <Settings2 /> {t("ph.settings.title")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/personal" />}>
          <PiggyBank /> {t("ph.open")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/onboarding" />}>
          <Building2 /> {t("ph.backToMandals")}
        </DropdownMenuItem>
        {user.isPlatformAdmin && (
          <DropdownMenuItem render={<Link href="/platform" />}>
            <ShieldCheck /> {t("shell.platformAdmin")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          closeOnClick={false}
          data-track="logout"
          onClick={() => startSignOut(() => logoutAction())}
        >
          {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />} {signingOut ? t("shell.signingOut") : t("shell.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
