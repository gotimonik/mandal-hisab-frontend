import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint, icon, tone = "default" }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: "default" | "good" | "warn" | "bad" }) {
  return (
    <Card size="sm" className="gap-1 px-4">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span className="truncate">{label}</span>
        {icon && <span className="text-muted-foreground/70 [&_svg]:size-4">{icon}</span>}
      </div>
      <div
        className={cn(
          "text-lg font-semibold tabular-nums sm:text-xl",
          tone === "good" && "text-success",
          tone === "warn" && "text-warning",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
