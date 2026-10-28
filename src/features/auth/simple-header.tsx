"use client";

import Link from "next/link";
import { HandCoins } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { LanguageMenu } from "@/i18n/switcher";
import { LogoutButton } from "@/components/app/logout-button";

export function SimpleHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between gap-2 border-b pt-[env(safe-area-inset-top)] border-border/60 bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <Link href="/onboarding" className="flex items-center gap-2 font-bold tracking-tight">
        <span className="bg-hero flex size-8 items-center justify-center rounded-lg">
          <HandCoins className="size-4" />
        </span>
        MandalHisab
      </Link>
      <div className="flex items-center gap-2">
        <LanguageMenu />
        <form action={logoutAction} data-track="logout">
          <LogoutButton showLabelFrom="sm" />
        </form>
      </div>
    </header>
  );
}
