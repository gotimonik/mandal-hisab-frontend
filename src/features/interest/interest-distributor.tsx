"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { apiMutate } from "@/app/actions/api";
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

const BASIS_LABEL: Record<string, string> = {
  previous_month_closing: "Balance at the end of the previous month",
  hapta_contributions: "Hapta paid up to the end of the previous month (no compounding)",
};

/**
 * Preview → (edit, in manual mode) → finalize. Nothing is credited until "Credit interest".
 * The server recalculates rate-mode amounts and refuses members already credited for the month.
 */
export function InterestDistributor({ defaults, defaultPeriod }: { defaults: InterestSettings; defaultPeriod: string }) {
  const money = useMoney();
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
      toast.success(`Interest for ${period} credited`);
      setPreview(null);
      setNote("");
      router.refresh();
    });

  return (
    <Card className="gap-4 p-4 sm:p-5">
      <div>
        <h2 className="font-medium">Credit monthly interest</h2>
        <p className="text-sm text-muted-foreground">Interest is added to each member&apos;s balance. No cash moves until a member withdraws.</p>
      </div>
      <FormError message={error} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Month" htmlFor="i-period">
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
        <Field label="Method" htmlFor="i-mode">
          <NativeSelect
            id="i-mode"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "manual" | "rate");
              invalidate();
            }}
          >
            <option value="rate">Rate % per month</option>
            <option value="manual">Enter amounts manually</option>
          </NativeSelect>
        </Field>
        {mode === "rate" && (
          <>
            <Field label="Rate (% per month)" htmlFor="i-rate">
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
            <Field label="Calculated on" htmlFor="i-basis">
              <NativeSelect
                id="i-basis"
                value={basis}
                onChange={(e) => {
                  setBasis(e.target.value as InterestSettings["basis"]);
                  invalidate();
                }}
              >
                <option value="previous_month_closing">Previous month closing balance</option>
                <option value="hapta_contributions">Hapta contributions only</option>
              </NativeSelect>
            </Field>
          </>
        )}
      </div>
      <Button variant="secondary" className="justify-self-start" onClick={runPreview} disabled={pending}>
        {pending && !preview ? <Loader2 className="animate-spin" /> : <Calculator />} Preview
      </Button>

      {preview && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            {preview.mode === "rate" ? (
              <>
                {preview.monthlyRate}% of the eligible balance — {BASIS_LABEL[preview.basis ?? ""]} ({formatDate(preview.basisDate)}). Rounded to the nearest paisa.
              </>
            ) : (
              <>Enter the interest for each member. Leave blank for none.</>
            )}{" "}
            Credited on {formatDate(preview.creditDate)}.
            {preview.alreadyCreditedCount > 0 && <span className="text-warning-ink"> {preview.alreadyCreditedCount} member(s) were already credited for this month and are skipped.</span>}
          </p>
          <div className="divide-y rounded-lg border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Member</span>
              <span className="w-28 text-right">{preview.mode === "rate" ? "Eligible balance" : "Balance now"}</span>
              <span className="w-28 text-right">Interest</span>
            </div>
            {preview.rows.map((r) => (
              <div key={r.memberId} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2 text-sm ${r.alreadyCredited ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.alreadyCredited ? "Already credited" : r.membershipNumber}</div>
                </div>
                <Money paise={preview.mode === "rate" ? r.eligibleBalancePaise : r.currentBalancePaise} className="w-28 text-right" />
                <div className="w-28 text-right">
                  {preview.mode === "manual" && !r.alreadyCredited ? (
                    <Input aria-label={`Interest for ${r.name}`} inputMode="decimal" className="h-7 text-right" placeholder="0" value={manual[r.memberId] ?? ""} onChange={(e) => setManual((m) => ({ ...m, [r.memberId]: e.target.value }))} />
                  ) : (
                    <Money paise={r.interestPaise} className="font-medium" />
                  )}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto] px-3 py-2 text-sm font-semibold">
              <span>Total to credit</span>
              <Money paise={total} />
            </div>
          </div>
          <Field label="Note (optional)" htmlFor="i-note">
            <Input id="i-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. As decided in the monthly meeting" />
          </Field>
          <Button onClick={finalize} disabled={pending || total <= 0} className="justify-self-start">
            {pending && <Loader2 className="animate-spin" />} Credit {total ? money.short(total) : ""} interest
          </Button>
          <p className="text-xs text-muted-foreground">Once credited, interest can&apos;t be edited or credited again for this month. Corrections are made as member balance adjustments.</p>
        </div>
      )}
    </Card>
  );
}
