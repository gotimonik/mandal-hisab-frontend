"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, HandCoins, Loader2, NotebookPen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/app/field";
import { IconChip } from "@/components/app/bits";
import { AmountInput, FormNote, MethodField, MoreOptions, SubmitButton } from "@/components/app/form-bits";
import { apiRead } from "@/app/actions/api";
import { apiMutate } from "@/lib/api-client";
import { newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { useLang, useT } from "@/i18n/client";
import { monthName } from "@/i18n/core";
import { useMoney } from "@/components/app/currency";
import { cn } from "@/lib/utils";

interface Dues {
  member: { _id: string; name: string; membershipNumber: string; status: string };
  hapta: { duePaise: number; months: { installmentId: string; period: string; outstandingPaise: number; lateFeePaise: number }[] };
  interest: { duePaise: number; advancePaise: number; toPayPaise: number; maxPaise: number; loans: { _id: string; number: string; interestDuePaise: number; unpaidMonths: string[] }[] } | null;
  /** Mandals that return upad in fixed installments */
  installment?: { duePaise: number; maxPaise: number; loans: { _id: string; number: string; duePaise: number; outstandingPaise: number; paidCount: number; count: number }[] } | null;
  totalPaise: number;
  methods: string[];
}

/** "1,000.50" / "" → paise; not a valid amount → null. */
const toPaise = (v: string): number | null => {
  const s = v.replace(/[₹,\s]/g, "");
  if (s === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [r, p = ""] = s.split(".");
  return Number(r) * 100 + Number(p.padEnd(2, "0"));
};

/**
 * Collect a member's hapta and upad interest (and the upad installment, where the Mandal has fixed
 * installments) from one screen: the amounts start at what is due, one date and one way of paying;
 * saved as a hapta receipt, an interest receipt and an upad-returned receipt.
 */
export function CollectDuesDialog({ memberId, memberName, duePaise, size = "sm", stacked = false }: { memberId: string; memberName: string; duePaise: number; size?: "xs" | "sm"; /** label over the amount: a narrow button, so the member's name keeps its room on phones */ stacked?: boolean }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Dues | null>(null);
  const [hapta, setHapta] = useState("");
  const [interest, setInterest] = useState("");
  const [inst, setInst] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(() => newIdempotencyKey("mc"));
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    apiRead<Dues>(`/orgs/${orgId}/members/${memberId}/dues`).then((r) => {
      if (!alive) return;
      if (!r.ok) return setError(r.error);
      setD(r.data);
      setHapta(r.data.hapta.duePaise ? paiseToRupeeInput(r.data.hapta.duePaise) : "");
      setInterest(r.data.interest?.toPayPaise ? paiseToRupeeInput(r.data.interest.toPayPaise) : "");
      setInst(r.data.installment?.duePaise ? paiseToRupeeInput(r.data.installment.duePaise) : "");
    });
    return () => {
      alive = false;
    };
  }, [open, orgId, memberId]);

  const h = toPaise(hapta);
  const i = toPaise(interest);
  const k = toPaise(inst);
  const total = (h ?? 0) + (i ?? 0) + (k ?? 0);
  const haptaAhead = d && h ? Math.max(0, h - d.hapta.duePaise) : 0;
  const interestExtra = d?.interest && i ? Math.max(0, i - d.interest.toPayPaise) : 0;
  const nothingDue = !!d && d.hapta.duePaise === 0 && (d.interest?.toPayPaise ?? 0) === 0 && (d.installment?.duePaise ?? 0) === 0;
  const canInstallment = !!d?.installment;
  const badInst = k === null;
  const tooMuchInst = !!d?.installment && (k ?? 0) > d.installment.maxPaise;
  const instAhead = d?.installment && k ? Math.max(0, k - d.installment.duePaise) : 0;
  const canInterest = !!d?.interest;
  const badHapta = h === null;
  const badInterest = i === null;
  const tooMuchInterest = !!d?.interest && (i ?? 0) > d.interest.maxPaise;

  const reset = () => {
    setD(null);
    setHapta("");
    setInterest("");
    setInst("");
    setDate(todayISO());
    setMethod("cash");
    setNote("");
    setError(null);
    setKey(newIdempotencyKey("mc"));
  };

  const save = () => {
    if (badHapta || badInterest || badInst || total <= 0) return;
    start(async () => {
      setError(null);
      const res = await apiMutate({
        path: `/orgs/${orgId}/members/${memberId}/collect`,
        body: { hapta: paiseToRupeeInput(h ?? 0) || "0", interest: paiseToRupeeInput(i ?? 0) || "0", installment: paiseToRupeeInput(k ?? 0) || "0", date, method, note: note.trim() || undefined, idempotencyKey: key },
      });
      if (!res.ok) return setError(res.fieldErrors?.hapta ?? res.error);
      toast.success(t("collect.receivedAll", { name: memberName, amount: money.fmt(total) }));
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  const monthsLabel = useMemo(() => d?.hapta.months.map((m) => m.period).join(", ") ?? "", [d]);

  return (
    <>
      {stacked ? (
        <Button onClick={() => setOpen(true)} aria-label={t("collect.collectFrom", { name: memberName })} className="h-auto shrink-0 flex-col gap-0 rounded-2xl px-3 py-1.5 leading-tight">
          <span className="flex items-center gap-1 text-xs">
            <HandCoins className="size-3.5" /> {t("collect.collect")}
          </span>
          {duePaise > 0 && <span className="text-sm font-bold tabular-nums">{money.short(duePaise)}</span>}
        </Button>
      ) : (
        <Button size={size} onClick={() => setOpen(true)} aria-label={t("collect.collectFrom", { name: memberName })} className="shrink-0">
          <HandCoins /> {t("collect.collect")}
          {duePaise > 0 && <span className="tabular-nums opacity-90">· {money.short(duePaise)}</span>}
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-start gap-3">
            <IconChip tone="emerald" className="mt-0.5">
              <HandCoins />
            </IconChip>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("collect.dues", { name: memberName })}</DialogTitle>
              <DialogDescription>{t("collect.duesDesc")}</DialogDescription>
            </div>
          </DialogHeader>
          {!d ? (
            error ? (
              <FormError message={error} />
            ) : (
              <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("collect.loading")}
              </p>
            )
          ) : (
            <form
              noValidate
              className="grid grid-cols-1 gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <FormError message={error} />
              {nothingDue && <FormNote tone="good">{t("collect.nothingDue", { name: memberName })}</FormNote>}

              {/* what is due */}
              <div className="rounded-xl bg-muted/50 p-3 text-sm">
                <div className="flex items-baseline justify-between gap-3 py-0.5">
                  <span className="min-w-0">
                    {t("collect.haptaDue")}
                    {monthsLabel && <span className="block truncate text-xs text-muted-foreground">{monthsLabel}</span>}
                  </span>
                  <span className="tabular-nums">{money.fmt(d.hapta.duePaise)}</span>
                </div>
                {d.interest && (
                  <div className="flex items-baseline justify-between gap-3 py-0.5">
                    <span className="min-w-0">
                      {t("collect.interestDue")}
                      <span className="block truncate text-xs text-muted-foreground">
                        {d.interest.loans
                          .filter((l) => l.interestDuePaise > 0)
                          .map((l) => `${l.number}${l.unpaidMonths.length ? ` · ${l.unpaidMonths.map((m) => monthName(lang, m, "short")).join(", ")}` : ""}`)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="tabular-nums">{money.fmt(d.interest.toPayPaise)}</span>
                  </div>
                )}
                {d.installment && (
                  <div className="flex items-baseline justify-between gap-3 py-0.5">
                    <span className="min-w-0">
                      {t("collect.installmentDue")}
                      <span className="block truncate text-xs text-muted-foreground">{d.installment.loans.map((l) => `${l.number} · ${l.paidCount}/${l.count}`).join(" · ")}</span>
                    </span>
                    <span className="tabular-nums">{money.fmt(d.installment.duePaise)}</span>
                  </div>
                )}
                {d.interest && d.interest.advancePaise > 0 && d.interest.duePaise > 0 && (
                  <div className="flex items-baseline justify-between gap-3 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                    <span>{t("upad.advanceUsedFirst")}</span>
                    <span className="tabular-nums">− {money.fmt(Math.min(d.interest.advancePaise, d.interest.duePaise))}</span>
                  </div>
                )}
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-foreground/10 pt-1.5 font-semibold">
                  <span>{t("upad.toPay")}</span>
                  <span className="tabular-nums">{money.fmt(d.totalPaise)}</span>
                </div>
              </div>

              {/* what was received */}
              <div className={cn("grid gap-3", canInterest && "grid-cols-2")}>
                <Field label={t("collect.haptaRs")} htmlFor="md-hapta" error={badHapta ? t("collect.badAmount") : undefined}>
                  <AmountInput id="md-hapta" value={hapta} onChange={(e) => setHapta(e.target.value)} placeholder="0" disabled={d.member.status !== "active"} />
                </Field>
                {canInterest && (
                  <Field label={t("collect.interestRs")} htmlFor="md-int" error={badInterest ? t("collect.badAmount") : tooMuchInterest ? `≤ ${money.fmt(d.interest!.maxPaise)}` : undefined}>
                    <AmountInput id="md-int" value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="0" />
                  </Field>
                )}
              </div>
              {canInstallment && (
                <Field label={t("collect.installmentRs")} htmlFor="md-inst" error={badInst ? t("collect.badAmount") : tooMuchInst ? t("collect.installmentMax", { amount: money.fmt(d.installment!.maxPaise) }) : undefined}>
                  <AmountInput id="md-inst" value={inst} onChange={(e) => setInst(e.target.value)} placeholder="0" />
                </Field>
              )}
              {haptaAhead > 0 && <FormNote>{t("collect.haptaAhead", { amount: money.fmt(haptaAhead) })}</FormNote>}
              {instAhead > 0 && !tooMuchInst && <FormNote>{t("collect.installmentAhead", { amount: money.fmt(instAhead) })}</FormNote>}
              {interestExtra > 0 && (
                <FormNote tone="good">
                  <Sparkles className="mr-1 inline size-3.5 align-text-bottom" />
                  {t("upad.keptAsAdvance", { amount: money.fmt(interestExtra) })}
                </FormNote>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("common.dateReceived")} htmlFor="md-date">
                  <Input id="md-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <MethodField methods={d.methods} value={method} onChange={setMethod} label={t("pay.paidBy")} cashLabel={t("pay.method.cash")} upiLabel={t("pay.method.upi")} />
              </div>
              <MoreOptions bare icon={<NotebookPen />} title={t("common.noteOptional")}>
                <Field label={t("common.noteOptional")} htmlFor="md-note">
                  <Input id="md-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
              </MoreOptions>

              <div className="flex items-center justify-between rounded-xl bg-emerald-500/8 px-3 py-2 text-sm ring-1 ring-emerald-500/20">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <HandCoins className="size-4" /> {t("collect.totalRs")}
                </span>
                <span className="text-lg font-bold tabular-nums">{money.fmt(total)}</span>
              </div>
              <SubmitButton pending={pending} icon={<CheckCircle2 />} disabled={total <= 0 || badHapta || badInterest || tooMuchInterest || badInst || tooMuchInst}>
                {t("collect.recordAll")}
              </SubmitButton>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
