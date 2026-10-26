"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CloseCtx = createContext<() => void>(() => {});
export const useDialogClose = () => useContext(CloseCtx);

/** Remove a one-shot query param (e.g. ?new=1 from a quick action) so a refresh doesn't reopen the dialog. */
export function dropQueryParam(name: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(name)) return;
  url.searchParams.delete(name);
  window.history.replaceState(window.history.state, "", url.pathname + (url.search ? url.search : "") + url.hash);
}

export function FormDialog({
  trigger,
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName,
  title,
  description,
  children,
  wide = false,
  defaultOpen = false,
  openParam = "new",
}: {
  trigger: ReactNode;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  triggerSize?: "default" | "sm" | "xs" | "lg";
  triggerClassName?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  /** Open straight away — used by the quick-action links (…?new=1). */
  defaultOpen?: boolean;
  /** Query param that opened it; removed from the URL when the dialog closes. */
  openParam?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const change = (o: boolean) => {
    setOpen(o);
    if (!o && defaultOpen) dropQueryParam(openParam);
  };
  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogTrigger render={<Button variant={triggerVariant} size={triggerSize} className={triggerClassName} />}>{trigger}</DialogTrigger>
      <DialogContent className={cn(wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <CloseCtx.Provider value={() => change(false)}>{open && children}</CloseCtx.Provider>
      </DialogContent>
    </Dialog>
  );
}
