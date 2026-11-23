"use client";

import { useT } from "@/i18n/client";
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
import { AmountInput, MoreOptions, SubmitButton, MethodController } from "@/components/app/form-bits";

const Schema = z.object({
  donorName: z.string().trim().min(2, "don.v.name").max(120),
  donorPhone: z.string().max(20).optional(),
  amount: rupees,
  date: z.string().min(10),
  method: z.string(),
  reference: z.string().max(100).optional(),
  accountId: z.string().min(1, "don.v.account"),
  purpose: z.string().max(200).optional(),
  eventName: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

function Form({ accounts, methods }: { accounts: { _id: string; name: string }[]; methods: string[] }) {
  const t = useT();
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
          { success: t("don.saved"), onSuccess: close },
        ),
      )}
    >
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label={t("don.donorName")} htmlFor="d-name" error={e.donorName?.message} className="sm:col-span-2">
        <Input id="d-name" {...form.register("donorName")} />
      </Field>
      <Field label={t("don.amount")} htmlFor="d-amt" error={e.amount?.message} className="sm:col-span-2">
        <AmountInput id="d-amt" {...form.register("amount")} />
      </Field>
      <Field label={t("ap.date")} htmlFor="d-date">
        <Input id="d-date" type="date" {...form.register("date")} />
      </Field>
      <MethodController control={form.control} methods={methods} />
      <Field label={t("ap.event")} htmlFor="d-event" hint={t("don.eventHint")}>
        <Input id="d-event" placeholder={t("don.eventPh")} {...form.register("eventName")} />
      </Field>
      <Field label={t("ap.purpose")} htmlFor="d-purpose">
        <Input id="d-purpose" {...form.register("purpose")} />
      </Field>
      <MoreOptions bare icon={<SlidersHorizontal />} title={t("don.more")} description={t("don.moreD")} defaultOpen={!!e.accountId} className="sm:col-span-2">
        <Field label={t("ap.receivedInto")} htmlFor="d-acc" error={e.accountId?.message}>
          <NativeSelect id="d-acc" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("ap.reference")} htmlFor="d-ref">
          <Input id="d-ref" {...form.register("reference")} />
        </Field>
        <Field label={t("don.mobile")} htmlFor="d-phone">
          <Input id="d-phone" type="tel" {...form.register("donorPhone")} />
        </Field>
      </MoreOptions>
      <SubmitButton pending={pending} icon={<CheckCircle2 />} className="sm:col-span-2">
        {t("don.save")}
      </SubmitButton>
    </form>
  );
}

export function DonationDialog(props: { accounts: { _id: string; name: string }[]; methods: string[] }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Heart /> {t("don.trigger")}</>} title={t("don.dlgTitle")} icon={<Heart />} tone="pink">
      <Form {...props} />
    </FormDialog>
  );
}
