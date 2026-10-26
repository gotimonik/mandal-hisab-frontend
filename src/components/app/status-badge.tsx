"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { en } from "@/i18n/dict/en";

const TONES: Record<string, string> = {
  paid: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  verified: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  approved: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  active: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  valid: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  closed: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  due: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  applied: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  partially_paid: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  upcoming: "bg-secondary text-secondary-foreground",
  draft: "bg-secondary text-secondary-foreground",
  overdue: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  rejected: "bg-destructive/12 text-destructive",
  suspended: "bg-destructive/12 text-destructive",
  reversed: "bg-destructive/12 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
  waived: "bg-muted text-muted-foreground",
  deferred: "bg-muted text-muted-foreground",
  paused: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  inactive: "bg-muted text-muted-foreground",
  left: "bg-muted text-muted-foreground",
  deactivated: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const t = useT();
  const known = status in en.status;
  return (
    <Badge variant="secondary" className={cn("capitalize", TONES[status], className)}>
      {known ? t(`status.${status as keyof typeof en.status}`) : status.replace(/_/g, " ")}
    </Badge>
  );
}
