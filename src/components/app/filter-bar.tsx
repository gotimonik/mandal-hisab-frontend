import type { ReactNode } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Plain GET form: filters live in the URL so they survive refresh and can be shared. */
export function FilterBar({ children, resetHref }: { children: ReactNode; resetHref: string }) {
  return (
    <form method="get" className="no-print mb-4 grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap">
      {children}
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm">
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
