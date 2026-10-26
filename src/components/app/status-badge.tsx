import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  paid: "bg-success/15 text-success",
  verified: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  valid: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
  pending: "bg-warning/20 text-foreground",
  due: "bg-warning/20 text-foreground",
  applied: "bg-warning/20 text-foreground",
  partially_paid: "bg-chart-3/15 text-chart-3",
  upcoming: "bg-secondary text-secondary-foreground",
  draft: "bg-secondary text-secondary-foreground",
  overdue: "bg-destructive/12 text-destructive",
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
  return (
    <Badge variant="secondary" className={cn("capitalize", TONES[status], className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
