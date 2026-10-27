"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Check, HandCoins, Heart, Loader2, Send } from "lucide-react";
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
import { IconChip } from "@/components/app/bits";
import { AmountInput, ChoicePills, FormNote, SubmitButton, PaidInCash } from "@/components/app/form-bits";
import type { Tone } from "@/lib/tones";

type Purpose = "hapta" | "upad" | "other";

interface Options {
  hapta: { duePaise: number; months: number; pendingPaise: number };
  upads: { _id: string; number: string; interestDuePaise: number; outstandingPaise: number; monthlyRate: string; unpaidMonths: string[] }[];
  methods: string[];
}

const monthName = (lang: Lang, m: string) => new Intl.DateTimeFormat(intlLocale(lang), { month: "short", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(`${m}-01T00:00:00Z`));

function Form(_props: { methods: string[] }) {
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
  const method = "cash"; // cash only for now
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

  const choices: { key: Purpose; title: string; hint: React.ReactNode; icon: React.ReactNode; tone: Tone; show: boolean }[] = [
    { key: "hapta", title: t("pay.monthly"), icon: <CalendarDays />, tone: "indigo", show: true, hint: opts.hapta.duePaise ? t("pay.dueNow", { amount: money.fmt(opts.hapta.duePaise) }) : t("pay.nothingNow") },
    { key: "upad", title: t("pay.upad"), icon: <HandCoins />, tone: "orange", show: opts.upads.length > 0, hint: t("pay.upadInterestDue", { amount: money.fmt(opts.upads.reduce((s, u) => s + u.interestDuePaise, 0)) }) },
    { key: "other", title: t("pay.other"), icon: <Heart />, tone: "pink", show: true, hint: t("pay.otherHint") },
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
                  "relative flex flex-col items-start gap-1.5 rounded-2xl p-2.5 text-left text-sm ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  purpose === c.key ? "bg-primary/10 ring-2 ring-primary" : "bg-card ring-foreground/10 hover:bg-muted",
                )}
              >
                {purpose === c.key && <Check className="absolute top-2 right-2 size-3.5 text-primary" aria-hidden />}
                <IconChip tone={c.tone} size="sm">
                  {c.icon}
                </IconChip>
                <span className="font-semibold leading-tight">{c.title}</span>
                <span className="text-xs leading-snug text-muted-foreground">{c.hint}</span>
              </button>
            ))}
        </div>
      </fieldset>

      {purpose === "hapta" && (
        <Field label={t("pay.amountPaid")} htmlFor="pr-amount" hint={opts.hapta.months > 1 ? t("pay.oldestFirst", { n: opts.hapta.months }) : opts.hapta.months === 1 ? t("pay.oneMonthDue") : t("pay.nextHapta")}>
          <AmountInput id="pr-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      )}
      {purpose === "hapta" && opts.hapta.duePaise > 0 && (
        <ChoicePills label={t("pay.amountPaid")} value={amount} onChange={setAmount} options={[{ value: paiseToRupeeInput(opts.hapta.duePaise), label: t("pay.dueNow", { amount: money.fmt(opts.hapta.duePaise) }) }]} />
      )}
      {purpose === "hapta" && opts.hapta.pendingPaise > 0 && (
        <FormNote tone="warn">{t("pay.waiting", { amount: money.fmt(opts.hapta.pendingPaise) })}</FormNote>
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
            <FormNote>
              {t("pay.outstandingAt", { number: upad.number, amount: money.fmt(upad.outstandingPaise), rate: upad.monthlyRate, due: money.fmt(upad.interestDuePaise) })}
              {upad.unpaidMonths.length > 0 && <> ({upad.unpaidMonths.map((m) => monthName(lang, m)).join(", ")})</>}
            </FormNote>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("pay.interestPaid")} htmlFor="pr-int">
              <AmountInput id="pr-int" placeholder="0" className="text-xl md:text-lg" value={interest} onChange={(e) => setInterest(e.target.value)} />
            </Field>
            <Field label={t("pay.upadReturned")} htmlFor="pr-princ" hint={t("common.optional")}>
              <AmountInput id="pr-princ" placeholder="0" className="text-xl md:text-lg" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {purpose === "other" && (
        <>
          <Field label={t("pay.amountPaid")} htmlFor="pr-amount-o">
            <AmountInput id="pr-amount-o" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
        <PaidInCash label={t("pay.paidBy")} value={methodLabel("cash")} />
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
      <SubmitButton pending={pending} icon={<Send />}>
        {t("pay.submit")}
      </SubmitButton>
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
      icon={<Send />}
      tone="emerald"
    >
      <Form methods={methods} />
    </FormDialog>
  );
}
