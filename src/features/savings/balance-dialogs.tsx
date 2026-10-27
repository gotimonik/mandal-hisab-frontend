"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Minus, PiggyBank, Plus, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { AmountInput, ChoicePills, FormNote, SubmitButton } from "@/components/app/form-bits";
import { useApiSubmit } from "@/components/app/use-api-form";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";

const OpeningSchema = z.object({ amount: rupees, date: z.string().min(10), note: z.string().max(300).optional() });

function OpeningForm({ memberId }: { memberId: string }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.infer<typeof OpeningSchema>>({ resolver: zodResolver(OpeningSchema), defaultValues: { amount: "", date: todayISO(), note: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/members/${memberId}/opening`, body: { ...v, note: v.note || undefined } }, { success: "Opening balance saved", onSuccess: close }))}>
      <FormError message={error} />
      <Field label={`Opening balance (${money.symbol})`} htmlFor="ob-amt" error={e.amount?.message}>
        <AmountInput id="ob-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="As on" htmlFor="ob-date">
          <Input id="ob-date" type="date" {...form.register("date")} />
        </Field>
        <Field label="Note (optional)" htmlFor="ob-note">
          <Input id="ob-note" placeholder="e.g. Carried over from the old register" {...form.register("note")} />
        </Field>
      </div>
      <FormNote tone="warn">Use this once, for savings the member already had before you started using MandalHisab. It can&apos;t be changed later — use an adjustment instead.</FormNote>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        Save opening balance
      </SubmitButton>
    </form>
  );
}

export function OpeningBalanceDialog({ memberId }: { memberId: string }) {
  return (
    <FormDialog trigger="Set opening balance" triggerVariant="outline" triggerSize="sm" title="Opening savings balance" icon={<PiggyBank />} tone="emerald">
      <OpeningForm memberId={memberId} />
    </FormDialog>
  );
}

const AdjustSchema = z.object({ direction: z.enum(["credit", "debit"]), amount: rupees, date: z.string().min(10), reason: z.string().trim().min(3, "Give a reason").max(500) });

function AdjustForm({ memberId }: { memberId: string }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("adj"));
  const form = useForm<z.infer<typeof AdjustSchema>>({ resolver: zodResolver(AdjustSchema), defaultValues: { direction: "credit", amount: "", date: todayISO(), reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  const direction = useWatch({ control: form.control, name: "direction" });
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/members/${memberId}/adjustments`, body: { ...v, idempotencyKey: key } }, { success: "Balance adjusted", onSuccess: close }))}>
      <FormError message={error} />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Type</span>
        <input type="hidden" {...form.register("direction")} />
        <ChoicePills
          label="Type"
          value={direction}
          onChange={(v) => form.setValue("direction", v, { shouldDirty: true })}
          options={[
            { value: "credit" as const, label: "Add to balance", icon: <Plus /> },
            { value: "debit" as const, label: "Reduce balance", icon: <Minus /> },
          ]}
        />
      </div>
      <Field label={`Amount (${money.symbol})`} htmlFor="ad-amt" error={e.amount?.message}>
        <AmountInput id="ad-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date" htmlFor="ad-date">
          <Input id="ad-date" type="date" max={todayISO()} {...form.register("date")} />
        </Field>
        <Field label="Reason" htmlFor="ad-reason" error={e.reason?.message}>
          <Input id="ad-reason" placeholder="e.g. Correct interest for Aug — wrong rate" {...form.register("reason")} />
        </Field>
      </div>
      <FormNote>Adjustments correct a member&apos;s balance without changing cash. They are recorded in the audit log and can&apos;t be deleted.</FormNote>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        Save adjustment
      </SubmitButton>
    </form>
  );
}

export function AdjustBalanceDialog({ memberId }: { memberId: string }) {
  return (
    <FormDialog trigger="Adjust balance" triggerVariant="outline" triggerSize="sm" title="Adjust savings balance" icon={<Scale />} tone="violet" description="An audited correction to the member's savings balance.">
      <AdjustForm memberId={memberId} />
    </FormDialog>
  );
}
