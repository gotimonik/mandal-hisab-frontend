"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, HandCoins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate } from "@/lib/api-client";
import { todayISO } from "@/lib/format";
import { useT } from "@/i18n/client";
import { useMoney } from "@/components/app/currency";
import { FormNote, SubmitButton } from "@/components/app/form-bits";

const RATE = /^\d{1,3}(\.\d{1,4})?$/;

function Form({ requestId, amountPaise, defaultRate }: { requestId: string; amountPaise: number; defaultRate: string }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const t = useT();
  const [rate, setRate] = useState(defaultRate);
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const monthly = RATE.test(rate) ? Math.round((amountPaise * Number(rate)) / 100) : 0;
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!RATE.test(rate) || Number(rate) <= 0) return setError(t("upad.vRateShort"));
        start(async () => {
          setError(null);
          const res = await apiMutate<{ number: string }>({ path: `/orgs/${orgId}/upad-requests/${requestId}/approve`, body: { monthlyRate: rate, date } });
          if (!res.ok) return setError(res.error);
          toast.success(t("upad.approved", { number: res.data.number }));
          close();
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <div className="bg-hero-warm rounded-2xl p-4 text-white">
        <p className="text-sm font-semibold">{t("upad.giveX", { amount: money.fmt(amountPaise) })}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("upad.ratePerMonth")} htmlFor="ar-rate">
          <Input id="ar-rate" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label={t("upad.dateGiven")} htmlFor="ar-date">
          <Input id="ar-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {monthly > 0 && <FormNote>{t("upad.perMonthFromNext", { amount: money.fmt(monthly) })}</FormNote>}
      <SubmitButton pending={pending} icon={<Check />}>
        {t("upad.approveGive")}
      </SubmitButton>
    </form>
  );
}

export function ApproveRequestDialog(props: { requestId: string; memberName: string; amountPaise: number; defaultRate: string }) {
  const t = useT();
  return (
    <FormDialog trigger={t("common.approve")} triggerSize="xs" title={t("upad.approveTitle", { name: props.memberName })} icon={<HandCoins />} tone="orange">
      <Form {...props} />
    </FormDialog>
  );
}
