"use client";

import { useLang, useT } from "@/i18n/client";
import { monthName, type Key } from "@/i18n/core";
import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calculator, CheckCircle2, Loader2, Percent } from "lucide-react";
import { IconChip, MemberAvatar } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { apiMutate } from "@/lib/api-client";
import { formatDate, newIdempotencyKey } from "@/lib/format";
import { rupeesOrZero } from "@/lib/schemas";
import type { InterestSettings } from "@/lib/types";
import { useMoney } from "@/components/app/currency";

interface PreviewRow {
  memberId: string;
  name: string;
  membershipNumber: string;
  currentBalancePaise: number;
  eligibleBalancePaise: number | null;
  interestPaise: number;
  alreadyCredited: boolean;
}
interface Preview {
  period: string;
  mode: "manual" | "rate";
  monthlyRate: string | null;
  basis: string | null;
  basisDate: string;
  creditDate: string;
  rows: PreviewRow[];
  totalPaise: number;
  alreadyCreditedCount: number;
}

const BASIS_LABEL: Record<string, Key> = {
  previous_month_closing: "int.b.prev",
  hapta_contributions: "int.b.hapta",
};

/**
 * Preview → (edit, in manual mode) → finalize. Nothing is credited until "Credit interest".
 * The server recalculates rate-mode amounts and refuses members already credited for the month.
 */
export function InterestDistributor({ defaults, defaultPeriod }: { defaults: InterestSettings; defaultPeriod: string }) {
  const money = useMoney();
  const tr = useT();
  const lang = useLang();
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const [period, setPeriod] = useState(defaultPeriod);
  const [mode, setMode] = useState<"manual" | "rate">(defaults.defaultMode);
  const [rate, setRate] = useState(defaults.monthlyRate);
  const [basis, setBasis] = useState(defaults.basis);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [manual, setManual] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(() => newIdempotencyKey("int"));
  const [pending, start] = useTransition();

  const invalidate = () => setPreview(null);

  const runPreview = () =>
    start(async () => {
      setError(null);
      const res = await apiMutate<Preview>({ path: `/orgs/${orgId}/interest/preview`, body: { period, mode, monthlyRate: mode === "rate" ? rate : undefined, basis: mode === "rate" ? basis : undefined } });
      if (!res.ok) return setError(res.fieldErrors?.monthlyRate ?? res.error);
      setPreview(res.data);
      setManual({});
      setKey(newIdempotencyKey("int"));
    });

  const manualTotal = preview
    ? preview.rows.reduce((t, r) => {
        const p = rupeesOrZero.safeParse(manual[r.memberId] ?? "");
        return t + (p.success && !r.alreadyCredited ? Math.round(Number(p.data) * 100) : 0);
      }, 0)
    : 0;
  const total = mode === "manual" ? manualTotal : (preview?.totalPaise ?? 0);

  const finalize = () =>
    start(async () => {
      if (!preview) return;
      setError(null);
      const entries =
        mode === "manual"
          ? preview.rows
              .filter((r) => !r.alreadyCredited && (manual[r.memberId] ?? "").trim() !== "")
              .map((r) => ({ memberId: r.memberId, amount: rupeesOrZero.parse(manual[r.memberId]) }))
          : [];
      const res = await apiMutate({ path: `/orgs/${orgId}/interest/runs`, body: { period, mode, monthlyRate: mode === "rate" ? rate : undefined, basis: mode === "rate" ? basis : undefined, entries, note: note || undefined, idempotencyKey: key } });
      if (!res.ok) return setError(res.error);
      toast.success(tr("int.d.done", { period: /^\d{4}-\d{2}$/.test(period) ? monthName(lang, period) : period }));
      setPreview(null);
      setNote("");
      router.refresh();
    });

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5">
      <div className="flex items-start gap-3">
        <IconChip tone="pink">
          <Percent />
        </IconChip>
        <div>
          <h2 className="text-base font-bold">{tr("int.d.title")}</h2>
          <p className="text-sm text-muted-foreground">{tr("int.d.desc")}</p>
        </div>
      </div>
      <ol className="flex items-center gap-2 text-xs font-semibold text-muted-foreground" aria-label={tr("int.d.steps")}>
        {[tr("int.d.s1"), tr("int.d.s2"), tr("int.d.s3")].map((l, i) => {
          const on = i === 0 ? !preview : i === 1 ? !!preview : false;
          return (
            <li key={l} className="flex items-center gap-2">
              {i > 0 && <span className="h-px w-5 bg-border" />}
              <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1", on ? "bg-primary/10 text-primary" : "bg-muted")}>
                <span className={cn("flex size-4 items-center justify-center rounded-full text-[10px]", on ? "bg-primary text-primary-foreground" : "bg-foreground/10")}>{i + 1}</span>
                {l}
              </span>
            </li>
          );
        })}
      </ol>
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-4">
        <Field label={tr("int.month")} htmlFor="i-period">
          <Input
            id="i-period"
            type="month"
            value={period}
            max={defaultPeriod}
            onChange={(e) => {
              setPeriod(e.target.value);
              invalidate();
            }}
          />
        </Field>
        <Field label={tr("int.method")} htmlFor="i-mode">
          <NativeSelect
            id="i-mode"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "manual" | "rate");
              invalidate();
            }}
          >
            <option value="rate">{tr("int.d.rateOpt")}</option>
            <option value="manual">{tr("int.d.manualOpt")}</option>
          </NativeSelect>
        </Field>
        {mode === "rate" && (
          <>
            <Field label={tr("int.d.rate")} htmlFor="i-rate">
              <Input
                id="i-rate"
                inputMode="decimal"
                value={rate}
                onChange={(e) => {
                  setRate(e.target.value);
                  invalidate();
                }}
              />
            </Field>
            <Field label={tr("int.d.on")} htmlFor="i-basis">
              <NativeSelect
                id="i-basis"
                value={basis}
                onChange={(e) => {
                  setBasis(e.target.value as InterestSettings["basis"]);
                  invalidate();
                }}
              >
                <option value="previous_month_closing">{tr("int.d.onPrev")}</option>
                <option value="hapta_contributions">{tr("int.d.onHapta")}</option>
              </NativeSelect>
            </Field>
          </>
        )}
      </div>
      <Button variant={preview ? "outline" : "default"} className="self-start" onClick={runPreview} disabled={pending}>
        {pending && !preview ? <Loader2 className="animate-spin" /> : <Calculator />} {preview ? tr("int.d.again") : tr("int.d.preview")}
      </Button>

      {preview && (
        <div className="flex flex-col gap-3">
          <p className="rounded-xl bg-sky-500/8 px-3 py-2.5 text-sm text-muted-foreground">
            {preview.mode === "rate" ? (
              <>
                {tr("int.d.rateInfo", { rate: preview.monthlyRate ?? "", basis: BASIS_LABEL[preview.basis ?? ""] ? tr(BASIS_LABEL[preview.basis ?? ""]) : "", date: formatDate(preview.basisDate) })}
              </>
            ) : (
              <>{tr("int.d.manualInfo")}</>
            )}{" "}
            {tr("int.d.creditedOn", { date: formatDate(preview.creditDate) })}
            {preview.alreadyCreditedCount > 0 && <span className="text-warning-ink">{tr("int.d.skipped", { n: preview.alreadyCreditedCount })}</span>}
          </p>
          <div className="divide-y overflow-hidden rounded-2xl ring-1 ring-foreground/[0.08]">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>{tr("int.d.member")}</span>
              <span className="w-24 text-right sm:w-28">{preview.mode === "rate" ? tr("int.d.eligible") : tr("int.d.now")}</span>
              <span className="w-24 text-right sm:w-28">{tr("int.d.interest")}</span>
            </div>
            {preview.rows.map((r) => (
              <div key={r.memberId} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2 text-sm ${r.alreadyCredited ? "opacity-60" : ""}`}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <MemberAvatar name={r.name} size="sm" />
                  <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.alreadyCredited ? tr("int.d.already") : r.membershipNumber}</div>
                  </div>
                </div>
                <Money paise={preview.mode === "rate" ? r.eligibleBalancePaise : r.currentBalancePaise} className="w-24 text-right sm:w-28" />
                <div className="w-24 text-right sm:w-28">
                  {preview.mode === "manual" && !r.alreadyCredited ? (
                    <Input aria-label={tr("int.d.forX", { name: r.name })} inputMode="decimal" className="h-7 text-right" placeholder="0" value={manual[r.memberId] ?? ""} onChange={(e) => setManual((m) => ({ ...m, [r.memberId]: e.target.value }))} />
                  ) : (
                    <Money paise={r.interestPaise} className="font-medium" />
                  )}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto] bg-pink-500/8 px-3 py-2.5 text-sm font-bold">
              <span>{tr("int.d.totalCredit")}</span>
              <Money paise={total} />
            </div>
          </div>
          <Field label={tr("ap.noteOpt")} htmlFor="i-note">
            <Input id="i-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr("int.d.notePh")} />
          </Field>
          <Button onClick={finalize} disabled={pending || total <= 0} size="lg" className="h-11 w-full rounded-2xl sm:w-auto sm:self-start">
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {tr("int.d.credit", { amount: total ? money.short(total) : "" })}
          </Button>
          <p className="text-xs text-muted-foreground">{tr("int.d.final")}</p>
        </div>
      )}
    </section>
  );
}
