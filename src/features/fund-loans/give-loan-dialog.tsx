"use client";

import { useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate } from "@/app/actions/api";
import { formatINR, newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useLang, useT } from "@/i18n/client";
import { monthName } from "@/i18n/core";

interface Props {
  members: { _id: string; name: string; membershipNumber: string }[];
  accounts: { _id: string; name: string; balancePaise: number }[];
  defaultRate: string;
  defaultMemberId?: string;
}

const RATE = /^\d{1,3}(\.\d{1,4})?$/;

function Form({ members, accounts, defaultRate, defaultMemberId }: Props) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const t = useT();
  const lang = useLang();
  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState(defaultRate);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?._id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => newIdempotencyKey("fl"));
  const [pending, start] = useTransition();
  const account = accounts.find((a) => a._id === accountId);
  const amountPaise = useMemo(() => {
    const p = rupees.safeParse(amount);
    return p.success ? Math.round(Number(p.data) * 100) : 0;
  }, [amount]);
  const monthly = RATE.test(rate) ? Math.round((amountPaise * Number(rate)) / 100) : 0;
  const nextMonthName = (() => {
    const [y, m] = date.slice(0, 7).split("-").map(Number);
    return y ? monthName(lang, new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7)) : "";
  })();

  const save = () => {
    if (!memberId) return setError(t("upad.vMember"));
    const p = rupees.safeParse(amount);
    if (!p.success) return setError(p.error.issues[0].message);
    if (!RATE.test(rate) || Number(rate) <= 0) return setError(t("upad.vRate"));
    start(async () => {
      setError(null);
      const res = await apiMutate<{ loan: { _id: string; number: string } }>({ path: `/orgs/${orgId}/fund-loans`, body: { memberId, amount: p.data, monthlyRate: rate, date, note: note || undefined, accountId: accountId || undefined, idempotencyKey: key } });
      if (!res.ok) return setError(res.error);
      toast.success(t("upad.recorded", { number: res.data.loan.number }));
      close();
      router.push(`/org/${orgId}/fund-loans/${res.data.loan._id}`);
      router.refresh();
    });
  };

  return (
    <form
      noValidate
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <FormError message={error} />
      <Field label={t("upad.memberTaking")} htmlFor="fl-member">
        <NativeSelect id="fl-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">{t("upad.chooseMember")}</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.membershipNumber})
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("common.amountRs")} htmlFor="fl-amt" hint={account ? <>{t("upad.fundCash")} <Money paise={account.balancePaise} /></> : undefined}>
          <Input id="fl-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t("upad.ratePerMonth")} htmlFor="fl-rate">
          <Input id="fl-rate" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </div>
      <Field label={t("upad.dateGiven")} htmlFor="fl-date">
        <Input id="fl-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {accounts.length > 1 && (
        <Field label={t("upad.paidFrom")} htmlFor="fl-acc">
          <NativeSelect id="fl-acc" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <Field label={t("common.noteOptional")} htmlFor="fl-note">
        <Input id="fl-note" maxLength={300} placeholder={t("upad.notePh")} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {monthly > 0 && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          {t("upad.willBeDue", { amount: formatINR(monthly), month: nextMonthName })}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {t("upad.give")}
      </Button>
    </form>
  );
}

export function GiveLoanDialog(props: Props & { defaultOpen?: boolean }) {
  const t = useT();
  return (
    <FormDialog defaultOpen={props.defaultOpen} trigger={<><HandCoins /> {t("upad.give")}</>} title={t("upad.giveTitle")} description={t("upad.giveDesc")}>
      <Form {...props} />
    </FormDialog>
  );
}
