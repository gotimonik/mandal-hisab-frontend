"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Heart, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";
import { AmountInput, MoreOptions, SubmitButton, PaidInCash } from "@/components/app/form-bits";

const Schema = z.object({
  donorName: z.string().trim().min(2, "Enter the donor's name").max(120),
  donorPhone: z.string().max(20).optional(),
  amount: rupees,
  date: z.string().min(10),
  method: z.string(),
  reference: z.string().max(100).optional(),
  accountId: z.string().min(1, "Choose an account"),
  purpose: z.string().max(200).optional(),
  eventName: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

function Form({ accounts, methods }: { accounts: { _id: string; name: string }[]; methods: string[] }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("don"));
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { donorName: "", donorPhone: "", amount: "", date: todayISO(), method: methods[0], reference: "", accountId: accounts[0]?._id ?? "", purpose: "", eventName: "", notes: "" },
  });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      onSubmit={form.handleSubmit((v) =>
        submit(
          { path: `/orgs/${orgId}/donations`, body: { ...v, idempotencyKey: key } },
          { success: "Donation recorded — receipt issued", onSuccess: close },
        ),
      )}
    >
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label="Donor name" htmlFor="d-name" error={e.donorName?.message} className="sm:col-span-2">
        <Input id="d-name" {...form.register("donorName")} />
      </Field>
      <Field label={`Amount (${money.symbol})`} htmlFor="d-amt" error={e.amount?.message} className="sm:col-span-2">
        <AmountInput id="d-amt" {...form.register("amount")} />
      </Field>
      <Field label="Date" htmlFor="d-date">
        <Input id="d-date" type="date" {...form.register("date")} />
      </Field>
      <input type="hidden" {...form.register("method")} />
      <PaidInCash />
      <Field label="Event" htmlFor="d-event" hint="Used in the event-wise report.">
        <Input id="d-event" placeholder="e.g. Ganeshotsav 2026" {...form.register("eventName")} />
      </Field>
      <Field label="Purpose" htmlFor="d-purpose">
        <Input id="d-purpose" {...form.register("purpose")} />
      </Field>
      <MoreOptions bare icon={<SlidersHorizontal />} title="Account, reference & donor details" description="Donor mobile is optional." defaultOpen={!!e.accountId} className="sm:col-span-2">
        <Field label="Received into" htmlFor="d-acc" error={e.accountId?.message}>
          <NativeSelect id="d-acc" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Reference" htmlFor="d-ref">
          <Input id="d-ref" {...form.register("reference")} />
        </Field>
        <Field label="Donor mobile" htmlFor="d-phone">
          <Input id="d-phone" type="tel" {...form.register("donorPhone")} />
        </Field>
      </MoreOptions>
      <SubmitButton pending={pending} icon={<CheckCircle2 />} className="sm:col-span-2">
        Save donation
      </SubmitButton>
    </form>
  );
}

export function DonationDialog(props: { accounts: { _id: string; name: string }[]; methods: string[] }) {
  return (
    <FormDialog trigger={<><Heart /> Record donation</>} title="Record a donation" icon={<Heart />} tone="pink">
      <Form {...props} />
    </FormDialog>
  );
}
