import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pill links for a quick filter (All · Pending · Verified …); the current one is filled. Scrolls sideways on phones. */
export function ChipLinks({ items, current, label }: { items: { key: string; label: string; href: string; count?: number }[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="no-print scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {items.map((it) => {
        const on = it.key === current;
        return (
          <Link
            key={it.key}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors", on ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground")}
          >
            {it.label}
            {it.count !== undefined && <span className={cn("rounded-full px-1.5 text-xs tabular-nums", on ? "bg-white/20" : "bg-muted")}>{it.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
