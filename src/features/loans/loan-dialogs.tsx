"use client";

import { useT } from "@/i18n/client";
import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calculator, Check, CheckCircle2, HandCoins, Loader2, Percent, Send, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { apiRead } from "@/app/actions/api";
import { apiMutate } from "@/lib/api-client";
import { formatDate, newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";
import { AmountInput, ChoicePills, FormNote, MoreOptions, SubmitButton, MethodController } from "@/components/app/form-bits";

type Acc = { _id: string; name: string };

/* ----------------------------------------------- approve */
const ApproveSchema = z.object({ approvedAmount: rupees, rate: z.string().regex(/^(\d{1,3}(\.\d{1,4})?)?$/, "ld.v.invalidRate").optional(), tenure: z.coerce.number().int().min(0).max(360), notes: z.string().max(500).optional() });

function ApproveForm({ loanId, requestedPaise, canChangeRate, tenure, rate }: { loanId: string; requestedPaise: number; canChangeRate: boolean; tenure: number; rate: string }) {
  const money = useMoney();
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.input<typeof ApproveSchema>, unknown, z.output<typeof ApproveSchema>>({ resolver: zodResolver(ApproveSchema), defaultValues: { approvedAmount: paiseToRupeeInput(requestedPaise), rate: "", tenure, notes: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  const approvedAmount = useWatch({ control: form.control, name: "approvedAmount" });
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/loans/${loanId}/approve`, body: { approvedAmount: v.approvedAmount, rate: v.rate || undefined, tenure: v.tenure || undefined, notes: v.notes || undefined } }, { success: t("ld.approved"), onSuccess: close }))}
    >
      <FormError message={error} />
      <Field label={t("ld.approvedAmt")} htmlFor="ap-amt" error={e.approvedAmount?.message}>
        <AmountInput id="ap-amt" {...form.register("approvedAmount")} />
      </Field>
      <ChoicePills label={t("ld.shortcuts")} value={approvedAmount} onChange={(v) => form.setValue("approvedAmount", v, { shouldValidate: true })} options={[{ value: paiseToRupeeInput(requestedPaise), label: t("ld.requested", { amount: money.short(requestedPaise) }) }]} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {canChangeRate && (
          <Field label={t("ld.annualRate", { rate })} htmlFor="ap-rate" error={e.rate?.message}>
            <Input id="ap-rate" inputMode="decimal" placeholder={rate} {...form.register("rate")} />
          </Field>
        )}
        <Field label={t("ld.installments")} htmlFor="ap-ten">
          <Input id="ap-ten" type="number" min={1} {...form.register("tenure")} />
        </Field>
      </div>
      <MoreOptions bare icon={<SlidersHorizontal />} title={t("ld.notes")} description={t("ld.notesD")} defaultOpen={!!e.notes}>
        <Field label={t("ld.notes")} htmlFor="ap-notes" error={e.notes?.message} className="sm:col-span-2">
          <Input id="ap-notes" {...form.register("notes")} />
        </Field>
      </MoreOptions>
      <SubmitButton pending={pending} icon={<Check />}>
        {t("ld.approve")}
      </SubmitButton>
    </form>
  );
}

export function ApproveLoanDialog(props: { loanId: string; requestedPaise: number; canChangeRate: boolean; tenure: number; rate: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Check /> {t("ld.approve")}</>} title={t("ld.approveTitle")} icon={<Check />} tone="indigo">
      <ApproveForm {...props} />
    </FormDialog>
  );
}

/* ----------------------------------------------- disburse */
function addMonth(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function DisburseForm({ loanId, accounts, amountPaise }: { loanId: string; accounts: Acc[]; amountPaise: number }) {
  const { orgId } = useParams<{ orgId: string }>();
  const t = useT();
  const close = useDialogClose();
  const today = todayISO();
  const form = useForm({ defaultValues: { accountId: accounts[0]?._id ?? "", date: today, firstDueDate: addMonth(today), roundEmiToRupee: false } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form className="flex flex-col gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/loans/${loanId}/disburse`, body: v }, { success: t("ld.disbursed"), onSuccess: close }))}>
      <FormError message={error} />
      <div className="bg-hero rounded-2xl p-4 text-white">
        <p className="text-xs font-medium text-white/85">{t("ld.payOut")}</p>
        <Money paise={amountPaise} className="text-2xl font-extrabold tracking-tight tabular-nums" />
      </div>
      <Field label={t("ld.account")} htmlFor="db-acc">
        <NativeSelect id="db-acc" {...form.register("accountId")}>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("ld.disbDate")} htmlFor="db-date">
          <Input id="db-date" type="date" {...form.register("date")} />
        </Field>
        <Field label={t("ld.firstDue")} htmlFor="db-first">
          <Input id="db-first" type="date" {...form.register("firstDueDate")} />
        </Field>
      </div>
      <label className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm ring-1 ring-foreground/10">
        <Checkbox checked={form.watch("roundEmiToRupee")} onCheckedChange={(c) => form.setValue("roundEmiToRupee", !!c)} /> {t("ld.round")}
      </label>
      <SubmitButton pending={pending} icon={<Send />}>
        {t("ld.disburse")}
      </SubmitButton>
    </form>
  );
}

export function DisburseLoanDialog(props: { loanId: string; accounts: Acc[]; amountPaise: number }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Send /> {t("ld.disburse")}</>} title={t("ld.disburseTitle")} description={t("ld.disburseD")} icon={<Send />} tone="indigo">
      <DisburseForm {...props} />
    </FormDialog>
  );
}

/* ----------------------------------------------- repay (with preview) */
const RepaySchema = z.object({ amount: rupees, date: z.string().min(10), method: z.string(), reference: z.string().max(100).optional(), accountId: z.string().min(1), prepayment: z.boolean(), closeLoan: z.boolean() });

interface PreviewRes {
  preview: { principalPaise: number; interestPaise: number; penaltyPaise: number; prepaymentPaise: number; advancePaise: number; outstandingPrincipalAfterPaise: number; closed: boolean; allocations: { sequence: number; principalPaise: number; interestPaise: number; penaltyPaise: number }[] };
}
interface Quote {
  outstandingPrincipalPaise: number;
  unpaidDueInterestPaise: number;
  accruedInterestPaise: number;
  accruedDays: number;
  accruedFrom: string;
  penaltyPaise: number;
  waivedFutureInterestPaise: number;
  totalPaise: number;
  annualRate: string;
}

function RepayForm({ loanId, accounts, methods, nextDuePaise, allowPrepay }: { loanId: string; accounts: Acc[]; methods: string[]; nextDuePaise: number; allowPrepay: boolean }) {
  const money = useMoney();
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key, setKey] = useState(() => newIdempotencyKey("rep"));
  const form = useForm<z.infer<typeof RepaySchema>>({ resolver: zodResolver(RepaySchema), defaultValues: { amount: nextDuePaise ? paiseToRupeeInput(nextDuePaise) : "", date: todayISO(), method: methods[0], reference: "", accountId: accounts[0]?._id ?? "", prepayment: false, closeLoan: false } });
  const { submit, pending, error, setError } = useApiSubmit(form);
  const [preview, setPreview] = useState<PreviewRes["preview"] | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [calc, startCalc] = useTransition();
  const [closeLoan, prepayment, amount] = useWatch({ control: form.control, name: ["closeLoan", "prepayment", "amount"] });

  const doPreview = form.handleSubmit((v) =>
    startCalc(async () => {
      setError(null);
      const r = await apiMutate<PreviewRes>({ path: `/orgs/${orgId}/loans/${loanId}/repayments`, body: { ...v, reference: v.reference || undefined, idempotencyKey: key, dryRun: true } });
      if (!r.ok) return setError(r.error);
      setPreview(r.data.preview);
    }),
  );
  const fetchQuote = (date: string) =>
    startCalc(async () => {
      const r = await apiRead<Quote>(`/orgs/${orgId}/loans/${loanId}/closure-quote?date=${date}`);
      if (!r.ok) return setError(r.error);
      setQuote(r.data);
      form.setValue("amount", paiseToRupeeInput(r.data.totalPaise));
      setPreview(null);
    });

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) =>
        submit({ path: `/orgs/${orgId}/loans/${loanId}/repayments`, body: { ...v, reference: v.reference || undefined, idempotencyKey: key } }, { success: v.closeLoan ? t("ld.closed") : t("ld.recorded"), onSuccess: () => { setKey(newIdempotencyKey("rep")); close(); } }),
      )}
    >
      <FormError message={error} />
      <label className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm ring-1 ring-foreground/10">
        <Checkbox
          checked={closeLoan}
          onCheckedChange={(c) => {
            form.setValue("closeLoan", !!c);
            form.setValue("prepayment", false);
            setPreview(null);
            if (c) fetchQuote(form.getValues("date"));
            else setQuote(null);
          }}
        />{" "}
        {t("ld.closeEarly")}
      </label>
      {quote && closeLoan && (
        <FormNote className="text-sm [&>div]:flex-1">
          <p className="mb-1 font-semibold">{t("ld.closure")}</p>
          <Row k={t("ld.outPrincipal")} v={quote.outstandingPrincipalPaise} />
          <Row k={t("ld.unpaidDue")} v={quote.unpaidDueInterestPaise} />
          <Row k={t("ld.accrued", { from: formatDate(quote.accruedFrom), days: quote.accruedDays, rate: quote.annualRate })} v={quote.accruedInterestPaise} />
          {quote.penaltyPaise > 0 && <Row k={t("ld.lateFees")} v={quote.penaltyPaise} />}
          <Row k={t("ld.totalPay")} v={quote.totalPaise} bold />
          {quote.waivedFutureInterestPaise > 0 && <p className="mt-1 text-xs opacity-80">{t("ld.futureWaived", { amount: money.fmt(quote.waivedFutureInterestPaise) })}</p>}
        </FormNote>
      )}
      <Field label={t("ld.amount")} htmlFor="rp-amt" error={form.formState.errors.amount?.message}>
        <AmountInput id="rp-amt" readOnly={closeLoan} {...form.register("amount", { onChange: () => setPreview(null) })} />
      </Field>
      {!closeLoan && nextDuePaise > 0 && (
        <ChoicePills
          label={t("ld.shortcuts")}
          value={amount}
          onChange={(v) => {
            form.setValue("amount", v, { shouldValidate: true });
            setPreview(null);
          }}
          options={[{ value: paiseToRupeeInput(nextDuePaise), label: t("ld.nextInst", { amount: money.short(nextDuePaise) }) }]}
        />
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("ld.date")} htmlFor="rp-date">
          <Input id="rp-date" type="date" {...form.register("date", { onChange: (ev) => (closeLoan ? fetchQuote(ev.target.value) : setPreview(null)) })} />
        </Field>
        <MethodController control={form.control} methods={methods} />
        <Field label={t("ld.into")} htmlFor="rp-acc">
          <NativeSelect id="rp-acc" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <MoreOptions bare icon={<SlidersHorizontal />} title={t("ld.reference")} description={t("ld.refD")} defaultOpen={!!form.formState.errors.reference}>
        <Field label={t("ld.reference")} htmlFor="rp-ref" error={form.formState.errors.reference?.message} className="sm:col-span-2">
          <Input id="rp-ref" {...form.register("reference")} />
        </Field>
      </MoreOptions>
      {!closeLoan && allowPrepay && (
        <label className="flex items-start gap-2.5 rounded-2xl px-3 py-2.5 text-sm ring-1 ring-foreground/10">
          <Checkbox checked={prepayment} onCheckedChange={(c) => { form.setValue("prepayment", !!c); setPreview(null); }} />
          <span>{t("ld.prepay")}</span>
        </label>
      )}
      <Button type="button" variant="outline" onClick={doPreview} disabled={calc}>
        {calc ? <Loader2 className="animate-spin" /> : <Calculator />} {t("ld.previewBtn")}
      </Button>
      {preview && (
        <FormNote tone="good" className="text-sm [&>div]:flex-1">
          <div aria-live="polite">
          <Row k={t("ld.lateFees")} v={preview.penaltyPaise} />
          <Row k={t("ld.interest")} v={preview.interestPaise} />
          <Row k={t("ld.principalInst")} v={preview.principalPaise - preview.prepaymentPaise} />
          {preview.prepaymentPaise > 0 && <Row k={t("ld.prepayment")} v={preview.prepaymentPaise} />}
          {preview.advancePaise > 0 && <p className="text-xs opacity-80">{t("ld.advance")}</p>}
          <Row k={t("ld.after")} v={preview.outstandingPrincipalAfterPaise} bold />
          {preview.closed && <p className="mt-1 font-semibold">{t("ld.closesLoan")}</p>}
          </div>
        </FormNote>
      )}
      <SubmitButton pending={pending} disabled={pending || !preview} icon={<CheckCircle2 />}>
        {closeLoan ? t("ld.confirmClosure") : t("ld.confirmRepay")}
      </SubmitButton>
    </form>
  );
}

function Row({ k, v, bold }: { k: string; v: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "mt-1 border-t border-current/15 pt-1 font-semibold" : ""}`}>
      <span>{k}</span>
      <Money paise={v} />
    </div>
  );
}

export function RepayLoanDialog(props: { loanId: string; accounts: Acc[]; methods: string[]; nextDuePaise: number; allowPrepay: boolean }) {
  const t = useT();
  return (
    <FormDialog trigger={<><HandCoins /> {t("ld.recordRepay")}</>} title={t("ld.recordTitle")} icon={<HandCoins />} tone="emerald" description={t("ld.recordD")}>
      <RepayForm {...props} />
    </FormDialog>
  );
}

/* ----------------------------------------------- rate change */
const RateSchema = z.object({ rate: z.string().regex(/^\d{1,3}(\.\d{1,4})?$/, "ld.v.rate"), ratePeriod: z.enum(["annual", "monthly"]), effectiveFrom: z.string().min(10), reason: z.string().trim().min(3).max(500) });

function RateForm({ loanId }: { loanId: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const t = useT();
  const close = useDialogClose();
  const form = useForm<z.infer<typeof RateSchema>>({ resolver: zodResolver(RateSchema), defaultValues: { rate: "", ratePeriod: "annual", effectiveFrom: todayISO(), reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/loans/${loanId}/rate`, body: v }, { success: t("ld.rateChanged"), onSuccess: close }))}>
      <FormError message={error} />
      <FormNote>{t("ld.rateNote")}</FormNote>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("ld.newRate")} htmlFor="rc-rate" error={e.rate?.message}>
          <Input id="rc-rate" inputMode="decimal" {...form.register("rate")} />
        </Field>
        <Field label={t("ld.per")} htmlFor="rc-per">
          <NativeSelect id="rc-per" {...form.register("ratePeriod")}>
            <option value="annual">{t("ld.year")}</option>
            <option value="monthly">{t("ld.month")}</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label={t("ld.effective")} htmlFor="rc-eff">
        <Input id="rc-eff" type="date" {...form.register("effectiveFrom")} />
      </Field>
      <Field label={t("ld.reason")} htmlFor="rc-reason" error={e.reason?.message}>
        <Input id="rc-reason" {...form.register("reason")} />
      </Field>
      <SubmitButton pending={pending} icon={<Percent />}>
        {t("ld.changeRate")}
      </SubmitButton>
    </form>
  );
}

export function RateChangeDialog({ loanId }: { loanId: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Percent /> {t("ld.changeRate")}</>} triggerVariant="outline" title={t("ld.changeTitle")} icon={<Percent />} tone="violet">
      <RateForm loanId={loanId} />
    </FormDialog>
  );
}
