"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/app/field";
import { apiMutate } from "@/app/actions/api";
import { formatDate, formatINR, newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupeesOrZero } from "@/lib/schemas";
import { useT } from "@/i18n/client";

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
  label: labelProp,
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
  const t = useT();
  const label = labelProp ?? t("upad.receivePayment");
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
    if (!i.success) return setError(t("upad.vInterest", { msg: i.error.issues[0].message }));
    if (!p.success) return setError(t("upad.vUpadAmt", { msg: p.error.issues[0].message }));
    if (Number(i.data) <= 0 && Number(p.data) <= 0) return setError(t("upad.vEnterAny"));
    start(async () => {
      setError(null);
      const res = await apiMutate<{ settledClaimId: string | null }>({ path: `/orgs/${orgId}/fund-loans/${loanId}/payments`, body: { interestAmount: i.data, principalAmount: p.data, date, note: note || undefined, idempotencyKey: key } });
      if (!res.ok) return setError(res.fieldErrors?.interestAmount ?? res.error);
      toast.success(t("upad.paymentRecorded", { name: memberName }), res.data.settledClaimId ? { description: t("upad.matchedClaim") } : undefined);
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
              {t("upad.payDesc", { interest: formatINR(interestDuePaise), outstanding: formatINR(outstandingPaise) })}
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
                <b>{t("upad.reportedAlready", { name: memberName })}</b>{" "}
                {reported.map((r, k) => (
                  <span key={k}>
                    {k > 0 && "; "}
                    {[r.interestPaise ? t("upad.recInterest", { amount: formatINR(r.interestPaise) }) : "", r.principalPaise ? t("upad.recUpad", { amount: formatINR(r.principalPaise) }) : ""].filter(Boolean).join(" + ")} ({r.method}, {formatDate(r.date)})
                  </span>
                ))}
                . {t("upad.reportedHint")}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("upad.interestReceivedRs")} htmlFor="lp-int" hint={t("upad.oldestFirst")}>
                <Input id="lp-int" inputMode="decimal" value={interest} onChange={(e) => setInterest(e.target.value)} />
              </Field>
              <Field label={t("upad.returnedRs")} htmlFor="lp-pr" hint={t("common.optional")}>
                <Input id="lp-pr" inputMode="decimal" placeholder="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
              </Field>
            </div>
            <Field label={t("common.dateReceived")} htmlFor="lp-date">
              <Input id="lp-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t("common.noteOptional")} htmlFor="lp-note">
              <Input id="lp-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <p className="text-xs text-muted-foreground">{t("upad.payNote")}</p>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} {t("upad.recordPaid")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
