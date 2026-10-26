"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/app/field";
import { Money } from "@/components/app/money";
import { apiMutate } from "@/app/actions/api";
import { formatDate, formatINR, newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupeesOrZero } from "@/lib/schemas";

/**
 * Record money received on a fund loan: the interest (oldest unpaid month first) and/or part of
 * the loan amount itself. Interest is shared among all members' balances.
 */
export function LoanPaymentDialog({
  loanId,
  number,
  memberName,
  interestDuePaise,
  outstandingPaise,
  label = "Receive payment",
  size = "sm",
  variant = "default",
  reported = [],
}: {
  loanId: string;
  number: string;
  memberName: string;
  interestDuePaise: number;
  outstandingPaise: number;
  label?: string;
  size?: "xs" | "sm" | "default";
  variant?: "default" | "outline";
  /** payments the member reported with "I have paid" that are waiting for verification */
  reported?: { interestPaise: number; principalPaise: number; method: string; date: string }[];
}) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [interest, setInterest] = useState(paiseToRupeeInput(interestDuePaise));
  const [principal, setPrincipal] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(() => newIdempotencyKey("flp"));
  const [pending, start] = useTransition();

  const reset = () => {
    setInterest(paiseToRupeeInput(interestDuePaise));
    setPrincipal("");
    setDate(todayISO());
    setNote("");
    setError(null);
    setKey(newIdempotencyKey("flp"));
  };

  const save = () => {
    const i = rupeesOrZero.safeParse(interest);
    const p = rupeesOrZero.safeParse(principal);
    if (!i.success) return setError(`Interest: ${i.error.issues[0].message}`);
    if (!p.success) return setError(`Upad amount: ${p.error.issues[0].message}`);
    if (Number(i.data) <= 0 && Number(p.data) <= 0) return setError("Enter the interest and/or upad amount received");
    start(async () => {
      setError(null);
      const res = await apiMutate<{ settledClaimId: string | null }>({ path: `/orgs/${orgId}/fund-loans/${loanId}/payments`, body: { interestAmount: i.data, principalAmount: p.data, date, note: note || undefined, idempotencyKey: key } });
      if (!res.ok) return setError(res.fieldErrors?.interestAmount ?? res.error);
      toast.success(`Payment from ${memberName} recorded`, res.data.settledClaimId ? { description: "It matched the payment they reported, so that one is closed too." } : undefined);
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)} aria-label={`${label} — ${memberName} ${number}`}>
        {label}
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
            <DialogTitle>
              {memberName} · {number}
            </DialogTitle>
            <DialogDescription>
              Interest due <Money paise={interestDuePaise} className="font-medium text-foreground" /> · upad outstanding <Money paise={outstandingPaise} className="font-medium text-foreground" />
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <FormError message={error} />
            {reported.length > 0 && (
              <div className="rounded-xl bg-amber-500/12 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200" role="note">
                <b>{memberName} already reported paying</b>{" "}
                {reported.map((r, k) => (
                  <span key={k}>
                    {k > 0 && "; "}
                    {[r.interestPaise ? `${formatINR(r.interestPaise)} interest` : "", r.principalPaise ? `${formatINR(r.principalPaise)} upad` : ""].filter(Boolean).join(" + ")} ({r.method}, {formatDate(r.date)})
                  </span>
                ))}
                . If this is that money, use <b>Verify</b> under Payments to verify instead — or record the same amount here and it will be matched automatically.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Interest received (₹)" htmlFor="lp-int" hint="Oldest month first">
                <Input id="lp-int" inputMode="decimal" value={interest} onChange={(e) => setInterest(e.target.value)} />
              </Field>
              <Field label="Upad amount returned (₹)" htmlFor="lp-pr" hint="Optional">
                <Input id="lp-pr" inputMode="decimal" placeholder="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
              </Field>
            </div>
            <Field label="Date received" htmlFor="lp-date">
              <Input id="lp-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Note (optional)" htmlFor="lp-note">
              <Input id="lp-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <p className="text-xs text-muted-foreground">The interest is added to every member&apos;s balance in proportion to their savings. Returning part of the upad lowers interest from next month.</p>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Record as paid
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
