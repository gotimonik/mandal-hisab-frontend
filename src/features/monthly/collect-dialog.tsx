"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, HandCoins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/app/field";
import { Money } from "@/components/app/money";
import { apiMutate } from "@/lib/api-client";
import { newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useT } from "@/i18n/client";
import { useMoney } from "@/components/app/currency";

/**
 * Quick cash entry for one member's month. Defaults to the full outstanding amount; a smaller
 * amount is recorded as a part payment. If the same amount was already recorded on the same
 * date the server asks for confirmation (possible double entry).
 */
export function CollectDialog({ installmentId, memberName, period, outstandingPaise, size = "xs", showAmount = false }: { installmentId: string; memberName: string; period: string; outstandingPaise: number; size?: "xs" | "sm"; showAmount?: boolean }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(paiseToRupeeInput(outstandingPaise));
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [key, setKey] = useState(() => newIdempotencyKey("col"));
  const [error, setError] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reset = () => {
    setAmount(paiseToRupeeInput(outstandingPaise));
    setDate(todayISO());
    setNote("");
    setError(null);
    setDupWarning(null);
    setKey(newIdempotencyKey("col"));
  };

  const save = (confirmDuplicate: boolean) => {
    const parsed = rupees.safeParse(amount);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    start(async () => {
      setError(null);
      const res = await apiMutate({ path: `/orgs/${orgId}/monthly/collect`, body: { installmentId, amount: parsed.data, date, note: note || undefined, idempotencyKey: key, confirmDuplicate } });
      if (!res.ok) {
        if (res.code === "DUPLICATE_SUSPECTED") return setDupWarning(res.error);
        return setError(res.fieldErrors?.amount ?? res.error);
      }
      toast.success(t("collect.received", { name: memberName }));
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)} aria-label={t("collect.collectFrom", { name: memberName })} className={cn(showAmount && "h-10 rounded-xl px-3.5 text-sm md:h-9")}>
        <HandCoins /> {showAmount ? money.short(outstandingPaise) : t("collect.collect")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("collect.cashFrom", { name: memberName })}</DialogTitle>
            <DialogDescription>
              {t("collect.outstanding", { period })} <Money paise={outstandingPaise} className="font-medium text-foreground" />
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="grid grid-cols-1 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save(false);
            }}
          >
            <FormError message={error} />
            <Field label={t("common.amountRs")} htmlFor="col-amt" hint={t("collect.partHint")}>
              <Input id="col-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl text-center text-2xl font-bold tabular-nums md:h-12 md:text-xl" />
            </Field>
            <div className="flex flex-wrap gap-2" aria-label={t("collect.shortcuts")}>
              {[
                [t("collect.full"), outstandingPaise],
                [t("collect.half"), Math.round(outstandingPaise / 200) * 100],
              ]
                .filter(([, p]) => (p as number) > 0)
                .map(([l, p]) => (
                  <button
                    key={l as string}
                    type="button"
                    onClick={() => setAmount(paiseToRupeeInput(p as number))}
                    className={cn("rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-foreground/10", amount === paiseToRupeeInput(p as number) ? "bg-primary text-primary-foreground ring-primary" : "bg-card hover:bg-muted")}
                  >
                    {l} · {money.short(p as number)}
                  </button>
                ))}
            </div>
            <Field label={t("common.dateReceived")} htmlFor="col-date">
              <Input id="col-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t("common.noteOptional")} htmlFor="col-note">
              <Input id="col-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            {dupWarning ? (
              <div role="alert" className="flex flex-col gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
                <p>{dupWarning}</p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setDupWarning(null)} disabled={pending}>
                    {t("collect.goBack")}
                  </Button>
                  <Button type="button" size="sm" onClick={() => save(true)} disabled={pending}>
                    {pending && <Loader2 className="animate-spin" />} {t("collect.recordSecond")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="submit" size="lg" disabled={pending} className="w-full">
                {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {t("collect.record")}
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
