"use client";

import { cn } from "@/lib/utils";
import { useMoney } from "@/components/app/currency";

/** An amount in the Mandal's currency with tabular digits. `short` drops ".00" for whole amounts (big figures, buttons). */
export function Money({ paise, className, colored = false, short = false }: { paise: number | null | undefined; className?: string; colored?: boolean; short?: boolean }) {
  const m = useMoney();
  const v = paise ?? 0;
  return <span className={cn("tabular-nums whitespace-nowrap", colored && v < 0 && "text-destructive", colored && v > 0 && "text-success", className)}>{short ? m.short(v) : m.fmt(v)}</span>;
}
