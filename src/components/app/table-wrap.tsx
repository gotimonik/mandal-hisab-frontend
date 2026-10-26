import type { ReactNode } from "react";

/** Card-style, horizontally scrollable table container that works at phone width. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl bg-card shadow-card ring-1 ring-foreground/[0.06]">{children}</div>;
}
