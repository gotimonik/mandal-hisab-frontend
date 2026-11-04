"use client";

import Link from "next/link";
import { ChevronRight, Lock, PiggyBank } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import { useT } from "@/i18n/client";

/** On a Mandal's dashboard: the way into the person's own Personal Hisab (it lives outside every Mandal). */
export function PersonalHisabCard() {
  const t = useT();
  return (
    <Link href="/personal" className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-emerald-500/25 transition-colors hover:bg-muted/50 active:scale-[0.99]">
      <IconChip tone="emerald" size="lg">
        <PiggyBank />
      </IconChip>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{t("ph.title")}</span>
        <span className="block text-sm text-muted-foreground">{t("ph.openDesc")}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" /> {t("ph.cardPrivate")}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
