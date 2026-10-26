"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Check, HandCoins, Heart, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate, apiRead } from "@/app/actions/api";
import { METHOD_LABEL, label, newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees, rupeesOrZero } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useLang, useT } from "@/i18n/client";
import { intlLocale, type Key, type Lang } from "@/i18n/core";
import { useMoney } from "@/components/app/currency";

type Purpose = "hapta" | "upad" | "other";

interface Options {
  hapta: { duePaise: number; months: number; pendingPaise: number };
  upads: { _id: string; number: string; interestDuePaise: number; outstandingPaise: number; monthlyRate: string; unpaidMonths: string[] }[];
  methods: string[];
}

const monthName = (lang: Lang, m: string) => new Intl.DateTimeFormat(intlLocale(lang), { month: "short", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(`${m}-01T00:00:00Z`));

function Form({ methods }: { methods: string[] }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const t = useT();
  const lang = useLang();
  const methodLabel = (m: string) => (m in METHOD_LABEL ? t(`pay.method.${m}` as Key) : label(METHOD_LABEL, m));
  const [opts, setOpts] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<Purpose>("hapta");
  const [amount, setAmount] = useState("");
  const [loanId, setLoanId] = useState("");
  const [interest, setInterest] = useState("");
  const [principal, setPrincipal] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState(methods.includes("upi") ? "upi" : methods[0]);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => newIdempotencyKey("req"));
  const [pending, start] = useTransition();

  useEffect(() => {
    apiRead<Options>(`/orgs/${orgId}/me/payment-options`).then((r) => {
      if (!r.ok) return setLoadError(r.error);
      setOpts(r.data);
      setAmount(r.data.hapta.duePaise ? paiseToRupeeInput(r.data.hapta.duePaise) : "");
      const first = r.data.upads[0];
      if (first) {
        setLoanId(first._id);
        setInterest(first.interestDuePaise ? paiseToRupeeInput(first.interestDuePaise) : "");
      }
    });
  }, [orgId]);

  const upad = opts?.upads.find((u) => u._id === loanId);
  const pickUpad = (id: string) => {
    setLoanId(id);
    const u = opts?.upads.find((x) => x._id === id);
    setInterest(u?.interestDuePaise ? paiseToRupeeInput(u.interestDuePaise) : "");
    setPrincipal("");
  };

  const save = () => {
    setError(null);
    let req: { path: string; body: Record<string, unknown> };
    if (purpose === "upad") {
      const i = rupeesOrZero.safeParse(interest);
      const p = rupeesOrZero.safeParse(principal);
      if (!loanId) return setError(t("pay.vUpad"));
      if (!i.success) return setError(t("pay.vInterest", { msg: i.error.issues[0].message }));
      if (!p.success) return setError(t("pay.vReturned", { msg: p.error.issues[0].message }));
      if (Number(i.data) <= 0 && Number(p.data) <= 0) return setError(t("pay.vEnter"));
      req = { path: `/orgs/${orgId}/me/upad-payments`, body: { loanId, interestAmount: i.data, principalAmount: p.data, date, method, reference: reference || undefined, notes: notes || undefined, idempotencyKey: key } };
    } else {
      const a = rupees.safeParse(amount);
      if (!a.success) return setError(a.error.issues[0].message);
      if (purpose === "other" && notes.trim().length < 2) return setError(t("pay.vOther"));
      req = { path: `/orgs/${orgId}/me/payment-requests`, body: { purpose, amount: a.data, date, method, reference: reference || undefined, notes: notes || undefined, idempotencyKey: key } };
    }
    start(async () => {
      const res = await apiMutate(req);
      if (!res.ok) return setError(res.fieldErrors?.interestAmount ?? res.fieldErrors?.amount ?? res.error);
      toast.success(t("pay.sent"));
      close();
      router.refresh();
    });
  };

  if (loadError) return <FormError message={loadError} />;
  if (!opts) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {t("pay.loadingOwe")}
      </div>
    );
  }

  const choices: { key: Purpose; title: string; hint: React.ReactNode; icon: React.ReactNode; show: boolean }[] = [
    { key: "hapta", title: t("pay.monthly"), icon: <CalendarDays />, show: true, hint: opts.hapta.duePaise ? t("pay.dueNow", { amount: money.fmt(opts.hapta.duePaise) }) : t("pay.nothingNow") },
    { key: "upad", title: t("pay.upad"), icon: <HandCoins />, show: opts.upads.length > 0, hint: t("pay.upadInterestDue", { amount: money.fmt(opts.upads.reduce((s, u) => s + u.interestDuePaise, 0)) }) },
    { key: "other", title: t("pay.other"), icon: <Heart />, show: true, hint: t("pay.otherHint") },
  ];

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <FormError message={error} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">{t("pay.whatFor")}</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {choices
            .filter((c) => c.show)
            .map((c) => (
              <button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={purpose === c.key}
                onClick={() => {
                  setPurpose(c.key);
                  setError(null);
                }}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4",
                  purpose === c.key ? "border-2 border-primary bg-primary/10" : "border-border hover:bg-muted",
                )}
              >
                {purpose === c.key && <Check className="absolute top-1.5 right-1.5 size-3.5! text-primary" aria-hidden />}
                <span className="flex items-center gap-1.5 font-medium">
                  {c.icon}
                  {c.title}
                </span>
                <span className="text-xs text-muted-foreground">{c.hint}</span>
              </button>
            ))}
        </div>
      </fieldset>

      {purpose === "hapta" && (
        <Field label={t("pay.amountPaid")} htmlFor="pr-amount" hint={opts.hapta.months > 1 ? t("pay.oldestFirst", { n: opts.hapta.months }) : opts.hapta.months === 1 ? t("pay.oneMonthDue") : t("pay.nextHapta")}>
          <Input id="pr-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      )}
      {purpose === "hapta" && opts.hapta.pendingPaise > 0 && (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs">
          {t("pay.waiting", { amount: money.fmt(opts.hapta.pendingPaise) })}
        </p>
      )}

      {purpose === "upad" && (
        <>
          {opts.upads.length > 1 && (
            <Field label={t("pay.whichUpad")} htmlFor="pr-upad">
              <NativeSelect id="pr-upad" value={loanId} onChange={(e) => pickUpad(e.target.value)}>
                {opts.upads.map((u) => (
                  <option key={u._id} value={u._id}>
                    {t("pay.optOutstanding", { number: u.number, amount: money.fmt(u.outstandingPaise) })}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          {upad && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs">
              {t("pay.outstandingAt", { number: upad.number, amount: money.fmt(upad.outstandingPaise), rate: upad.monthlyRate, due: money.fmt(upad.interestDuePaise) })}
              {upad.unpaidMonths.length > 0 && <> ({upad.unpaidMonths.map((m) => monthName(lang, m)).join(", ")})</>}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("pay.interestPaid")} htmlFor="pr-int">
              <Input id="pr-int" inputMode="decimal" placeholder="0" value={interest} onChange={(e) => setInterest(e.target.value)} />
            </Field>
            <Field label={t("pay.upadReturned")} htmlFor="pr-princ" hint={t("common.optional")}>
              <Input id="pr-princ" inputMode="decimal" placeholder="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {purpose === "other" && (
        <>
          <Field label={t("pay.amountPaid")} htmlFor="pr-amount-o">
            <Input id="pr-amount-o" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t("pay.whatIsIt")} htmlFor="pr-what">
            <Input id="pr-what" maxLength={300} placeholder={t("pay.whatPh")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("pay.datePaid")} htmlFor="pr-date">
          <Input id="pr-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t("pay.paidBy")} htmlFor="pr-method">
          <NativeSelect id="pr-method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {(opts.methods.length ? opts.methods : methods).map((m) => (
              <option key={m} value={m}>
                {methodLabel(m)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      {method !== "cash" && (
        <Field label={t("pay.reference")} htmlFor="pr-ref" hint={t("pay.referenceHint")}>
          <Input id="pr-ref" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
      )}
      {purpose !== "other" && (
        <Field label={t("pay.note")} htmlFor="pr-notes">
          <Input id="pr-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      )}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {t("pay.submit")}
      </Button>
    </form>
  );
}

export function PaymentRequestDialog({ methods, defaultOpen, triggerClassName }: { methods: string[]; defaultOpen?: boolean; triggerClassName?: string }) {
  const t = useT();
  return (
    <FormDialog
      defaultOpen={defaultOpen}
      openParam="pay"
      triggerClassName={triggerClassName}
      trigger={
        <>
          <Send /> {t("pay.iHavePaid")}
        </>
      }
      title={t("pay.title")}
      description={t("pay.desc")}
    >
      <Form methods={methods} />
    </FormDialog>
  );
}
