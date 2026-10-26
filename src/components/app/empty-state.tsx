import type { ReactNode } from "react";

export function EmptyState({ title, description, action, icon }: { title: string; description?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/25 bg-secondary/30 px-6 py-12 text-center">
      {icon && <div className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-card text-primary shadow-card [&_svg]:size-7">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
