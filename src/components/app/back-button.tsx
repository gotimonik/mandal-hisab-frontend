"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { parentPath } from "@/lib/back";
import { startNavigationProgress } from "@/components/app/navigation-progress";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/*
 * How many screens deep we are in this session, so "back" can step back through real history and
 * only falls back to the parent screen when there's nothing to go back to (e.g. opened from a
 * notification). Module-level: it survives moving between the Mandal and Personal Hisab layouts.
 */
let depth = 0;
let lastPath: string | null = null;
let popped = false;
if (typeof window !== "undefined") window.addEventListener("popstate", () => (popped = true));

function useTrackDepth(pathname: string) {
  useEffect(() => {
    if (lastPath !== null && lastPath !== pathname) depth = popped ? Math.max(0, depth - 1) : depth + 1;
    popped = false;
    lastPath = pathname;
  }, [pathname]);
}

/**
 * "‹ Back" for every screen below the top level — the iOS app has no system back button.
 * `hide`: top-level screens (e.g. the bottom-bar tabs) where back makes no sense.
 */
export function BackButton({ hide = [], className, label = false }: { hide?: string[]; className?: string; label?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  useTrackDepth(pathname);
  const parent = parentPath(pathname);
  if (!parent || hide.includes(pathname)) return null;

  const goBack = () => {
    startNavigationProgress();
    if (depth > 0) router.back();
    else router.push(parent);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={t("common.back")}
      className={cn("no-print flex shrink-0 items-center gap-0.5 rounded-full py-2 pr-2.5 pl-1.5 text-sm font-medium text-primary hover:bg-muted active:bg-muted", className)}
    >
      <ChevronLeft className="size-5" />
      {label && t("common.back")}
    </button>
  );
}
