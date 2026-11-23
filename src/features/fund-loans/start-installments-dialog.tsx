"use client";

import { useT } from "@/i18n/client";
import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { FormNote, SubmitButton } from "@/components/app/form-bits";
import { apiMutate } from "@/lib/api-client";
import { useMoney } from "@/components/app/currency";
import { todayISO } from "@/lib/format";
import { InstallmentStartField, MONTH, addMonths, installmentPaise } from "./installment-note";

interface Props {
  loanId: string;
  number: string;
  outstandingPaise: number;
  monthlyRate: string;
  defaultCount: number;
}

/** Put a running upad on fixed installments: what is outstanding now, from next month. */
function Form({ loanId, outstandingPaise, monthlyRate, defaultCount }: Props) {
  const money = useMoney();
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const [count, setCount] = useState(String(defaultCount));
  const thisMonth = todayISO().slice(0, 7);
  const [startMonth, setStartMonth] = useState(addMonths(thisMonth, 1));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const n = Number(count);
  const valid = Number.isInteger(n) && n >= 2 && n <= 60;
  const per = valid ? Math.min(outstandingPaise, installmentPaise(outstandingPaise, n)) : 0;
  const interest = Math.round((outstandingPaise * Number(monthlyRate)) / 100);
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return setError(t("sch.si.count"));
        if (!MONTH.test(startMonth) || startMonth < thisMonth) return setError(t("sch.si.earliest"));
        start(async () => {
          setError(null);
          const res = await apiMutate({ path: `/orgs/${orgId}/fund-loans/${loanId}/installments`, body: { count: n, startMonth } });
          if (!res.ok) return setError(res.error);
          toast.success(t("sch.si.started"));
          close();
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <Field label={t("sch.si.label")} htmlFor="si-count" hint={t("sch.si.hint")}>
        <Input id="si-count" type="number" inputMode="numeric" min={2} max={60} value={count} onChange={(e) => setCount(e.target.value)} />
      </Field>
      <InstallmentStartField id="si-start" value={startMonth} min={thisMonth} onChange={setStartMonth} />
      {valid && (
        <FormNote tone="warn">
          {t("sch.si.note", { out: money.fmt(outstandingPaise), n, per: money.fmt(per), interest: money.fmt(interest), first: money.fmt(per + interest) })}
        </FormNote>
      )}
      <SubmitButton pending={pending} icon={<CalendarRange />}>
        {t("sch.si.start")}
      </SubmitButton>
    </form>
  );
}

export function StartInstallmentsDialog(props: Props) {
  const t = useT();
  return (
    <FormDialog trigger={<><CalendarRange /> {t("sch.si.start")}</>} triggerVariant="outline" title={t("sch.si.title", { number: props.number })} description={t("sch.si.desc")} icon={<CalendarRange />} tone="orange" openParam="installments">
      <Form {...props} />
    </FormDialog>
  );
}
