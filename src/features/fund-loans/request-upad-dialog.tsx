"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { Money } from "@/components/app/money";
import { useMoney } from "@/components/app/currency";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate } from "@/lib/api-client";
import { newIdempotencyKey } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useT } from "@/i18n/client";
import { AmountInput, FormNote, SubmitButton } from "@/components/app/form-bits";
import { isTouchDevice } from "@/lib/touch";

/** Member asks for upad. Can't be more than the cash the Mandal has available. */
function Form({ availablePaise, upadOutPaise = 0 }: { availablePaise: number; upadOutPaise?: number }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const t = useT();
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => newIdempotencyKey("ur"));
  const [pending, start] = useTransition();
  const parsed = rupees.safeParse(amount);
  const over = parsed.success && Math.round(Number(parsed.data) * 100) > availablePaise;

  const save = () => {
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (over) return setError(t("upad.overAvailable"));
    start(async () => {
      setError(null);
      const res = await apiMutate({ path: `/orgs/${orgId}/me/upad-requests`, body: { amount: parsed.data, purpose: purpose || undefined, idempotencyKey: key } });
      if (!res.ok) return setError(res.error);
      toast.success(t("upad.requestSent"));
      close();
      router.refresh();
    });
  };

  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <FormError message={error} />
      <div className="bg-hero-warm rounded-2xl px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-white/90">{t("upad.available")}</span>
          <Money paise={availablePaise} className="text-lg font-extrabold tabular-nums" />
        </div>
        {upadOutPaise > 0 && <p className="mt-1 text-xs text-white/85">{t("upad.availableWhy", { fund: money.fmt(availablePaise + upadOutPaise), out: money.fmt(upadOutPaise) })}</p>}
      </div>
      <Field label={t("upad.amountNeeded")} htmlFor="ur-amt" error={over ? t("upad.moreThanAvailable") : undefined}>
        <AmountInput id="ur-amt" autoFocus={!isTouchDevice()} aria-invalid={over || undefined} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label={t("upad.purposeOptional")} htmlFor="ur-purpose">
        <Input id="ur-purpose" maxLength={300} placeholder={t("upad.purposePh")} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      </Field>
      <FormNote>{t("upad.requestNote")}</FormNote>
      <SubmitButton pending={pending} disabled={pending || over || availablePaise <= 0} icon={<Send />}>
        {t("upad.sendRequest")}
      </SubmitButton>
    </form>
  );
}

export function RequestUpadDialog({ availablePaise, upadOutPaise, size = "default", variant = "default", defaultOpen }: { availablePaise: number; upadOutPaise?: number; size?: "default" | "sm"; variant?: "default" | "outline"; defaultOpen?: boolean }) {
  const t = useT();
  return (
    <FormDialog defaultOpen={defaultOpen} trigger={<><HandCoins /> {t("upad.request")}</>} triggerSize={size} triggerVariant={variant} title={t("upad.request")} description={t("upad.requestDesc")} icon={<HandCoins />} tone="orange">
      <Form availablePaise={availablePaise} upadOutPaise={upadOutPaise} />
    </FormDialog>
  );
}
