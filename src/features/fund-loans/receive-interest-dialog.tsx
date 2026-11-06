"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, HandCoins, Loader2, NotebookPen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/app/field";
import { IconChip } from "@/components/app/bits";
import { AmountInput, ChoicePills, FormNote, MethodField, MoreOptions, SubmitButton } from "@/components/app/form-bits";
import { apiRead } from "@/app/actions/api";
import { apiMutate } from "@/lib/api-client";
import { newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useLang, useT } from "@/i18n/client";
import { monthName } from "@/i18n/core";
import { useMoney } from "@/components/app/currency";

interface Summary {
  member: { _id: string; name: string };
  loans: { _id: string; number: string; interestDuePaise: number; unpaidMonths: string[]; outstandingPaise: number; monthlyRate: string }[];
  interestDuePaise: number;
  advancePaise: number;
  toPayPaise: number;
  maxPaise: number;
}

/** Round up to a convenient amount (₹187.50 → ₹190, ₹200). */
const roundUp = (paise: number, step: number) => Math.ceil(paise / step) * step;

/**
 * Receive interest for all of a member's upads at once: oldest month first, one receipt.
 * A round amount is fine — anything above what's due is kept as their advance.
 */
export function ReceiveInterestDialog({ memberId, memberName, size = "sm", variant = "outline", label, methods = ["cash"] }: { memberId: string; memberName: string; size?: "xs" | "sm" | "default"; variant?: "default" | "outline"; label?: string; methods?: string[] }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Summary | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [method, setMethod] = useState("cash");
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(() => newIdempotencyKey("ui"));
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    apiRead<Summary>(`/orgs/${orgId}/members/${memberId}/upad-interest`).then((r) => {
      if (!alive) return;
      if (!r.ok) return setError(r.error);
      setData(r.data);
      setAmount(r.data.toPayPaise ? paiseToRupeeInput(r.data.toPayPaise) : "");
    });
    return () => {
      alive = false;
    };
  }, [open, orgId, memberId]);

  const paise = useMemo(() => {
    const p = rupees.safeParse(amount);
    return p.success ? Math.round(Number(p.data) * 100) : 0;
  }, [amount]);
  const extra = data ? Math.max(0, paise - data.toPayPaise) : 0;
  const chips = useMemo(() => {
    if (!data || data.toPayPaise <= 0) return [];
    const due = data.toPayPaise;
    const vals = [...new Set([due, roundUp(due, 1000), roundUp(due, 5000), roundUp(due, 10000)])].filter((v) => v <= data.maxPaise);
    return vals.map((v) => ({ value: paiseToRupeeInput(v), label: v === due ? `${t("collect.full")} · ${money.short(v)}` : money.short(v) }));
  }, [data, money, t]);

  const reset = () => {
    setData(null);
    setAmount("");
    setDate(todayISO());
    setNote("");
    setMethod("cash");
    setError(null);
    setKey(newIdempotencyKey("ui"));
  };

  const save = () => {
    const a = rupees.safeParse(amount);
    if (!a.success) return setError(a.error.issues[0].message);
    start(async () => {
      setError(null);
      const res = await apiMutate({ path: `/orgs/${orgId}/members/${memberId}/upad-interest`, body: { amount: a.data, date, method, note: note || undefined, idempotencyKey: key } });
      if (!res.ok) return setError(res.fieldErrors?.amount ?? res.error);
      toast.success(t("upad.interestRecorded", { name: memberName }));
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)} aria-label={`${label ?? t("upad.receiveAll")} — ${memberName}`}>
        <HandCoins /> {label ?? t("upad.receiveAll")}
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
              <DialogTitle>{t("upad.receiveAllTitle", { name: memberName })}</DialogTitle>
              <DialogDescription>{t("upad.receiveAllDesc", { name: memberName })}</DialogDescription>
            </div>
          </DialogHeader>
          {!data ? (
            error ? (
              <FormError message={error} />
            ) : (
              <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("upad.loadingDue")}
              </p>
            )
          ) : (
            <form
              noValidate
              className="grid grid-cols-1 gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <FormError message={error} />
              <div className="rounded-xl bg-muted/50 p-3 text-sm">
                {data.loans.map((l) => (
                  <div key={l._id} className="flex items-baseline justify-between gap-3 py-0.5">
                    <span className="min-w-0">
                      <span className="font-mono text-xs">{l.number}</span>
                      {l.unpaidMonths.length > 0 && <span className="text-xs text-muted-foreground"> · {l.unpaidMonths.map((m) => monthName(lang, m, "short")).join(", ")}</span>}
                    </span>
                    <span className="tabular-nums">{money.fmt(l.interestDuePaise)}</span>
                  </div>
                ))}
                {data.advancePaise > 0 && (
                  <div className="flex items-baseline justify-between gap-3 py-0.5 text-emerald-700 dark:text-emerald-300">
                    <span className="text-xs">{t("upad.advanceUsedFirst")}</span>
                    <span className="tabular-nums">− {money.fmt(Math.min(data.advancePaise, data.interestDuePaise))}</span>
                  </div>
                )}
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-foreground/10 pt-1.5 font-semibold">
                  <span>{t("upad.toPay")}</span>
                  <span className="tabular-nums">{money.fmt(data.toPayPaise)}</span>
                </div>
              </div>
              {data.toPayPaise === 0 && data.interestDuePaise > 0 && <FormNote tone="good">{t("upad.nothingToPay")}</FormNote>}
              <Field label={t("upad.interestReceivedRs")} htmlFor="ri-amt">
                <AmountInput id="ri-amt" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              {chips.length > 1 && <ChoicePills label={t("collect.shortcuts")} value={amount} onChange={setAmount} options={chips} />}
              {extra > 0 ? (
                <FormNote tone="good">
                  <Sparkles className="mr-1 inline size-3.5 align-text-bottom" />
                  {t("upad.keptAsAdvance", { amount: money.fmt(extra) })}
                </FormNote>
              ) : (
                <FormNote>{t("upad.advanceWhy")}</FormNote>
              )}
              <Field label={t("common.dateReceived")} htmlFor="ri-date">
                <Input id="ri-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <MethodField methods={methods} value={method} onChange={setMethod} label={t("pay.paidBy")} cashLabel={t("pay.method.cash")} upiLabel={t("pay.method.upi")} />
              <MoreOptions bare icon={<NotebookPen />} title={t("common.noteOptional")}>
                <Field label={t("common.noteOptional")} htmlFor="ri-note">
                  <Input id="ri-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
              </MoreOptions>
              <SubmitButton pending={pending} icon={<CheckCircle2 />}>
                {t("upad.recordPaid")}
              </SubmitButton>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
