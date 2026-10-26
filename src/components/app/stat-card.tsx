import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TONE_CHIP, type Tone } from "@/lib/tones";

const TONE_ACCENT: Record<"default" | "good" | "warn" | "bad", Tone> = { default: "indigo", good: "emerald", warn: "amber", bad: "rose" };

/**
 * A figure with its label, a coloured icon chip and an optional hint line.
 * `accent` picks the chip colour (defaults from the tone); `href` makes the whole card a link.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  accent,
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
  accent?: Tone;
  href?: string;
  className?: string;
}) {
  const card = (
    <Card size="sm" className={cn("h-full gap-1.5 px-3.5 sm:px-4", href && "transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span className="line-clamp-2 leading-snug">{label}</span>
        {icon && <span className={cn("-mt-0.5 -mr-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4", TONE_CHIP[accent ?? TONE_ACCENT[tone]])}>{icon}</span>}
      </div>
      <div
        className={cn(
          "text-xl leading-tight font-bold tracking-tight tabular-nums sm:text-2xl",
          tone === "good" && "text-success",
          tone === "warn" && "text-warning-ink",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-xs leading-snug text-muted-foreground">{hint}</div>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
      {card}
    </Link>
  ) : (
    card
  );
}
