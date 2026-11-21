"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarRange } from "lucide-react";
import { FormError } from "@/components/app/field";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { FormNote, SubmitButton } from "@/components/app/form-bits";
import { apiMutate } from "@/lib/api-client";
import { todayISO } from "@/lib/format";
import { useMoney } from "@/components/app/currency";
import { InstallmentStartField, MONTH, addMonths } from "./installment-note";

interface Props {
  count: number;
  minAmountPaise: number;
}

/** Put every running upad (above the Mandal's limit) on installments, from a chosen month. */
function Form({ count, minAmountPaise }: Props) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const thisMonth = todayISO().slice(0, 7);
  const [startMonth, setStartMonth] = useState(addMonths(thisMonth, 1));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        // shown inside the settings form: don't let this submit reach it (React events bubble through the portal)
        e.stopPropagation();
        if (!MONTH.test(startMonth) || startMonth < thisMonth) return setError("Installments can start from this month at the earliest");
        start(async () => {
          setError(null);
          const res = await apiMutate<{ started: number }>({ path: `/orgs/${orgId}/fund-loans/installments/start-all`, body: { count, startMonth } });
          if (!res.ok) return setError(res.error);
          toast.success(res.data.started ? `${res.data.started} running upad put on installments` : "No running upad to put on installments");
          close();
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <InstallmentStartField id="sa-start" value={startMonth} min={thisMonth} onChange={setStartMonth} />
      <FormNote tone="warn">
        What is still outstanding on each running upad{minAmountPaise > 0 ? ` of more than ${money.fmt(minAmountPaise)}` : ""} is split into {count} equal monthly installments, with the interest. Upads that already have installments are not changed.
      </FormNote>
      <SubmitButton pending={pending} icon={<CalendarRange />}>
        Start installments
      </SubmitButton>
    </form>
  );
}

export function StartAllInstallmentsDialog(props: Props) {
  return (
    <FormDialog trigger={<><CalendarRange /> Apply to running upads</>} triggerVariant="outline" triggerSize="xs" title="Installments for running upads" description="Upad given before installments were turned on." icon={<CalendarRange />} tone="orange" openParam="installments-all">
      <Form {...props} />
    </FormDialog>
  );
}
