"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, HandCoins, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/app/field";
import { apiMutate } from "@/app/actions/api";
import { formatDate, newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupeesOrZero } from "@/lib/schemas";
import { useT } from "@/i18n/client";
import { useMoney } from "@/components/app/currency";
import { IconChip } from "@/components/app/bits";
import { AmountInput, ChoicePills, FormNote, MoreOptions, SubmitButton } from "@/components/app/form-bits";

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
  const money = useMoney();
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
          <DialogHeader className="flex-row items-start gap-3">
            <IconChip tone="orange" className="mt-0.5">
              <HandCoins />
            </IconChip>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>
                {memberName} · {number}
              </DialogTitle>
              <DialogDescription>{t("upad.payDesc", { interest: money.fmt(interestDuePaise), outstanding: money.fmt(outstandingPaise) })}</DialogDescription>
            </div>
          </DialogHeader>
          <form
            noValidate
            className="grid grid-cols-1 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <FormError message={error} />
            {reported.length > 0 && (
              <FormNote tone="warn" className="leading-relaxed">
                <b>{t("upad.reportedAlready", { name: memberName })}</b>{" "}
                {reported.map((r, k) => (
                  <span key={k}>
                    {k > 0 && "; "}
                    {[r.interestPaise ? t("upad.recInterest", { amount: money.fmt(r.interestPaise) }) : "", r.principalPaise ? t("upad.recUpad", { amount: money.fmt(r.principalPaise) }) : ""].filter(Boolean).join(" + ")} ({r.method}, {formatDate(r.date)})
                  </span>
                ))}
                . {t("upad.reportedHint")}
              </FormNote>
            )}
            <Field label={t("upad.interestReceivedRs")} htmlFor="lp-int" hint={t("upad.oldestFirst")}>
              <AmountInput id="lp-int" value={interest} onChange={(e) => setInterest(e.target.value)} />
            </Field>
            {interestDuePaise > 0 && (
              <ChoicePills
                label={t("collect.shortcuts")}
                value={interest}
                onChange={setInterest}
                options={[
                  { value: paiseToRupeeInput(interestDuePaise), label: `${t("collect.full")} · ${money.short(interestDuePaise)}` },
                  { value: "0", label: money.short(0) },
                ]}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("upad.returnedRs")} htmlFor="lp-pr" hint={t("common.optional")}>
                <Input id="lp-pr" inputMode="decimal" placeholder="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
              </Field>
              <Field label={t("common.dateReceived")} htmlFor="lp-date">
                <Input id="lp-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
            {outstandingPaise > 0 && <ChoicePills label={t("upad.returnedRs")} value={principal} onChange={setPrincipal} options={[{ value: paiseToRupeeInput(outstandingPaise), label: `${t("collect.full")} · ${money.short(outstandingPaise)}` }]} />}
            <MoreOptions bare icon={<NotebookPen />} title={t("common.noteOptional")}>
              <Field label={t("common.noteOptional")} htmlFor="lp-note" className="sm:col-span-2">
                <Input id="lp-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </MoreOptions>
            <FormNote>{t("upad.payNote")}</FormNote>
            <SubmitButton pending={pending} icon={<CheckCircle2 />}>
              {t("upad.recordPaid")}
            </SubmitButton>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
