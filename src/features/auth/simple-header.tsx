"use client";

import Link from "next/link";
import { HandCoins, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "@/i18n/switcher";

export function SimpleHeader() {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between gap-2 border-b pt-[env(safe-area-inset-top)] border-border/60 bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <Link href="/onboarding" className="flex items-center gap-2 font-bold tracking-tight">
        <span className="bg-hero flex size-8 items-center justify-center rounded-lg">
          <HandCoins className="size-4" />
        </span>
        MandalHisab
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher compact />
        <form action={logoutAction} data-track="logout">
          <Button variant="ghost" size="sm" type="submit">
            <LogOut /> <span className="hidden sm:inline">{t("shell.signOut")}</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
