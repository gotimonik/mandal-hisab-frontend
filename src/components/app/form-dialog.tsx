"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CloseCtx = createContext<() => void>(() => {});
export const useDialogClose = () => useContext(CloseCtx);

export function FormDialog({
  trigger,
  triggerVariant = "default",
  triggerSize = "default",
  title,
  description,
  children,
  wide = false,
}: {
  trigger: ReactNode;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  triggerSize?: "default" | "sm" | "xs" | "lg";
  title: string;
  description?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} size={triggerSize} />}>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-h-[90dvh] overflow-y-auto", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <CloseCtx.Provider value={() => setOpen(false)}>{open && children}</CloseCtx.Provider>
      </DialogContent>
    </Dialog>
  );
}
