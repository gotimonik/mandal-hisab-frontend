"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLanguage } from "@/app/actions/lang";
import { LANGS } from "./core";
import { useLang, useT } from "./client";

/** English | ગુજરાતી — a small segmented switch. */
export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label={t("lang.title")} className={cn("inline-flex items-center gap-1 rounded-xl bg-muted/70 p-1 text-xs font-semibold", className)}>
      {pending ? <Loader2 className="mx-1 size-3.5 animate-spin text-muted-foreground" /> : !compact && <Languages className="mx-1 size-3.5 text-muted-foreground" />}
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-pressed={lang === l.code}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setLanguage(l.code);
              router.refresh();
            })
          }
          className={cn("rounded-lg px-2.5 py-1.5 transition-colors", lang === l.code ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
}
