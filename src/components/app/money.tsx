import { cn } from "@/lib/utils";
import { formatINR, formatINRShort } from "@/lib/format";

/** ₹ amount with tabular digits. `short` drops ".00" for whole rupees (big figures, buttons). */
export function Money({ paise, className, colored = false, short = false }: { paise: number | null | undefined; className?: string; colored?: boolean; short?: boolean }) {
  const v = paise ?? 0;
  return <span className={cn("tabular-nums whitespace-nowrap", colored && v < 0 && "text-destructive", colored && v > 0 && "text-success", className)}>{short ? formatINRShort(v) : formatINR(v)}</span>;
}
