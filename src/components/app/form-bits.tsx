"use client";

import type { ComponentProps, ReactNode } from "react";
import { Banknote, ChevronDown, Info, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";

/**
 * Shared building blocks for every form, so they all look the same as New loan /
 * Create Mandal / Collect hapta. Text is always passed in, so translated forms stay translated.
 */

/** A titled block of a full-page form: coloured icon, heading, optional line of help, then fields. */
export function FormSection({ icon, tone, title, description, children, className }: { icon: ReactNode; tone: Tone; title: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5", className)}>
      <div className="flex items-center gap-2.5">
        <IconChip tone={tone} size="sm">
          {icon}
        </IconChip>
        <div className="min-w-0">
          <h2 className="text-base font-bold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * Fold-away block for settings most people never change. `bare` drops the card look so it
 * can sit inside a dialog.
 */
export function MoreOptions({ icon, title, description, children, defaultOpen, bare = false, className }: { icon: ReactNode; title: ReactNode; description?: ReactNode; children: ReactNode; defaultOpen?: boolean; bare?: boolean; className?: string }) {
  return (
    <details className={cn("group [&_summary::-webkit-details-marker]:hidden", bare ? "rounded-2xl ring-1 ring-foreground/10" : "rounded-3xl bg-card shadow-card ring-1 ring-foreground/[0.06]", className)} open={defaultOpen || undefined}>
      <summary className={cn("flex cursor-pointer list-none items-center gap-2.5", bare ? "p-3" : "p-4 sm:px-5")}>
        <IconChip tone="slate" size="sm">
          {icon}
        </IconChip>
        <span className="min-w-0 flex-1">
          <span className={cn("block font-bold", bare ? "text-sm" : "text-base")}>{title}</span>
          {description && <span className="block text-xs text-muted-foreground">{description}</span>}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", bare ? "px-3 pb-3" : "px-4 pb-4 sm:px-5 sm:pb-5")}>{children}</div>
    </details>
  );
}

/** The big, centred money box used for the main amount of a form. Works with react-hook-form's register(). */
export function AmountInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input inputMode="decimal" autoComplete="off" className={cn("h-14 rounded-2xl text-center text-2xl font-bold tabular-nums md:h-12 md:rounded-2xl md:text-xl", className)} {...props} />;
}

/** Quick-pick pills (Full · Half, Cash · UPI, …). Pass the current value and a setter. */
export function ChoicePills<V extends string | number>({ options, value, onChange, label, className }: { options: { value: V; label: ReactNode; icon?: ReactNode }[]; value: V | undefined | null; onChange: (v: V) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors [&_svg]:size-3.5", on ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10 hover:bg-muted")}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Tinted note inside a form: info (default), warn, or good. */
export function FormNote({ tone = "info", children, className }: { tone?: "info" | "warn" | "good"; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-2xl px-3 py-2.5 text-xs [&>svg]:mt-px [&>svg]:size-4 [&>svg]:shrink-0",
        tone === "info" && "bg-sky-500/10 text-sky-800 dark:text-sky-200",
        tone === "warn" && "bg-amber-500/12 text-amber-900 dark:text-amber-200",
        tone === "good" && "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        className,
      )}
    >
      {tone === "warn" ? <TriangleAlert /> : <Info />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * The main submit button: full width and tall on phones. `page` makes it the
 * large rounded one used at the bottom of full-page forms.
 */
export function SubmitButton({ pending, icon, children, page = false, className, disabled, ...props }: ComponentProps<typeof Button> & { pending?: boolean; icon?: ReactNode; page?: boolean }) {
  return (
    <Button type="submit" size="lg" {...props} disabled={pending || disabled} className={cn("w-full", page && "h-12 rounded-2xl text-base sm:w-auto sm:self-start sm:px-6", className)}>
      {pending ? <Loader2 className="animate-spin" /> : icon} {children}
    </Button>
  );
}

/**
 * Shown where a payment-method picker used to be: MandalHisab records cash only for now.
 * Pair it with a hidden "method" input (value "cash") in register()-based forms.
 */
export function PaidInCash({ label = "Method", value = "Cash", className }: { label?: ReactNode; value?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      <span className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-800 md:h-9 md:rounded-lg dark:text-emerald-200">
        <Banknote className="size-4" /> {value}
      </span>
    </div>
  );
}
