"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calculator, Check, HandCoins, Loader2, Percent, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { apiMutate, apiRead } from "@/app/actions/api";
import { METHOD_LABEL, formatDate, label, newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";

type Acc = { _id: string; name: string };

/* ----------------------------------------------- approve */
const ApproveSchema = z.object({ approvedAmount: rupees, rate: z.string().regex(/^(\d{1,3}(\.\d{1,4})?)?$/, "Invalid rate").optional(), tenure: z.coerce.number().int().min(0).max(360), notes: z.string().max(500).optional() });

function ApproveForm({ loanId, requestedPaise, canChangeRate, tenure, rate }: { loanId: string; requestedPaise: number; canChangeRate: boolean; tenure: number; rate: string }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.input<typeof ApproveSchema>, unknown, z.output<typeof ApproveSchema>>({ resolver: zodResolver(ApproveSchema), defaultValues: { approvedAmount: paiseToRupeeInput(requestedPaise), rate: "", tenure, notes: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/loans/${loanId}/approve`, body: { approvedAmount: v.approvedAmount, rate: v.rate || undefined, tenure: v.tenure || undefined, notes: v.notes || undefined } }, { success: "Loan approved", onSuccess: close }))}
    >
      <FormError message={error} />
      <Field label={`Approved amount (${money.symbol})`} htmlFor="ap-amt" error={e.approvedAmount?.message}>
        <Input id="ap-amt" inputMode="decimal" {...form.register("approvedAmount")} />
      </Field>
      {canChangeRate && (
        <Field label={`Annual rate % (leave blank to keep ${rate}%)`} htmlFor="ap-rate" error={e.rate?.message}>
          <Input id="ap-rate" inputMode="decimal" {...form.register("rate")} />
        </Field>
      )}
      <Field label="Installments" htmlFor="ap-ten">
        <Input id="ap-ten" type="number" min={1} {...form.register("tenure")} />
      </Field>
      <Field label="Notes" htmlFor="ap-notes">
        <Input id="ap-notes" {...form.register("notes")} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Approve
      </Button>
    </form>
  );
}

export function ApproveLoanDialog(props: { loanId: string; requestedPaise: number; canChangeRate: boolean; tenure: number; rate: string }) {
  return (
    <FormDialog trigger={<><Check /> Approve</>} title="Approve loan">
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
  const close = useDialogClose();
  const today = todayISO();
  const form = useForm({ defaultValues: { accountId: accounts[0]?._id ?? "", date: today, firstDueDate: addMonth(today), roundEmiToRupee: false } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form className="flex flex-col gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/loans/${loanId}/disburse`, body: v }, { success: "Loan disbursed — schedule generated", onSuccess: close }))}>
      <p className="text-sm">
        Pay out <Money paise={amountPaise} className="font-semibold" /> from:
      </p>
      <FormError message={error} />
      <Field label="Account" htmlFor="db-acc">
        <NativeSelect id="db-acc" {...form.register("accountId")}>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Disbursement date" htmlFor="db-date">
          <Input id="db-date" type="date" {...form.register("date")} />
        </Field>
        <Field label="First due date" htmlFor="db-first">
          <Input id="db-first" type="date" {...form.register("firstDueDate")} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.watch("roundEmiToRupee")} onCheckedChange={(c) => form.setValue("roundEmiToRupee", !!c)} /> Round EMI up to a whole amount (no paise or cents)
      </label>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Disburse
      </Button>
    </form>
  );
}

export function DisburseLoanDialog(props: { loanId: string; accounts: Acc[]; amountPaise: number }) {
  return (
    <FormDialog trigger={<><Send /> Disburse</>} title="Disburse loan">
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
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key, setKey] = useState(() => newIdempotencyKey("rep"));
  const form = useForm<z.infer<typeof RepaySchema>>({ resolver: zodResolver(RepaySchema), defaultValues: { amount: nextDuePaise ? paiseToRupeeInput(nextDuePaise) : "", date: todayISO(), method: methods[0], reference: "", accountId: accounts[0]?._id ?? "", prepayment: false, closeLoan: false } });
  const { submit, pending, error, setError } = useApiSubmit(form);
  const [preview, setPreview] = useState<PreviewRes["preview"] | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [calc, startCalc] = useTransition();
  const [closeLoan, prepayment] = useWatch({ control: form.control, name: ["closeLoan", "prepayment"] });

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
        submit({ path: `/orgs/${orgId}/loans/${loanId}/repayments`, body: { ...v, reference: v.reference || undefined, idempotencyKey: key } }, { success: v.closeLoan ? "Loan closed" : "Repayment recorded — receipt issued", onSuccess: () => { setKey(newIdempotencyKey("rep")); close(); } }),
      )}
    >
      <FormError message={error} />
      <label className="flex items-center gap-2 text-sm">
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
        Close the loan early (full settlement)
      </label>
      {quote && closeLoan && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="mb-1 font-medium">Closure amount</p>
          <Row k="Outstanding principal" v={quote.outstandingPrincipalPaise} />
          <Row k="Unpaid interest on due installments" v={quote.unpaidDueInterestPaise} />
          <Row k={`Interest accrued ${formatDate(quote.accruedFrom)} → today (${quote.accruedDays} days @ ${quote.annualRate}%)`} v={quote.accruedInterestPaise} />
          {quote.penaltyPaise > 0 && <Row k="Late fees" v={quote.penaltyPaise} />}
          <Row k="Total to pay" v={quote.totalPaise} bold />
          {quote.waivedFutureInterestPaise > 0 && <p className="mt-1 text-xs text-muted-foreground">Future scheduled interest of {paiseToRupeeInput(quote.waivedFutureInterestPaise)} is not charged.</p>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Amount (${money.symbol})`} htmlFor="rp-amt" error={form.formState.errors.amount?.message}>
          <Input id="rp-amt" inputMode="decimal" readOnly={closeLoan} {...form.register("amount", { onChange: () => setPreview(null) })} />
        </Field>
        <Field label="Date" htmlFor="rp-date">
          <Input id="rp-date" type="date" {...form.register("date", { onChange: (ev) => (closeLoan ? fetchQuote(ev.target.value) : setPreview(null)) })} />
        </Field>
        <Field label="Method" htmlFor="rp-method">
          <NativeSelect id="rp-method" {...form.register("method")}>
            {methods.map((m) => (
              <option key={m} value={m}>
                {label(METHOD_LABEL, m)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Into account" htmlFor="rp-acc">
          <NativeSelect id="rp-acc" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Reference" htmlFor="rp-ref">
        <Input id="rp-ref" {...form.register("reference")} />
      </Field>
      {!closeLoan && allowPrepay && (
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={prepayment} onCheckedChange={(c) => { form.setValue("prepayment", !!c); setPreview(null); }} />
          <span>Treat any amount beyond current dues as a principal prepayment (reschedules future installments). Otherwise it pays the next installments in advance.</span>
        </label>
      )}
      <Button type="button" variant="outline" onClick={doPreview} disabled={calc}>
        {calc ? <Loader2 className="animate-spin" /> : <Calculator />} Preview allocation
      </Button>
      {preview && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm" aria-live="polite">
          <Row k="Late fees" v={preview.penaltyPaise} />
          <Row k="Interest" v={preview.interestPaise} />
          <Row k="Principal (installments)" v={preview.principalPaise - preview.prepaymentPaise} />
          {preview.prepaymentPaise > 0 && <Row k="Principal prepayment" v={preview.prepaymentPaise} />}
          {preview.advancePaise > 0 && <p className="text-xs text-muted-foreground">Includes advance payment of upcoming installments.</p>}
          <Row k="Principal outstanding after" v={preview.outstandingPrincipalAfterPaise} bold />
          {preview.closed && <p className="mt-1 font-medium text-success">This payment closes the loan.</p>}
        </div>
      )}
      <Button type="submit" disabled={pending || !preview}>
        {pending && <Loader2 className="animate-spin" />} Confirm {closeLoan ? "closure" : "repayment"}
      </Button>
    </form>
  );
}

function Row({ k, v, bold }: { k: string; v: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "mt-1 border-t pt-1 font-semibold" : ""}`}>
      <span>{k}</span>
      <Money paise={v} />
    </div>
  );
}

export function RepayLoanDialog(props: { loanId: string; accounts: Acc[]; methods: string[]; nextDuePaise: number; allowPrepay: boolean }) {
  return (
    <FormDialog trigger={<><HandCoins /> Record repayment</>} title="Record loan repayment" description="Preview how the amount is split before saving. Allocation order: late fee → interest → principal (as configured).">
      <RepayForm {...props} />
    </FormDialog>
  );
}

/* ----------------------------------------------- rate change */
const RateSchema = z.object({ rate: z.string().regex(/^\d{1,3}(\.\d{1,4})?$/, "Enter a rate"), ratePeriod: z.enum(["annual", "monthly"]), effectiveFrom: z.string().min(10), reason: z.string().trim().min(3).max(500) });

function RateForm({ loanId }: { loanId: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.infer<typeof RateSchema>>({ resolver: zodResolver(RateSchema), defaultValues: { rate: "", ratePeriod: "annual", effectiveFrom: todayISO(), reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/loans/${loanId}/rate`, body: v }, { success: "Rate changed for future installments", onSuccess: close }))}>
      <p className="text-sm text-muted-foreground">Only unpaid installments due on or after the effective date are recalculated. Past interest keeps the rate that applied.</p>
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="New rate (%)" htmlFor="rc-rate" error={e.rate?.message}>
          <Input id="rc-rate" inputMode="decimal" {...form.register("rate")} />
        </Field>
        <Field label="Per" htmlFor="rc-per">
          <NativeSelect id="rc-per" {...form.register("ratePeriod")}>
            <option value="annual">Year</option>
            <option value="monthly">Month</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Effective from" htmlFor="rc-eff">
        <Input id="rc-eff" type="date" {...form.register("effectiveFrom")} />
      </Field>
      <Field label="Reason" htmlFor="rc-reason" error={e.reason?.message}>
        <Input id="rc-reason" {...form.register("reason")} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Change rate
      </Button>
    </form>
  );
}

export function RateChangeDialog({ loanId }: { loanId: string }) {
  return (
    <FormDialog trigger={<><Percent /> Change rate</>} triggerVariant="outline" title="Change interest rate">
      <RateForm loanId={loanId} />
    </FormDialog>
  );
}
