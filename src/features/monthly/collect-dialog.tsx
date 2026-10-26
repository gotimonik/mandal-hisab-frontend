"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/app/field";
import { Money } from "@/components/app/money";
import { apiMutate } from "@/app/actions/api";
import { newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";

/**
 * Quick cash entry for one member's month. Defaults to the full outstanding amount; a smaller
 * amount is recorded as a part payment. If the same amount was already recorded on the same
 * date the server asks for confirmation (possible double entry).
 */
export function CollectDialog({ installmentId, memberName, period, outstandingPaise, size = "xs" }: { installmentId: string; memberName: string; period: string; outstandingPaise: number; size?: "xs" | "sm" }) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(paiseToRupeeInput(outstandingPaise));
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [key, setKey] = useState(() => newIdempotencyKey("col"));
  const [error, setError] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reset = () => {
    setAmount(paiseToRupeeInput(outstandingPaise));
    setDate(todayISO());
    setNote("");
    setError(null);
    setDupWarning(null);
    setKey(newIdempotencyKey("col"));
  };

  const save = (confirmDuplicate: boolean) => {
    const parsed = rupees.safeParse(amount);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    start(async () => {
      setError(null);
      const res = await apiMutate({ path: `/orgs/${orgId}/monthly/collect`, body: { installmentId, amount: parsed.data, date, note: note || undefined, idempotencyKey: key, confirmDuplicate } });
      if (!res.ok) {
        if (res.code === "DUPLICATE_SUSPECTED") return setDupWarning(res.error);
        return setError(res.fieldErrors?.amount ?? res.error);
      }
      toast.success(`Cash received from ${memberName}`);
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)} aria-label={`Collect from ${memberName}`}>
        <HandCoins /> Collect
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cash from {memberName}</DialogTitle>
            <DialogDescription>
              {period} · outstanding <Money paise={outstandingPaise} className="font-medium text-foreground" />
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save(false);
            }}
          >
            <FormError message={error} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)" htmlFor="col-amt" hint="Less than due = part payment">
                <Input id="col-amt" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Date received" htmlFor="col-date">
                <Input id="col-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
            <Field label="Note (optional)" htmlFor="col-note">
              <Input id="col-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            {dupWarning ? (
              <div role="alert" className="flex flex-col gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
                <p>{dupWarning}</p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setDupWarning(null)} disabled={pending}>
                    Go back
                  </Button>
                  <Button type="button" size="sm" onClick={() => save(true)} disabled={pending}>
                    {pending && <Loader2 className="animate-spin" />} Yes, record a second payment
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} Record cash received
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
