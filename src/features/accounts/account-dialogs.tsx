"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeftRight, Loader2, Plus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees, rupeesOrZero } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";

type Acc = { _id: string; name: string };

const NewSchema = z.object({
  name: z.string().trim().min(2, "Name the account").max(80),
  type: z.enum(["cash", "bank", "upi", "other"]),
  bankName: z.string().max(100).optional(),
  accountNumberLast4: z.string().regex(/^(\d{4})?$/, "Last 4 digits only").optional(),
  ifsc: z.string().trim().toUpperCase().regex(/^([A-Z]{4}0[A-Z0-9]{6})?$/, "Invalid IFSC").optional(),
  upiId: z.string().max(100).optional(),
  openingBalance: rupeesOrZero,
  openingDate: z.string().min(10),
});

function NewAccountForm() {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.input<typeof NewSchema>, unknown, z.output<typeof NewSchema>>({ resolver: zodResolver(NewSchema), defaultValues: { name: "", type: "bank", bankName: "", accountNumberLast4: "", ifsc: "", upiId: "", openingBalance: "0", openingDate: todayISO() } });
  const { submit, pending, error } = useApiSubmit(form);
  const type = useWatch({ control: form.control, name: "type" });
  const e = form.formState.errors;
  return (
    <form noValidate className="grid gap-3 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/accounts`, body: v }, { success: "Account created", onSuccess: close }))}>
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label="Account name" htmlFor="a-name" error={e.name?.message}>
        <Input id="a-name" placeholder="e.g. SBI Savings" {...form.register("name")} />
      </Field>
      <Field label="Type" htmlFor="a-type">
        <NativeSelect id="a-type" {...form.register("type")}>
          <option value="bank">Bank account</option>
          <option value="upi">UPI collection</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </NativeSelect>
      </Field>
      {type === "bank" && (
        <>
          <Field label="Bank name" htmlFor="a-bank">
            <Input id="a-bank" {...form.register("bankName")} />
          </Field>
          <Field label="A/c no. (last 4 digits)" htmlFor="a-last4" error={e.accountNumberLast4?.message} hint="Full account numbers are not stored.">
            <Input id="a-last4" inputMode="numeric" maxLength={4} {...form.register("accountNumberLast4")} />
          </Field>
          <Field label="IFSC" htmlFor="a-ifsc" error={e.ifsc?.message}>
            <Input id="a-ifsc" {...form.register("ifsc")} />
          </Field>
        </>
      )}
      {type === "upi" && (
        <Field label="UPI ID" htmlFor="a-upi">
          <Input id="a-upi" {...form.register("upiId")} />
        </Field>
      )}
      <Field label={`Opening balance (${money.symbol})`} htmlFor="a-open" error={e.openingBalance?.message} hint="Posted once as an opening entry; balances are always calculated from the ledger.">
        <Input id="a-open" inputMode="decimal" {...form.register("openingBalance")} />
      </Field>
      <Field label="As of" htmlFor="a-opendate">
        <Input id="a-opendate" type="date" {...form.register("openingDate")} />
      </Field>
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending && <Loader2 className="animate-spin" />} Create account
      </Button>
    </form>
  );
}

export function NewAccountDialog() {
  return (
    <FormDialog trigger={<><Plus /> Add account</>} title="Add a financial account" wide>
      <NewAccountForm />
    </FormDialog>
  );
}

const TransferSchema = z.object({ fromAccountId: z.string().min(1), toAccountId: z.string().min(1), amount: rupees, date: z.string().min(10), reference: z.string().max(100).optional(), notes: z.string().max(300).optional() }).refine((v) => v.fromAccountId !== v.toAccountId, { path: ["toAccountId"], message: "Choose a different account" });

function TransferForm({ accounts }: { accounts: Acc[] }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("trf"));
  const form = useForm<z.infer<typeof TransferSchema>>({ resolver: zodResolver(TransferSchema), defaultValues: { fromAccountId: accounts[0]?._id ?? "", toAccountId: accounts[1]?._id ?? "", amount: "", date: todayISO(), reference: "", notes: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="grid gap-3 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/transfers`, body: { ...v, idempotencyKey: key } }, { success: "Transfer recorded", onSuccess: close }))}>
      <p className="text-sm text-muted-foreground sm:col-span-2">e.g. depositing cash into the bank. Transfers are never counted as income or expense.</p>
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label="From" htmlFor="t-from">
        <NativeSelect id="t-from" {...form.register("fromAccountId")}>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="To" htmlFor="t-to" error={e.toAccountId?.message}>
        <NativeSelect id="t-to" {...form.register("toAccountId")}>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label={`Amount (${money.symbol})`} htmlFor="t-amt" error={e.amount?.message}>
        <Input id="t-amt" inputMode="decimal" {...form.register("amount")} />
      </Field>
      <Field label="Date" htmlFor="t-date">
        <Input id="t-date" type="date" {...form.register("date")} />
      </Field>
      <Field label="Notes" htmlFor="t-notes" className="sm:col-span-2">
        <Input id="t-notes" {...form.register("notes")} />
      </Field>
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending && <Loader2 className="animate-spin" />} Transfer
      </Button>
    </form>
  );
}

export function TransferDialog({ accounts }: { accounts: Acc[] }) {
  return (
    <FormDialog trigger={<><ArrowLeftRight /> Transfer</>} triggerVariant="outline" title="Transfer between accounts" wide>
      <TransferForm accounts={accounts} />
    </FormDialog>
  );
}

const AdjSchema = z.object({ accountId: z.string().min(1), direction: z.enum(["increase", "decrease"]), amount: rupees, date: z.string().min(10), reason: z.string().trim().min(3, "A reason is required").max(500) });

function AdjustForm({ accounts }: { accounts: Acc[] }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("adj"));
  const form = useForm<z.infer<typeof AdjSchema>>({ resolver: zodResolver(AdjSchema), defaultValues: { accountId: accounts[0]?._id ?? "", direction: "decrease", amount: "", date: todayISO(), reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="grid gap-3 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/adjustments`, body: { ...v, idempotencyKey: key } }, { success: "Adjustment posted", onSuccess: close }))}>
      <p className="text-sm text-muted-foreground sm:col-span-2">Use only to correct a balance (e.g. unrecorded bank charges). The adjustment is audited and can be reversed.</p>
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label="Account" htmlFor="j-acc">
        <NativeSelect id="j-acc" {...form.register("accountId")}>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Direction" htmlFor="j-dir">
        <NativeSelect id="j-dir" {...form.register("direction")}>
          <option value="decrease">Decrease balance</option>
          <option value="increase">Increase balance</option>
        </NativeSelect>
      </Field>
      <Field label={`Amount (${money.symbol})`} htmlFor="j-amt" error={e.amount?.message}>
        <Input id="j-amt" inputMode="decimal" {...form.register("amount")} />
      </Field>
      <Field label="Date" htmlFor="j-date">
        <Input id="j-date" type="date" {...form.register("date")} />
      </Field>
      <Field label="Reason" htmlFor="j-reason" error={e.reason?.message} className="sm:col-span-2">
        <Input id="j-reason" {...form.register("reason")} />
      </Field>
      <Button type="submit" disabled={pending} className="sm:col-span-2" variant="destructive">
        {pending && <Loader2 className="animate-spin" />} Post adjustment
      </Button>
    </form>
  );
}

export function AdjustDialog({ accounts }: { accounts: Acc[] }) {
  return (
    <FormDialog trigger={<><Scale /> Adjustment</>} triggerVariant="ghost" title="Balance adjustment" wide>
      <AdjustForm accounts={accounts} />
    </FormDialog>
  );
}
