import type { ReactNode } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Plain GET form: filters live in the URL so they survive refresh and can be shared. */
export function FilterBar({ children, resetHref }: { children: ReactNode; resetHref: string }) {
  return (
    <form method="get" className="no-print mb-4 grid grid-cols-2 items-end gap-2 rounded-2xl bg-card p-3 shadow-card ring-1 ring-foreground/[0.06] sm:flex sm:flex-wrap sm:bg-transparent sm:p-0 sm:shadow-none sm:ring-0">
      {children}
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" className="flex-1 sm:flex-none">
          Apply
        </Button>
        <Link href={resetHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Reset
        </Link>
      </div>
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
