"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, CheckCircle2, Eye, Loader2, MoreHorizontal, PauseCircle, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiMutate } from "@/lib/api-client";

type Action = "approve" | "suspend" | "reactivate" | "archive";

/** What each status change says, and whether it asks first (with a reason). */
const ACTIONS: Record<Action, { label: string; done: string; icon: React.ReactNode; confirm?: { title: (n: string) => string; description: string; label: string; destructive?: boolean } }> = {
  approve: { label: "Approve", done: "Organization approved", icon: <CheckCircle2 /> },
  reactivate: { label: "Reactivate", done: "Organization reactivated", icon: <RotateCcw /> },
  suspend: {
    label: "Suspend",
    done: "Organization suspended",
    icon: <PauseCircle />,
    confirm: { title: (n) => `Suspend ${n}?`, description: "Its users lose access until it is reactivated.", label: "Suspend", destructive: true },
  },
  archive: {
    label: "Archive",
    done: "Organization archived",
    icon: <Archive />,
    confirm: { title: (n) => `Archive ${n}?`, description: "Archived organizations become read-only.", label: "Archive" },
  },
};

/** Which status changes make sense from a status. */
function available(status: string): Action[] {
  if (status === "pending") return ["approve", "suspend", "archive"];
  if (status === "active") return ["suspend", "archive"];
  if (status === "suspended") return ["reactivate", "archive"];
  return ["reactivate"]; // archived
}

/**
 * A Mandal's actions on the platform panel: Open (read-only look inside) as a button, and the
 * status changes in a "⋯" menu so the table stays narrow. Suspend / Archive ask for a reason.
 */
export function PlatformOrgActions({ id, name, status }: { id: string; name: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: Action) =>
    start(async () => {
      setError(null);
      const res = await apiMutate({ path: `/platform/organizations/${id}`, method: "PATCH", body: { action, ...(ACTIONS[action].confirm ? { reason: reason.trim() } : {}) } });
      if (!res.ok) {
        const msg = res.fieldErrors?.reason ?? res.error;
        if (asking) setError(msg);
        else toast.error(msg);
        return;
      }
      setAsking(null);
      setReason("");
      toast.success(ACTIONS[action].done);
      router.refresh();
    });

  const pick = (action: Action) => {
    if (ACTIONS[action].confirm) {
      setError(null);
      setAsking(action);
    } else run(action);
  };

  const c = asking ? ACTIONS[asking].confirm! : null;
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/org/${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        <Eye /> Open
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="px-2" aria-label={`More actions for ${name}`} disabled={pending} />}>
          {pending && !asking ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {available(status).map((a, i) => (
            <div key={a} className="contents">
              {a === "archive" && i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => pick(a)} className={a === "suspend" ? "text-destructive" : undefined}>
                {ACTIONS[a].icon} {ACTIONS[a].label}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!asking} onOpenChange={(o) => !o && !pending && setAsking(null)}>
        <DialogContent>
          {c && asking && (
            <>
              <DialogHeader>
                <DialogTitle>{c.title(name)}</DialogTitle>
                <DialogDescription>{c.description}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`reason-${id}`}>Reason (required)</Label>
                <Textarea id={`reason-${id}`} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setAsking(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button variant={c.destructive ? "destructive" : "default"} onClick={() => run(asking)} disabled={pending || reason.trim().length < 3}>
                  {pending && <Loader2 className="animate-spin" />}
                  {c.label}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
