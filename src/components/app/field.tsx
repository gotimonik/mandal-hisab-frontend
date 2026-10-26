import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ label, htmlFor, error, hint, children, className }: { label: string; htmlFor?: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}
