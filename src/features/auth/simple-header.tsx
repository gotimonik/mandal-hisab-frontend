"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Building2, HandCoins, PiggyBank } from "lucide-react";

import { LanguageMenu } from "@/i18n/switcher";
import { useT } from "@/i18n/client";

/** `account`: the signed-in person's menu (name, email, account & settings, sign out). */
export function SimpleHeader({ account }: { account?: ReactNode }) {
  const t = useT();
  const inPersonal = usePathname().startsWith("/personal");
  return (
    <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between gap-2 border-b pt-[env(safe-area-inset-top)] border-border/60 bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <Link href="/onboarding" className="flex items-center gap-2 font-bold tracking-tight">
        <span className="bg-hero flex size-8 items-center justify-center rounded-lg">
          <HandCoins className="size-4" />
        </span>
        MandalHisab
      </Link>
      <div className="flex items-center gap-2">
        {/* Personal Hisab ⇄ the person's Mandals */}
        <Link href={inPersonal ? "/onboarding" : "/personal"} className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={inPersonal ? t("ph.backToMandals") : t("ph.open")}>
          {inPersonal ? <Building2 className="size-4" /> : <PiggyBank className="size-4 text-emerald-600 dark:text-emerald-400" />}
          <span className="hidden sm:inline">{inPersonal ? t("ph.backToMandals") : t("ph.open")}</span>
        </Link>
        <LanguageMenu />
        {account}
      </div>
    </header>
  );
}
