"use client";

import { useT } from "@/i18n/client";
import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Landmark, Loader2, Paperclip, Receipt, SlidersHorizontal, Wallet, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { AmountInput, ChoicePills, FormNote, MoreOptions, SubmitButton, MethodController } from "@/components/app/form-bits";
import { useApiSubmit } from "@/components/app/use-api-form";
import { uploadAttachment } from "@/app/actions/api";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";

const Schema = z
  .object({
    categoryKey: z.string().min(2, "exp.v.cat"),
    payeeName: z.string().trim().min(2, "exp.v.payee").max(120),
    description: z.string().trim().min(2, "exp.v.desc").max(500),
    amount: rupees,
    date: z.string().min(10),
    method: z.string(),
    reference: z.string().max(100).optional(),
    paidBy: z.enum(["organization", "out_of_pocket"]),
    accountId: z.string().optional(),
    eventName: z.string().max(120).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.paidBy === "organization" && !v.accountId) ctx.addIssue({ code: "custom", path: ["accountId"], message: "exp.v.account" });
  });

type Att = { url: string; name: string; contentType: string; size: number };

function Form({ accounts, methods, categories, thresholdPaise }: { accounts: { _id: string; name: string }[]; methods: string[]; categories: { key: string; name: string }[]; thresholdPaise: number }) {
  const money = useMoney();
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("exp"));
  const [atts, setAtts] = useState<Att[]>([]);
  const [uploading, startUpload] = useTransition();
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { categoryKey: categories[0]?.key ?? "", payeeName: "", description: "", amount: "", date: todayISO(), method: methods[0], reference: "", paidBy: "organization", accountId: accounts[0]?._id ?? "", eventName: "" },
  });
  const { submit, pending, error, setError } = useApiSubmit(form);
  const paidBy = useWatch({ control: form.control, name: "paidBy" });
  const e = form.formState.errors;
  const optionsHaveError = !!(e.reference || e.eventName);
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={form.handleSubmit((v) =>
        submit<{ expense: { status: string } }>(
          { path: `/orgs/${orgId}/expenses`, body: { ...v, accountId: v.paidBy === "organization" ? v.accountId : null, eventName: v.eventName || undefined, reference: v.reference || undefined, attachments: atts, idempotencyKey: key } },
          { success: t("exp.saved"), onSuccess: close },
        ),
      )}
    >
      <FormError message={error} />
      <Field label={t("exp.amount")} htmlFor="x-amt" error={e.amount?.message} hint={thresholdPaise > 0 ? t("exp.above", { amount: money.fmt(thresholdPaise) }) : t("exp.needsApproval")}>
        <AmountInput id="x-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("ap.category")} htmlFor="x-cat" error={e.categoryKey?.message}>
          <NativeSelect id="x-cat" {...form.register("categoryKey")}>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("ap.date")} htmlFor="x-date">
          <Input id="x-date" type="date" {...form.register("date")} />
        </Field>
        <Field label={t("exp.paidTo")} htmlFor="x-payee" error={e.payeeName?.message}>
          <Input id="x-payee" {...form.register("payeeName")} />
        </Field>
        <Field label={t("ap.description")} htmlFor="x-desc" error={e.description?.message}>
          <Input id="x-desc" {...form.register("description")} />
        </Field>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("exp.paidBy")}</span>
        <input type="hidden" {...form.register("paidBy")} />
        <ChoicePills
          label={t("exp.paidBy")}
          value={paidBy}
          onChange={(v) => form.setValue("paidBy", v, { shouldDirty: true })}
          options={[
            { value: "organization" as const, label: t("exp.org"), icon: <Landmark /> },
            { value: "out_of_pocket" as const, label: t("exp.oopOpt"), icon: <Wallet /> },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {paidBy === "organization" && (
          <Field label={t("exp.fromAccount")} htmlFor="x-acc" error={e.accountId?.message}>
            <NativeSelect id="x-acc" {...form.register("accountId")}>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
        <MethodController control={form.control} methods={methods} />
      </div>
      {paidBy === "out_of_pocket" && <FormNote>{t("exp.oopNote")}</FormNote>}
      <MoreOptions bare icon={<SlidersHorizontal />} title={t("exp.more")} description={atts.length > 0 ? (atts.length === 1 ? t("exp.file1") : t("exp.filesN", { n: atts.length })) : t("exp.moreDesc")} defaultOpen={optionsHaveError || atts.length > 0}>
        <Field label={t("exp.ref")} htmlFor="x-ref">
          <Input id="x-ref" {...form.register("reference")} />
        </Field>
        <Field label={t("exp.eventOpt")} htmlFor="x-event">
          <Input id="x-event" {...form.register("eventName")} />
        </Field>
        <Field label={t("exp.bill")} htmlFor="x-file" hint={t("exp.billHint")} className="sm:col-span-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-secondary/30 px-3 py-3 text-sm font-medium hover:bg-secondary/50">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />} {t("exp.attach")}
            <input
              id="x-file"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                ev.target.value = "";
                if (!f) return;
                const fd = new FormData();
                fd.set("file", f);
                startUpload(async () => {
                  const r = await uploadAttachment(orgId, fd);
                  if (!r.ok) return setError(r.error);
                  setAtts((a) => [...a, r.data]);
                });
              }}
            />
          </label>
        </Field>
        {atts.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-xs sm:col-span-2">
            {atts.map((a, i) => (
              <li key={a.url} className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5">
                <Paperclip className="size-3.5 shrink-0" /> <span className="min-w-0 flex-1 truncate">{a.name}</span>
                <button type="button" aria-label={t("exp.removeX", { name: a.name })} onClick={() => setAtts((x) => x.filter((_, j) => j !== i))} className="rounded-full p-0.5 hover:bg-muted">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </MoreOptions>
      <SubmitButton pending={pending} disabled={pending || uploading} icon={<Receipt />}>
        {t("exp.submit")}
      </SubmitButton>
    </form>
  );
}

export function ExpenseDialog(props: { accounts: { _id: string; name: string }[]; methods: string[]; categories: { key: string; name: string }[]; thresholdPaise: number }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Receipt /> {t("exp.add")}</>} title={t("exp.recordTitle")} icon={<Receipt />} tone="orange" wide>
      <Form {...props} />
    </FormDialog>
  );
}

export function ReimburseDialog({ expenseId, accounts, payee, amountPaise }: { expenseId: string; accounts: { _id: string; name: string }[]; payee: string; amountPaise: number }) {
  const money = useMoney();
  const t = useT();
  return (
    <FormDialog trigger={t("exp.reimburse")} triggerVariant="outline" triggerSize="xs" title={t("exp.reimburseTitle")} icon={<Wallet />} tone="emerald">
      <ReimburseForm expenseId={expenseId} accounts={accounts} summary={`${payee} · ${money.fmt(amountPaise)}`} />
    </FormDialog>
  );
}

function ReimburseForm({ expenseId, accounts, summary }: { expenseId: string; accounts: { _id: string; name: string }[]; summary: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const t = useT();
  const close = useDialogClose();
  const form = useForm({ defaultValues: { accountId: accounts[0]?._id ?? "", date: todayISO() } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/expenses/${expenseId}/reimburse`, body: v }, { success: t("exp.reimbursed"), onSuccess: close }))}>
      <div className="rounded-2xl bg-muted/60 px-3 py-2.5 text-sm font-semibold">{summary}</div>
      <FormError message={error} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("exp.payFrom")} htmlFor="rb-acc">
          <NativeSelect id="rb-acc" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("ap.date")} htmlFor="rb-date">
          <Input id="rb-date" type="date" {...form.register("date")} />
        </Field>
      </div>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {t("exp.record")}
      </SubmitButton>
    </form>
  );
}
