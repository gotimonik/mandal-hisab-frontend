"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { formatDate, formatINR } from "@/lib/format";

function VerifyForm({ paymentId, accounts, accountId, summary, path }: { paymentId: string; accounts: { _id: string; name: string }[]; accountId?: string | null; summary: string; path: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [acc, setAcc] = useState(accountId ?? accounts[0]?._id ?? "");
  const form = useForm();
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">{summary}</p>
      <FormError message={error} />
      <Field label="Received into account" htmlFor={`va-${paymentId}`}>
        <NativeSelect id={`va-${paymentId}`} value={acc} onChange={(e) => setAcc(e.target.value)}>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <p className="text-xs text-muted-foreground">Verifying posts the amount to the ledger, updates the member&apos;s installments and issues a receipt.</p>
      <Button disabled={pending || !acc} onClick={() => submit({ path: `/orgs/${orgId}${path}`, body: { accountId: acc } }, { success: "Verified — receipt issued", onSuccess: close })}>
        {pending && <Loader2 className="animate-spin" />} Verify
      </Button>
    </div>
  );
}

export function VerifyDialog(props: { paymentId: string; accounts: { _id: string; name: string }[]; accountId?: string | null; payer: string; amountPaise: number; date: string; path: string }) {
  return (
    <FormDialog trigger={<><Check /> Verify</>} triggerSize="xs" title="Verify payment">
      <VerifyForm {...props} summary={`${props.payer} · ${formatINR(props.amountPaise)} · ${formatDate(props.date)}`} />
    </FormDialog>
  );
}
