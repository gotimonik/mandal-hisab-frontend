import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_CHIP, avatarTone, initials, type Tone } from "@/lib/tones";

/** Rounded coloured square holding an icon. */
export function IconChip({ tone, children, size = "md", className }: { tone: Tone; children: ReactNode; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        size === "sm" && "size-8 rounded-lg [&_svg]:size-4",
        size === "md" && "size-10 rounded-xl [&_svg]:size-5",
        size === "lg" && "size-12 rounded-2xl [&_svg]:size-6",
        TONE_CHIP[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Initials in a colour picked from the name — makes long member lists easy to scan. */
export function MemberAvatar({ name, size = "md", className }: { name: string; size?: "sm" | "md"; className?: string }) {
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", size === "md" ? "size-10 text-sm" : "size-8 text-xs", TONE_CHIP[avatarTone(name)], className)}>
      {initials(name)}
    </span>
  );
}

export function ProgressBar({ value, className, barClassName, label }: { value: number; className?: string; barClassName?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full bg-primary transition-[width] duration-500", barClassName)} style={{ width: `${v}%` }} />
    </div>
  );
}

/** A tappable row: icon chip · title + subtitle · trailing value · chevron. */
export function ActionRow({ href, tone, icon, title, subtitle, trailing }: { href: string; tone: Tone; icon: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60 active:bg-muted">
      <IconChip tone={tone}>{icon}</IconChip>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      {trailing}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-2 flex items-center justify-between gap-2 px-0.5", className)}>
      <h2 className="text-base font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function CountPill({ n, tone = "amber" }: { n: ReactNode; tone?: Tone }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums", TONE_CHIP[tone])}>{n}</span>;
}
