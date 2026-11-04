import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const BG = { indigo: "bg-hero shadow-primary/20", green: "bg-hero-green shadow-emerald-600/15", warm: "bg-hero-warm shadow-orange-500/20" } as const;

/**
 * The coloured summary card at the top of a page (same look as the dashboard / Accounts):
 * a small label, one big figure, a line of context, and optional mini stats underneath.
 */
export function SummaryBand({ tone = "indigo", label, value, sub, stats, statsLabel, statsNote, icon, className }: { tone?: keyof typeof BG; label: ReactNode; value: ReactNode; sub?: ReactNode; stats?: { label: ReactNode; value: ReactNode }[]; /** what period the mini stats cover */ statsLabel?: ReactNode; statsNote?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <section className={cn("relative mb-5 overflow-hidden rounded-3xl p-5 text-white shadow-lg sm:p-6", BG[tone], className)}>
      <div className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/85">{label}</p>
          <div className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">{value}</div>
          {sub && <p className="mt-1 text-xs text-white/80">{sub}</p>}
        </div>
        {icon && <span className="shrink-0 opacity-80 [&_svg]:size-9">{icon}</span>}
      </div>
      {stats && stats.length > 0 && statsLabel && <p className="relative mt-4 -mb-2 text-[11px] font-bold tracking-wider text-white/85 uppercase">{statsLabel}</p>}
      {stats && stats.length > 0 && (
        <div className={cn("relative mt-4 grid gap-2", stats.length >= 3 ? "grid-cols-3" : "grid-cols-2")}>
          {stats.map((s, i) => (
            <div key={i} className="min-w-0 rounded-2xl bg-white/15 px-2.5 py-2 sm:px-3">
              <p className="line-clamp-2 text-[11px] leading-tight text-white/85">{s.label}</p>
              {/* never cut an amount off: shrink with the screen, and wrap a very long one */}
              <p className="text-[clamp(0.8rem,3.6vw,1rem)] leading-tight font-bold tracking-tight tabular-nums [overflow-wrap:anywhere] sm:text-base">{s.value}</p>
            </div>
          ))}
        </div>
      )}
      {statsNote && <p className="relative mt-2 text-[11px] leading-snug text-white/80">{statsNote}</p>}
    </section>
  );
}
