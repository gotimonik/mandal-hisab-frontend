"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/app/native-select";
import { Field, FormError } from "@/components/app/field";
import { apiMutate } from "@/lib/api-client";
import { DURATIONS, endMonthFor, monthLabelYM } from "@/lib/months";

/** Set, change or remove the last month the Mandal runs. */
export function EndMonthForm({ orgId, endMonth, startMonth, thisMonth }: { orgId: string; endMonth: string | null; startMonth: string; thisMonth: string }) {
  const router = useRouter();
  const [duration, setDuration] = useState<string>(endMonth ? "custom" : "");
  const [custom, setCustom] = useState(endMonth ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const next = endMonthFor(startMonth, duration, custom) ?? null;
  const save = () => {
    setError(null);
    if (duration === "custom" && !/^\d{4}-\d{2}$/.test(custom)) return setError("Choose the last month");
    if (next && next < thisMonth) return setError(`That would end the Mandal before this month (${monthLabelYM(thisMonth)})`);
    start(async () => {
      const r = await apiMutate<{ installmentsCancelled: number; installmentsRestored: number }>({ path: `/orgs/${orgId}/end-month`, method: "PATCH", body: { endMonth: next } });
      if (!r.ok) return setError(r.error);
      toast.success(next ? `The Mandal now runs until ${monthLabelYM(next)}` : "No end date");
      router.refresh();
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Runs for" htmlFor="end-duration" hint={`Counted from the first hapta month (${monthLabelYM(startMonth)}).`}>
          <NativeSelect id="end-duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
            {DURATIONS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {duration === "custom" && (
          <Field label="Last month" htmlFor="end-month">
            <Input id="end-month" type="month" min={thisMonth} value={custom} onChange={(e) => setCustom(e.target.value)} />
          </Field>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{next ? `Last hapta month: ${monthLabelYM(next)}. No hapta is created after it; unpaid hapta after it is cancelled.` : "The Mandal keeps running with no end date."}</p>
      <Button onClick={save} disabled={pending || next === endMonth} className="self-start">
        {pending && <Loader2 className="animate-spin" />} Save
      </Button>
    </div>
  );
}
