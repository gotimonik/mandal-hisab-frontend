"use client";

import { useT } from "@/i18n/client";
import type { Key } from "@/i18n/core";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calculator, FileText, Landmark, Loader2, Percent, SlidersHorizontal } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { useApiSubmit } from "@/components/app/use-api-form";
import { apiMutate } from "@/lib/api-client";
import { formatDate, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { FormSection as Section, MoreOptions, SubmitButton } from "@/components/app/form-bits";


const Schema = z.object({
  memberId: z.string().min(1, "lf.v.member"),
  amount: rupees,
  purpose: z.string().max(300).optional(),
  interestMethod: z.enum(["reducing_balance", "flat", "simple", "compound"]),
  rate: z.string().regex(/^\d{1,3}(\.\d{1,4})?$/, "lf.v.rate"),
  ratePeriod: z.enum(["annual", "monthly"]),
  compoundingPerYear: z.coerce.number().int(),
  dayCount: z.enum(["actual_365", "actual_360", "30_360"]),
  tenure: z.coerce.number().int().min(1, "lf.v.min1").max(360),
  repaymentFrequency: z.enum(["monthly", "quarterly", "weekly", "biweekly"]),
  graceDays: z.coerce.number().int().min(0).max(90),
  prepaymentMode: z.enum(["reduce_emi", "reduce_tenure"]),
  notes: z.string().max(1000).optional(),
  previewStart: z.string(),
  previewFirstDue: z.string(),
});
type In = z.input<typeof Schema>;
type Out = z.output<typeof Schema>;

interface Preview {
  annualRate: string;
  emiPaise: number | null;
  rows: { sequence: number; dueDate: string; openingPrincipalPaise: number; principalDuePaise: number; interestDuePaise: number; totalDuePaise: number }[];
  totals: { principalPaise: number; interestPaise: number; totalPaise: number };
}

function nextMonth(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function LoanForm({ orgId, members, canSetRate }: { orgId: string; members: { _id: string; name: string; membershipNumber: string }[]; canSetRate: boolean }) {
  const t = useT();
  const router = useRouter();
  const today = todayISO();
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(Schema),
    defaultValues: { memberId: "", amount: "", purpose: "", interestMethod: "reducing_balance", rate: "12", ratePeriod: "annual", compoundingPerYear: 12, dayCount: "actual_365", tenure: 12, repaymentFrequency: "monthly", graceDays: 0, prepaymentMode: "reduce_emi", notes: "", previewStart: today, previewFirstDue: nextMonth(today) },
  });
  const { submit, pending, error } = useApiSubmit(form);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pErr, setPErr] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();
  const method = useWatch({ control: form.control, name: "interestMethod" });
  const e = form.formState.errors;

  const runPreview = form.handleSubmit((v) =>
    startPreview(async () => {
      setPErr(null);
      const r = await apiMutate<Preview>({
        path: `/orgs/${orgId}/loans/preview`,
        body: { amount: v.amount, interestMethod: v.interestMethod, rate: v.rate, ratePeriod: v.ratePeriod, compoundingPerYear: v.compoundingPerYear, dayCount: v.dayCount, tenure: v.tenure, repaymentFrequency: v.repaymentFrequency, disbursedOn: v.previewStart, firstDueDate: v.previewFirstDue },
      });
      if (!r.ok) return setPErr(r.error);
      setPreview(r.data);
    }),
  );

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => {
          const { previewStart: _a, previewFirstDue: _b, ...body } = v;
          submit<{ _id: string }>({ path: `/orgs/${orgId}/loans`, body: { ...body, compoundingPerYear: v.interestMethod === "compound" ? v.compoundingPerYear : null, lateFee: { enabled: false, type: "fixed", value: 0, graceDays: 0 } } }, { success: t("lf.created"), onSuccess: (l) => router.push(`/org/${orgId}/loans/${l._id}`) });
        })}
      >
        <FormError message={error} />
        <Section icon={<FileText />} tone="indigo" title={t("lf.application")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("lf.member")} htmlFor="l-member" error={e.memberId?.message} className="sm:col-span-2">
              <NativeSelect id="l-member" {...form.register("memberId")}>
                <option value="">{t("lf.select")}</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.membershipNumber})
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("lf.requested")} htmlFor="l-amt" error={e.amount?.message}>
              <Input id="l-amt" inputMode="decimal" {...form.register("amount")} />
            </Field>
            <Field label={t("lf.purpose")} htmlFor="l-purpose">
              <Input id="l-purpose" placeholder={t("lf.purposePh")} {...form.register("purpose")} />
            </Field>
          </div>
        </Section>
        <Section icon={<Percent />} tone="violet" title={t("lf.interestRepay")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("lf.method")} htmlFor="l-method" hint={t(`loan.mi.${method}` as Key)} className="sm:col-span-2">
              <NativeSelect id="l-method" {...form.register("interestMethod")}>
                <option value="reducing_balance">{t("loan.mn.reducing_balance")}</option>
                <option value="flat">{t("loan.mn.flat")}</option>
                <option value="simple">{t("loan.mn.simple")}</option>
                <option value="compound">{t("loan.mn.compound")}</option>
              </NativeSelect>
            </Field>
            <Field label={t("lf.rate")} htmlFor="l-rate" error={e.rate?.message} hint={canSetRate ? undefined : t("lf.rateHint")}>
              <Input id="l-rate" inputMode="decimal" {...form.register("rate")} />
            </Field>
            <Field label={t("lf.ratePeriod")} htmlFor="l-rp">
              <NativeSelect id="l-rp" {...form.register("ratePeriod")}>
                <option value="annual">{t("lf.perYear")}</option>
                <option value="monthly">{t("lf.perMonth")}</option>
              </NativeSelect>
            </Field>
            <Field label={method === "compound" ? t("lf.tenureC") : t("lf.count")} htmlFor="l-tenure" error={e.tenure?.message}>
              <Input id="l-tenure" type="number" min={1} {...form.register("tenure")} />
            </Field>
            <Field label={t("lf.freq")} htmlFor="l-freq">
              <NativeSelect id="l-freq" {...form.register("repaymentFrequency")}>
                <option value="monthly">{t("lf.monthly")}</option>
                <option value="quarterly">{t("lf.quarterly")}</option>
                <option value="biweekly">{t("lf.biweekly")}</option>
                <option value="weekly">{t("lf.weekly")}</option>
              </NativeSelect>
            </Field>
          </div>
        </Section>
        <MoreOptions icon={<SlidersHorizontal />} title={t("lf.more")} description={t("lf.moreD")} defaultOpen={method === "compound" || method === "simple"}>
            {method === "compound" && (
              <Field label={t("lf.compounding")} htmlFor="l-comp">
                <NativeSelect id="l-comp" {...form.register("compoundingPerYear")}>
                  <option value={12}>{t("lf.monthly")}</option>
                  <option value={4}>{t("lf.quarterly")}</option>
                  <option value={2}>{t("lf.halfYearly")}</option>
                  <option value={1}>{t("lf.yearly")}</option>
                </NativeSelect>
              </Field>
            )}
            {(method === "simple" || method === "compound") && (
              <Field label={t("lf.dayCount")} htmlFor="l-dc">
                <NativeSelect id="l-dc" {...form.register("dayCount")}>
                  <option value="actual_365">Actual/365</option>
                  <option value="actual_360">Actual/360</option>
                  <option value="30_360">30/360</option>
                </NativeSelect>
              </Field>
            )}
            <Field label={t("lf.grace")} htmlFor="l-grace">
              <Input id="l-grace" type="number" min={0} {...form.register("graceDays")} />
            </Field>
            <Field label={t("lf.prepay")} htmlFor="l-prep">
              <NativeSelect id="l-prep" {...form.register("prepaymentMode")}>
                <option value="reduce_emi">{t("lf.reduceEmi")}</option>
                <option value="reduce_tenure">{t("lf.reduceTenure")}</option>
              </NativeSelect>
            </Field>
            <Field label={t("lf.notes")} htmlFor="l-notes" className="sm:col-span-2">
              <Textarea id="l-notes" rows={2} {...form.register("notes")} />
            </Field>
        </MoreOptions>
        <SubmitButton page pending={pending}>
          {t("lf.submit")}
        </SubmitButton>
      </form>

      <section className="flex h-fit flex-col gap-3 rounded-3xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5 lg:sticky lg:top-4">
        <h2 className="flex items-center gap-2.5 text-base font-bold">
          <IconChip tone="emerald" size="sm">
            <Landmark />
          </IconChip>
          {t("lf.preview")}
        </h2>
        <p className="-mt-1 text-xs text-muted-foreground">{t("lf.previewD")}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("lf.disbDate")} htmlFor="l-pstart">
              <Input id="l-pstart" type="date" {...form.register("previewStart")} />
            </Field>
            <Field label={t("lf.firstDue")} htmlFor="l-pfirst">
              <Input id="l-pfirst" type="date" {...form.register("previewFirstDue")} />
            </Field>
          </div>
          <Button type="button" variant="outline" onClick={runPreview} disabled={previewing}>
            {previewing ? <Loader2 className="animate-spin" /> : <Calculator />} {t("lf.calc")}
          </Button>
          <FormError message={pErr} />
          {preview && <ScheduleTable preview={preview} />}
      </section>
    </div>
  );
}

export function ScheduleTable({ preview }: { preview: Preview }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="bg-hero-green grid grid-cols-3 gap-2 rounded-2xl p-3 text-white">
        {[
          [preview.emiPaise !== null ? t("lf.emi") : t("lf.rateL"), preview.emiPaise !== null ? <Money key="e" paise={preview.emiPaise} short /> : t("lf.pa", { rate: preview.annualRate })],
          [t("lf.totalInterest"), <Money key="i" paise={preview.totals.interestPaise} short />],
          [t("lf.totalRepay"), <Money key="t" paise={preview.totals.totalPaise} short />],
        ].map(([l, v], i) => (
          <div key={i} className="min-w-0 rounded-xl bg-white/15 px-2.5 py-2">
            <p className="truncate text-[11px] text-white/85">{l}</p>
            <p className="truncate font-bold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      {preview.emiPaise !== null && <p className="text-xs text-muted-foreground">{t("lf.rateLine", { rate: preview.annualRate, n: preview.rows.length })}</p>}
      <div className="max-h-96 overflow-auto rounded-2xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("lf.due")}</TableHead>
              <TableHead className="text-right">{t("lf.principal")}</TableHead>
              <TableHead className="text-right">{t("lf.interest")}</TableHead>
              <TableHead className="text-right">{t("lf.total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.rows.map((r) => (
              <TableRow key={r.sequence}>
                <TableCell>{r.sequence}</TableCell>
                <TableCell>{formatDate(r.dueDate)}</TableCell>
                <TableCell className="text-right">
                  <Money paise={r.principalDuePaise} />
                </TableCell>
                <TableCell className="text-right">
                  <Money paise={r.interestDuePaise} />
                </TableCell>
                <TableCell className="text-right">
                  <Money paise={r.totalDuePaise} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>{t("lf.total")}</TableCell>
              <TableCell className="text-right">
                <Money paise={preview.totals.principalPaise} />
              </TableCell>
              <TableCell className="text-right">
                <Money paise={preview.totals.interestPaise} />
              </TableCell>
              <TableCell className="text-right">
                <Money paise={preview.totals.totalPaise} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
