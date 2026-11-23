"use client";

import { useLang, useT } from "@/i18n/client";
import { monthName, type Key } from "@/i18n/core";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/app/native-select";
import { Field, FormError } from "@/components/app/field";
import { apiMutate } from "@/lib/api-client";
import { DURATIONS, endMonthFor } from "@/lib/months";

const DURATION_KEY: Record<string, Key> = { "": "onb.dur.none", "12": "onb.dur.y1", "24": "onb.dur.y2", "36": "onb.dur.y3", "60": "onb.dur.y5", custom: "onb.dur.custom" };

/** Set, change or remove the last month the Mandal runs. */
export function EndMonthForm({ orgId, endMonth, startMonth, thisMonth }: { orgId: string; endMonth: string | null; startMonth: string; thisMonth: string }) {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const m = (ym: string) => monthName(lang, ym);
  const [duration, setDuration] = useState<string>(endMonth ? "custom" : "");
  const [custom, setCustom] = useState(endMonth ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const next = endMonthFor(startMonth, duration, custom) ?? null;
  const save = () => {
    setError(null);
    if (duration === "custom" && !/^\d{4}-\d{2}$/.test(custom)) return setError(t("setx.em.choose"));
    if (next && next < thisMonth) return setError(t("setx.em.before", { month: m(thisMonth) }));
    start(async () => {
      const r = await apiMutate<{ installmentsCancelled: number; installmentsRestored: number }>({ path: `/orgs/${orgId}/end-month`, method: "PATCH", body: { endMonth: next } });
      if (!r.ok) return setError(r.error);
      toast.success(next ? t("setx.em.done", { month: m(next) }) : t("setx.em.noEnd"));
      router.refresh();
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("setx.em.runsFor")} htmlFor="end-duration" hint={t("setx.em.counted", { month: m(startMonth) })}>
          <NativeSelect id="end-duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
            {DURATIONS.map(([k]) => (
              <option key={k} value={k}>
                {t(DURATION_KEY[k])}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {duration === "custom" && (
          <Field label={t("setx.em.last")} htmlFor="end-month">
            <Input id="end-month" type="month" min={thisMonth} value={custom} onChange={(e) => setCustom(e.target.value)} />
          </Field>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{next ? t("setx.em.lastInfo", { month: m(next) }) : t("setx.em.keepsRunning")}</p>
      <Button onClick={save} disabled={pending || next === endMonth} className="self-start">
        {pending && <Loader2 className="animate-spin" />} {t("setx.save")}
      </Button>
    </div>
  );
}
