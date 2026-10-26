"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiMutate } from "@/app/actions/api";

export interface ActionButtonProps {
  path: string;
  method?: "POST" | "PATCH";
  body?: Record<string, unknown>;
  children: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "xs" | "lg";
  successMessage?: string;
  redirectTo?: string;
  className?: string;
  /** Show a confirmation dialog (required for sensitive operations). */
  confirm?: { title: string; description?: string; confirmLabel?: string; reason?: "required" | "optional"; reasonLabel?: string; destructive?: boolean };
}

export function ActionButton({ path, method = "POST", body, children, variant = "outline", size = "sm", successMessage = "Done", redirectTo, confirm, className }: ActionButtonProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = () =>
    start(async () => {
      setError(null);
      const payload = { ...(body ?? {}), ...(confirm?.reason ? { reason: reason.trim() || undefined } : {}) };
      const res = await apiMutate({ path, method, body: payload });
      if (!res.ok) {
        const msg = res.fieldErrors?.reason ?? res.error;
        if (open) setError(msg);
        else toast.error(msg);
        return;
      }
      setOpen(false);
      setReason("");
      toast.success(successMessage);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });

  if (!confirm) {
    return (
      <Button variant={variant} size={size} disabled={pending} onClick={run} className={className}>
        {pending && <Loader2 className="animate-spin" />}
        {children}
      </Button>
    );
  }
  const needReason = confirm.reason === "required";
  return (
    <>
      <Button variant={variant} size={size} disabled={pending} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm.title}</DialogTitle>
            {confirm.description && <DialogDescription>{confirm.description}</DialogDescription>}
          </DialogHeader>
          {confirm.reason && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="action-reason">{confirm.reasonLabel ?? (needReason ? "Reason (required)" : "Reason (optional)")}</Label>
              <Textarea id="action-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant={confirm.destructive ? "destructive" : "default"} onClick={run} disabled={pending || (needReason && reason.trim().length < 3)}>
              {pending && <Loader2 className="animate-spin" />}
              {confirm.confirmLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
