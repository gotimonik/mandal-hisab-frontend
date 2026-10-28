"use client";

import { Fragment, Suspense, useTransition, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { startNavigationProgress } from "@/components/app/navigation-progress";
import { cn } from "@/lib/utils";

/**
 * Turn a filter/search form into a URL and go there inside the app — no full page reload.
 * Empty fields are dropped and the page number resets, so filters stay shareable in the URL.
 */
export function useQueryForm() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const go = (href: string) => {
    startNavigationProgress();
    start(() => router.push(href, { scroll: false }));
  };
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget)) if (typeof v === "string" && v.trim() !== "" && k !== "page") q.set(k, v.trim());
    const s = q.toString();
    go(s ? `${pathname}?${s}` : pathname);
  };
  return { onSubmit, go, pending };
}

/** Re-mount the (uncontrolled) fields whenever the URL changes, so they always show the filters in effect. */
function KeyedByUrl({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  return <Fragment key={sp.toString()}>{children}</Fragment>;
}

/** Filters live in the URL so they survive refresh and can be shared; applying them never reloads the page. */
export function FilterBar({ children, resetHref }: { children: ReactNode; resetHref: string }) {
  const { onSubmit, go, pending } = useQueryForm();
  return (
    <form
      onSubmit={onSubmit}
      aria-busy={pending || undefined}
      className="no-print mb-4 grid grid-cols-2 items-end gap-2 rounded-2xl bg-card p-3 shadow-card ring-1 ring-foreground/[0.06] sm:flex sm:flex-wrap sm:bg-transparent sm:p-0 sm:shadow-none sm:ring-0"
    >
      <Suspense fallback={children}>
        <KeyedByUrl>{children}</KeyedByUrl>
      </Suspense>
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" className="flex-1 sm:flex-none" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Applying…" : "Apply"}
        </Button>
        <Button
          type="reset"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={(e) => {
            e.preventDefault();
            go(resetHref);
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}

/** A search box that searches inside the app (no reload). `hidden` keeps other filters (e.g. the status tab). */
export function SearchBox({ defaultValue, placeholder, label, buttonLabel, hidden = {}, className }: { defaultValue?: string; placeholder?: string; label: string; buttonLabel: string; hidden?: Record<string, string | undefined>; className?: string }) {
  const { onSubmit, pending } = useQueryForm();
  return (
    <form role="search" onSubmit={onSubmit} aria-busy={pending || undefined} className={cn("no-print flex gap-2", className)}>
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <div className="relative flex-1 sm:max-w-sm" key={defaultValue ?? ""}>
        {pending ? (
          <Loader2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input name="q" defaultValue={defaultValue} placeholder={placeholder} aria-label={label} className="pl-9" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {buttonLabel}
      </Button>
    </form>
  );
}

export function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground sm:w-40", className)}>
      {label}
      {children}
    </label>
  );
}
