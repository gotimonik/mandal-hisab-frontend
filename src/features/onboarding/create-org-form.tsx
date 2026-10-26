"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, ChevronDown, Landmark, Loader2, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { IconChip } from "@/components/app/bits";
import { useApiSubmit } from "@/components/app/use-api-form";
import { optionalRupees } from "@/lib/schemas";
import { todayISO } from "@/lib/format";
import { DURATIONS, endMonthFor } from "@/lib/months";
import { CURRENCIES, DEFAULT_CURRENCY, moneyFmt } from "@/lib/currency";
import { useLang, useT } from "@/i18n/client";
import { intlLocale, monthName, type Key } from "@/i18n/core";
import type { Tone } from "@/lib/tones";

const Schema = z
  .object({
    name: z.string().trim().min(3, "Enter the Mandal name").max(120),
    description: z.string().trim().max(500).optional(),
    currency: z.string().length(3),
    monthlyHaptaAmount: optionalRupees,
    haptaStartMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a month"),
    haptaDueDay: z.coerce.number().int().min(1, "1–28").max(28, "1–28"),
    duration: z.string(),
    customEndMonth: z.string().optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    contactPhone: z.string().trim().max(20).optional(),
    registrationNumber: z.string().trim().max(100).optional(),
    financialYearStartMonth: z.coerce.number().int().min(1).max(12),
  })
  .refine((v) => v.duration !== "custom" || /^\d{4}-(0[1-9]|1[0-2])$/.test(v.customEndMonth ?? ""), { message: "Choose the last month", path: ["customEndMonth"] })
  .refine((v) => v.duration !== "custom" || (v.customEndMonth ?? "") >= v.haptaStartMonth, { message: "Must be on or after the first hapta month", path: ["customEndMonth"] });

const DURATION_KEY: Record<string, Key> = { "": "onb.dur.none", "12": "onb.dur.y1", "24": "onb.dur.y2", "36": "onb.dur.y3", "60": "onb.dur.y5", custom: "onb.dur.custom" };

/** One titled block of the form: coloured icon, heading, then its fields. */
function Section({ icon, tone, title, children }: { icon: React.ReactNode; tone: Tone; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-4 ring-1 ring-foreground/[0.05]">
      <h3 className="flex items-center gap-2.5 text-[15px] font-bold">
        <IconChip tone={tone} size="sm">
          {icon}
        </IconChip>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** "Start a new Mandal": name & currency, monthly hapta, then optional details folded away. */
export function CreateOrgForm() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const form = useForm<z.input<typeof Schema>, unknown, z.output<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", description: "", currency: DEFAULT_CURRENCY, monthlyHaptaAmount: "", haptaStartMonth: todayISO().slice(0, 7), haptaDueDay: 10, duration: "", customEndMonth: "", city: "", state: "", contactPhone: "", registrationNumber: "", financialYearStartMonth: 4 },
  });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  const money = moneyFmt(form.watch("currency"));
  const end = endMonthFor(form.watch("haptaStartMonth"), form.watch("duration"), form.watch("customEndMonth"));
  const months = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(intlLocale(lang), { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, i, 1))));
  const custom = form.watch("duration") === "custom";

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((v) =>
        submit<{ id: string }>(
          {
            path: "/organizations",
            body: (({ duration, customEndMonth, ...rest }) => ({ ...rest, description: v.description || undefined, monthlyHaptaAmount: v.monthlyHaptaAmount || undefined, endMonth: endMonthFor(v.haptaStartMonth, duration, customEndMonth) }))(v),
          },
          { success: t("onb.registered"), onSuccess: (o) => router.push(`/org/${o.id}`) },
        ),
      )}
    >
      <FormError message={error} />

      <Section icon={<Landmark />} tone="indigo" title={t("onb.secBasics")}>
        <Field label={t("onb.name")} htmlFor="org-name" error={e.name?.message}>
          <Input id="org-name" autoComplete="organization" {...form.register("name")} aria-invalid={!!e.name} />
        </Field>
        <Field label={t("onb.desc")} htmlFor="org-desc">
          <Textarea id="org-desc" rows={2} maxLength={500} placeholder={t("onb.descPh")} {...form.register("description")} />
        </Field>
        <Field label={t("onb.currency")} htmlFor="org-currency" hint={t("onb.currencyHint")}>
          <NativeSelect id="org-currency" {...form.register("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name} ({moneyFmt(c.code).symbol})
              </option>
            ))}
          </NativeSelect>
        </Field>
      </Section>

      <Section icon={<CalendarDays />} tone="emerald" title={t("onb.secHapta")}>
        <Field label={t("onb.hapta", { cur: money.symbol })} htmlFor="org-hapta" error={e.monthlyHaptaAmount?.message} hint={t("onb.haptaHint")}>
          <Input id="org-hapta" inputMode="decimal" placeholder="500" {...form.register("monthlyHaptaAmount")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("onb.fromMonth")} htmlFor="org-hstart" error={e.haptaStartMonth?.message}>
            <Input id="org-hstart" type="month" {...form.register("haptaStartMonth")} />
          </Field>
          <Field label={t("onb.dueDay")} htmlFor="org-hdue" error={e.haptaDueDay?.message}>
            <Input id="org-hdue" type="number" inputMode="numeric" min={1} max={28} {...form.register("haptaDueDay")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("onb.howLong")} htmlFor="org-duration" hint={end ? t("onb.lastHapta", { month: monthName(lang, end, "short") }) : t("onb.endLater")} className={custom ? undefined : "col-span-2"}>
            <NativeSelect id="org-duration" {...form.register("duration")}>
              {DURATIONS.map(([k]) => (
                <option key={k} value={k}>
                  {t(DURATION_KEY[k])}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {custom && (
            <Field label={t("onb.lastMonth")} htmlFor="org-end" error={e.customEndMonth?.message}>
              <Input id="org-end" type="month" {...form.register("customEndMonth")} />
            </Field>
          )}
        </div>
      </Section>

      <details className="group rounded-2xl bg-muted/40 ring-1 ring-foreground/[0.05] [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 p-4">
          <IconChip tone="sky" size="sm">
            <MapPin />
          </IconChip>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">{t("onb.secMore")}</span>
            <span className="block text-xs text-muted-foreground">{t("onb.secMoreHint")}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
          <Field label={t("onb.city")} htmlFor="org-city">
            <Input id="org-city" autoComplete="address-level2" {...form.register("city")} />
          </Field>
          <Field label={t("onb.state")} htmlFor="org-state">
            <Input id="org-state" autoComplete="address-level1" {...form.register("state")} />
          </Field>
          <Field label={t("onb.phone")} htmlFor="org-phone" error={e.contactPhone?.message}>
            <Input id="org-phone" type="tel" inputMode="tel" {...form.register("contactPhone")} />
          </Field>
          <Field label={t("onb.reg")} htmlFor="org-reg">
            <Input id="org-reg" {...form.register("registrationNumber")} />
          </Field>
          <Field label={t("onb.fy")} htmlFor="org-fy" className="sm:col-span-2">
            <NativeSelect id="org-fy" {...form.register("financialYearStartMonth")}>
              {months.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </details>

      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full rounded-2xl text-base">
        {pending && <Loader2 className="animate-spin" />} {t("onb.submit")}
      </Button>
    </form>
  );
}
