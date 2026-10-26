"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { Money } from "@/components/app/money";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate } from "@/app/actions/api";
import { newIdempotencyKey } from "@/lib/format";
import { rupees } from "@/lib/schemas";

/** Member asks for upad. Can't be more than the cash the Mandal has available. */
function Form({ availablePaise }: { availablePaise: number }) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => newIdempotencyKey("ur"));
  const [pending, start] = useTransition();
  const parsed = rupees.safeParse(amount);
  const over = parsed.success && Math.round(Number(parsed.data) * 100) > availablePaise;

  const save = () => {
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (over) return setError("That's more than the Mandal has available right now");
    start(async () => {
      setError(null);
      const res = await apiMutate({ path: `/orgs/${orgId}/me/upad-requests`, body: { amount: parsed.data, purpose: purpose || undefined, idempotencyKey: key } });
      if (!res.ok) return setError(res.error);
      toast.success("Request sent to the admin");
      close();
      router.refresh();
    });
  };

  return (
    <form
      noValidate
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <FormError message={error} />
      <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
        <span>Available in the Mandal</span>
        <Money paise={availablePaise} className="font-semibold" />
      </div>
      <Field label="Amount needed (₹)" htmlFor="ur-amt" error={over ? "More than what's available" : undefined}>
        <Input id="ur-amt" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Purpose (optional)" htmlFor="ur-purpose">
        <Input id="ur-purpose" maxLength={300} placeholder="e.g. School fees" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      </Field>
      <p className="text-xs text-muted-foreground">The admin approves or rejects your request. Once given, interest is due every month from next month on the amount you still owe.</p>
      <Button type="submit" disabled={pending || over || availablePaise <= 0}>
        {pending && <Loader2 className="animate-spin" />} Send request
      </Button>
    </form>
  );
}

export function RequestUpadDialog({ availablePaise, size = "default", variant = "default", defaultOpen }: { availablePaise: number; size?: "default" | "sm"; variant?: "default" | "outline"; defaultOpen?: boolean }) {
  return (
    <FormDialog defaultOpen={defaultOpen} trigger={<><HandCoins /> Request upad</>} triggerSize={size} triggerVariant={variant} title="Request upad" description="Ask the Mandal for upad from its available cash.">
      <Form availablePaise={availablePaise} />
    </FormDialog>
  );
}
