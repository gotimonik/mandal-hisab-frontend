import type { ReactNode } from "react";

/** Horizontally scrollable table container that works at phone width. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:rounded-xl sm:px-0 sm:ring-1 sm:ring-foreground/10">{children}</div>;
}
