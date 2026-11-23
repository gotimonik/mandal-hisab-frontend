"use client";

import { useT } from "@/i18n/client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeftRight, ArrowRight, Banknote, Landmark, Minus, Plus, Scale, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { AmountInput, ChoicePills, FormNote, SubmitButton } from "@/components/app/form-bits";
import { useApiSubmit } from "@/components/app/use-api-form";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees, rupeesOrZero } from "@/lib/schemas";

type Acc = { _id: string; name: string };

/** Same rule as the server: name@bank, e.g. gotimandal@okaxis or 9876543210@ybl. */
const UPI_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

const NewSchema = z
  .object({
    name: z.string().trim().min(2, "acc.v.name").max(80),
    type: z.enum(["cash", "upi"]),
    upiId: z.string().trim(),
    openingBalance: rupeesOrZero,
    openingDate: z.string().min(10),
  })
  .superRefine((v, ctx) => {
    if (v.type === "upi" && !UPI_ID.test(v.upiId)) ctx.addIssue({ code: "custom", path: ["upiId"], message: "acc.v.upi" });
  });

function NewAccountForm() {
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.input<typeof NewSchema>, unknown, z.output<typeof NewSchema>>({ resolver: zodResolver(NewSchema), defaultValues: { name: "", type: "cash", upiId: "", openingBalance: "0", openingDate: todayISO() } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  const type = useWatch({ control: form.control, name: "type" });
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/accounts`, body: { ...v, upiId: v.type === "upi" ? v.upiId : undefined } }, { success: t("acc.created"), onSuccess: close }))}
    >
      <FormError message={error} />
      <ChoicePills
        label={t("acc.accType")}
        value={type}
        onChange={(v) => form.setValue("type", v, { shouldValidate: false })}
        options={[
          { value: "cash", label: t("acc.type.cash"), icon: <Banknote /> },
          { value: "upi", label: "UPI", icon: <Smartphone /> },
        ]}
      />
      {type === "cash" ? (
        <FormNote tone="good">{t("acc.cashNote")}</FormNote>
      ) : (
        <FormNote>{t("acc.upiNote")}</FormNote>
      )}
      <Field label={t("acc.name")} htmlFor="a-name" error={e.name?.message}>
        <Input id="a-name" placeholder={type === "upi" ? t("acc.phUpi") : t("acc.phCash")} {...form.register("name")} />
      </Field>
      {type === "upi" && (
        <Field label={t("acc.upiId")} htmlFor="a-upi" error={e.upiId?.message} hint={t("acc.upiHint")}>
          <Input id="a-upi" placeholder="mandal@okaxis" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" {...form.register("upiId")} />
        </Field>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("acc.opening")} htmlFor="a-open" error={e.openingBalance?.message}>
          <Input id="a-open" inputMode="decimal" {...form.register("openingBalance")} />
        </Field>
        <Field label={t("acc.asOf")} htmlFor="a-opendate">
          <Input id="a-opendate" type="date" {...form.register("openingDate")} />
        </Field>
      </div>
      <FormNote>{t("acc.postedOnce")}</FormNote>
      <SubmitButton pending={pending} icon={<Plus />}>
        {t("acc.create")}
      </SubmitButton>
    </form>
  );
}

export function NewAccountDialog() {
  const t = useT();
  return (
    <FormDialog trigger={<><Plus /> {t("acc.add")}</>} title={t("acc.addTitle")} icon={<Landmark />} tone="emerald" wide>
      <NewAccountForm />
    </FormDialog>
  );
}

const TransferSchema = z.object({ fromAccountId: z.string().min(1), toAccountId: z.string().min(1), amount: rupees, date: z.string().min(10), reference: z.string().max(100).optional(), notes: z.string().max(300).optional() }).refine((v) => v.fromAccountId !== v.toAccountId, { path: ["toAccountId"], message: "acc.v.diff" });

function TransferForm({ accounts }: { accounts: Acc[] }) {
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("trf"));
  const form = useForm<z.infer<typeof TransferSchema>>({ resolver: zodResolver(TransferSchema), defaultValues: { fromAccountId: accounts[0]?._id ?? "", toAccountId: accounts[1]?._id ?? "", amount: "", date: todayISO(), reference: "", notes: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/transfers`, body: { ...v, idempotencyKey: key } }, { success: t("acc.trSaved"), onSuccess: close }))}>
      <FormNote>{t("acc.trNote")}</FormNote>
      <FormError message={error} />
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Field label={t("acc.from")} htmlFor="t-from">
          <NativeSelect id="t-from" {...form.register("fromAccountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <ArrowRight aria-hidden className="mx-auto hidden size-4 text-muted-foreground sm:mb-2.5 sm:block" />
        <Field label={t("acc.to")} htmlFor="t-to" error={e.toAccountId?.message}>
          <NativeSelect id="t-to" {...form.register("toAccountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label={t("acc.amount")} htmlFor="t-amt" error={e.amount?.message}>
        <AmountInput id="t-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("ap.date")} htmlFor="t-date">
          <Input id="t-date" type="date" {...form.register("date")} />
        </Field>
        <Field label={t("acc.notes")} htmlFor="t-notes">
          <Input id="t-notes" placeholder={t("acc.notesPh")} {...form.register("notes")} />
        </Field>
      </div>
      <SubmitButton pending={pending} icon={<ArrowLeftRight />}>
        {t("acc.transfer")}
      </SubmitButton>
    </form>
  );
}

export function TransferDialog({ accounts }: { accounts: Acc[] }) {
  const t = useT();
  return (
    <FormDialog trigger={<><ArrowLeftRight /> {t("acc.transfer")}</>} triggerVariant="outline" title={t("acc.trTitle")} icon={<ArrowLeftRight />} tone="sky" wide>
      <TransferForm accounts={accounts} />
    </FormDialog>
  );
}

const AdjSchema = z.object({ accountId: z.string().min(1), direction: z.enum(["increase", "decrease"]), amount: rupees, date: z.string().min(10), reason: z.string().trim().min(3, "acc.v.reason").max(500) });

function AdjustForm({ accounts }: { accounts: Acc[] }) {
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("adj"));
  const form = useForm<z.infer<typeof AdjSchema>>({ resolver: zodResolver(AdjSchema), defaultValues: { accountId: accounts[0]?._id ?? "", direction: "decrease", amount: "", date: todayISO(), reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  const direction = useWatch({ control: form.control, name: "direction" });
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/adjustments`, body: { ...v, idempotencyKey: key } }, { success: t("acc.adjSaved"), onSuccess: close }))}>
      <FormNote tone="warn">{t("acc.adjNote")}</FormNote>
      <FormError message={error} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("ap.account")} htmlFor="j-acc">
          <NativeSelect id="j-acc" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("acc.direction")}</span>
          <input type="hidden" {...form.register("direction")} />
          <ChoicePills
            label={t("acc.direction")}
            value={direction}
            onChange={(v) => form.setValue("direction", v, { shouldDirty: true })}
            options={[
              { value: "decrease" as const, label: t("acc.decrease"), icon: <Minus /> },
              { value: "increase" as const, label: t("acc.increase"), icon: <Plus /> },
            ]}
          />
        </div>
      </div>
      <Field label={t("acc.amount")} htmlFor="j-amt" error={e.amount?.message}>
        <AmountInput id="j-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("ap.date")} htmlFor="j-date">
          <Input id="j-date" type="date" {...form.register("date")} />
        </Field>
        <Field label={t("ap.reason")} htmlFor="j-reason" error={e.reason?.message}>
          <Input id="j-reason" {...form.register("reason")} />
        </Field>
      </div>
      <SubmitButton pending={pending} variant="destructive" icon={<Scale />}>
        {t("acc.post")}
      </SubmitButton>
    </form>
  );
}

export function AdjustDialog({ accounts }: { accounts: Acc[] }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Scale /> {t("acc.adj")}</>} triggerVariant="ghost" title={t("acc.adjTitle")} icon={<Scale />} tone="violet" wide>
      <AdjustForm accounts={accounts} />
    </FormDialog>
  );
}
