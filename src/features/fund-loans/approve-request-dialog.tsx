"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { Money } from "@/components/app/money";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate } from "@/app/actions/api";
import { formatINR, todayISO } from "@/lib/format";

const RATE = /^\d{1,3}(\.\d{1,4})?$/;

function Form({ requestId, amountPaise, defaultRate }: { requestId: string; amountPaise: number; defaultRate: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const [rate, setRate] = useState(defaultRate);
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const monthly = RATE.test(rate) ? Math.round((amountPaise * Number(rate)) / 100) : 0;
  return (
    <form
      noValidate
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!RATE.test(rate) || Number(rate) <= 0) return setError("Enter the interest rate per month");
        start(async () => {
          setError(null);
          const res = await apiMutate<{ number: string }>({ path: `/orgs/${orgId}/upad-requests/${requestId}/approve`, body: { monthlyRate: rate, date } });
          if (!res.ok) return setError(res.error);
          toast.success(`Approved — upad ${res.data.number} given`);
          close();
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <p className="text-sm">
        Give <Money paise={amountPaise} className="font-semibold" /> in cash from the Mandal fund.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Interest (% per month)" htmlFor="ar-rate">
          <Input id="ar-rate" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="Date given" htmlFor="ar-date">
          <Input id="ar-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {monthly > 0 && <p className="text-xs text-muted-foreground">{formatINR(monthly)} interest a month, from next month.</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Approve and give upad
      </Button>
    </form>
  );
}

export function ApproveRequestDialog(props: { requestId: string; memberName: string; amountPaise: number; defaultRate: string }) {
  return (
    <FormDialog trigger="Approve" triggerSize="xs" title={`Approve ${props.memberName}'s request`}>
      <Form {...props} />
    </FormDialog>
  );
}
