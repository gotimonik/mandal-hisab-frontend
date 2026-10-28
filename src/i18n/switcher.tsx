"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLanguage } from "@/app/actions/lang";
import { LANGS, type Lang } from "./core";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLang, useT } from "./client";
import { track } from "@/lib/analytics";

/** English | ગુજરાતી | हिन्दी — a small segmented switch. */
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
              track("language_change", { language: l.code });
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

/** Language icon in a header; tap it to pick English, ગુજરાતી or हिन्दी. */
export function LanguageMenu({ className }: { className?: string }) {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const current = LANGS.find((l) => l.code === lang);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className={cn("rounded-full", className)} />}
        aria-label={`${t("lang.title")}: ${current?.native ?? ""}`}
        title={t("lang.title")}
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Languages />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("lang.title")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={lang}
            onValueChange={(v) => {
              const code = v as Lang;
              if (code === lang) return;
              start(async () => {
                await setLanguage(code);
                track("language_change", { language: code });
                router.refresh();
              });
            }}
          >
            {LANGS.map((l) => (
              <DropdownMenuRadioItem key={l.code} value={l.code} closeOnClick className="py-2">
                <span className="font-medium">{l.native}</span>
                {l.native !== l.label && <span className="text-xs text-muted-foreground">{l.label}</span>}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
