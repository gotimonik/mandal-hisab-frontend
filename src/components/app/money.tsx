import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";

export function Money({ paise, className, colored = false }: { paise: number | null | undefined; className?: string; colored?: boolean }) {
  const v = paise ?? 0;
  return (
    <span className={cn("tabular-nums whitespace-nowrap", colored && v < 0 && "text-destructive", colored && v > 0 && "text-success", className)}>
      {formatINR(v)}
    </span>
  );
}
