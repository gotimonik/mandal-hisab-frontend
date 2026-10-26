"use client";

import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { optionalRupees } from "@/lib/schemas";
import { todayISO } from "@/lib/format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useApiSubmit } from "@/components/app/use-api-form";

const Schema = z.object({
  name: z.string().trim().min(3, "Enter the Mandal name").max(120),
  description: z.string().trim().max(500).optional(),
  monthlyHaptaAmount: optionalRupees,
  haptaStartMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a month"),
  haptaDueDay: z.coerce.number().int().min(1, "1–28").max(28, "1–28"),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  contactPhone: z.string().trim().max(20).optional(),
  registrationNumber: z.string().trim().max(100).optional(),
  financialYearStartMonth: z.coerce.number().int().min(1).max(12),
});
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function CreateOrgForm() {
  const router = useRouter();
  const form = useForm<z.input<typeof Schema>, unknown, z.output<typeof Schema>>({ resolver: zodResolver(Schema), defaultValues: { name: "", description: "", monthlyHaptaAmount: "", haptaStartMonth: todayISO().slice(0, 7), haptaDueDay: 10, city: "", state: "", contactPhone: "", registrationNumber: "", financialYearStartMonth: 4 } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={form.handleSubmit((v) => submit<{ id: string }>({ path: "/organizations", body: { ...v, description: v.description || undefined, monthlyHaptaAmount: v.monthlyHaptaAmount || undefined } }, { success: "Mandal registered", onSuccess: (o) => router.push(`/org/${o.id}`) }))}
    >
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label="Mandal / trust name" htmlFor="org-name" error={e.name?.message} className="sm:col-span-2">
        <Input id="org-name" {...form.register("name")} aria-invalid={!!e.name} />
      </Field>
      <Field label="Short description (optional)" htmlFor="org-desc" className="sm:col-span-2">
        <Textarea id="org-desc" rows={2} maxLength={500} placeholder="e.g. Patel family savings Mandal" {...form.register("description")} />
      </Field>
      <Field label="Monthly hapta per member (₹)" htmlFor="org-hapta" error={e.monthlyHaptaAmount?.message} hint="e.g. 500 — you can set or change it later">
        <Input id="org-hapta" inputMode="decimal" placeholder="500" {...form.register("monthlyHaptaAmount")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From month" htmlFor="org-hstart" error={e.haptaStartMonth?.message}>
          <Input id="org-hstart" type="month" {...form.register("haptaStartMonth")} />
        </Field>
        <Field label="Due by day" htmlFor="org-hdue" error={e.haptaDueDay?.message}>
          <Input id="org-hdue" type="number" min={1} max={28} {...form.register("haptaDueDay")} />
        </Field>
      </div>
      <Field label="City" htmlFor="org-city">
        <Input id="org-city" {...form.register("city")} />
      </Field>
      <Field label="State" htmlFor="org-state">
        <Input id="org-state" {...form.register("state")} />
      </Field>
      <Field label="Contact phone" htmlFor="org-phone" error={e.contactPhone?.message}>
        <Input id="org-phone" type="tel" {...form.register("contactPhone")} />
      </Field>
      <Field label="Registration no. (optional)" htmlFor="org-reg">
        <Input id="org-reg" {...form.register("registrationNumber")} />
      </Field>
      <Field label="Financial year starts in" htmlFor="org-fy" className="sm:col-span-2">
        <NativeSelect id="org-fy" {...form.register("financialYearStartMonth")}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending && <Loader2 className="animate-spin" />} Register Mandal
      </Button>
    </form>
  );
}
