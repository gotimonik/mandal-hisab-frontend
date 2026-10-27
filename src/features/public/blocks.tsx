import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconChip } from "@/components/app/bits";
import type { Tone } from "@/lib/tones";
import { isPlaceholder } from "@/config/site";

/** Page-width wrapper used by every public page. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

/** A vertical band of the page. */
export function Section({ id, children, className, tinted = false }: { id?: string; children: ReactNode; className?: string; tinted?: boolean }) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-10 sm:py-20", tinted && "bg-secondary/40", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, center = false, className }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; center?: boolean; className?: string }) {
  return (
    <div className={cn("mb-5 max-w-2xl sm:mb-10", center && "mx-auto text-center", className)}>
      {eyebrow && <p className="mb-2 text-xs font-bold tracking-wider text-primary uppercase">{eyebrow}</p>}
      <h2 className="text-[1.4rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description && <p className="mt-2 text-sm text-pretty text-muted-foreground sm:mt-3 sm:text-lg">{description}</p>}
    </div>
  );
}

/** Coloured hero band at the top of inner pages (About, Contact, FAQ …). */
export function PageHero({ eyebrow, title, description, children, tone = "indigo" }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; children?: ReactNode; tone?: "indigo" | "green" | "warm" }) {
  const bg = tone === "green" ? "bg-hero-green" : tone === "warm" ? "bg-hero-warm" : "bg-hero";
  return (
    <section className={cn("relative overflow-hidden text-white", bg)}>
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-white/10" />
      <Container className="relative py-10 sm:py-20">
        {eyebrow && <p className="mb-2 text-xs font-bold tracking-wider text-white/80 uppercase">{eyebrow}</p>}
        <h1 className="max-w-3xl text-[1.85rem] leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm text-pretty text-white/85 sm:mt-4 sm:text-lg">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </section>
  );
}

/** Icon + title + text card, in the app's card style. */
export function FeatureCard({ icon, tone, title, children, className }: { icon: ReactNode; tone: Tone; title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full flex-col gap-3 rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06]", className)}>
      <IconChip tone={tone}>{icon}</IconChip>
      <h3 className="text-base font-bold">{title}</h3>
      <div className="text-sm text-pretty text-muted-foreground">{children}</div>
    </div>
  );
}

/** Long-form text (legal pages): readable line length and spacing. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-3xl text-[0.95rem] leading-7 text-foreground/90 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Dev-only tag beside a value that still needs filling in src/config/site.ts. */
export function PlaceholderTag({ value }: { value: string | null | undefined }) {
  if (process.env.NODE_ENV === "production" || !isPlaceholder(value)) return null;
  return <span className="ml-1.5 rounded border border-dashed border-amber-500 px-1 align-middle text-[10px] font-semibold text-amber-700 dark:text-amber-300">placeholder</span>;
}
