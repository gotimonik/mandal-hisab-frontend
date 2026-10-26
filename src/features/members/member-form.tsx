"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import type { Member } from "@/lib/types";
import { isoDate, todayISO } from "@/lib/format";
import { useLang, useT } from "@/i18n/client";
import { monthName, type T } from "@/i18n/core";

const Schema = z.object({
  name: z.string().trim().min(2, "Enter the member's name").max(120),
  membershipNumber: z
    .string()
    .trim()
    .max(30)
    .regex(/^[A-Za-z0-9/_-]*$/, "Letters, digits, / - _ only")
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^([+0-9 ()-]{7,20})?$/, "Enter a valid phone number")
    .optional(),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  joiningDate: z.string().optional(),
  status: z.enum(["active", "inactive", "left"]),
  notes: z.string().max(1000).optional(),
  haptaShares: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number")
    .refine((v) => Number(v) >= 1 && Number(v) <= 50, "From 1 to 50"),
  inviteToApp: z.boolean(),
});

type Created = Member & { invitation: null | { ok: true; inviteLink: string; existingUser: boolean; emailed: boolean } | { ok: false; error: string } };

/** After adding a member with an email: say what happened to the invitation (and offer the link when email isn't set up). */
function announceInvitation(m: Created, t: T) {
  const inv = m.invitation;
  if (!inv) return toast.success(t("mform.added"));
  if (!inv.ok) return toast.warning(t("mform.inviteFailed", { error: inv.error }));
  const copy = { label: t("mform.copyLink"), onClick: () => void navigator.clipboard.writeText(inv.inviteLink) };
  if (inv.emailed) return toast.success(t("mform.invitedEmailed", { email: m.email ?? "" }), { description: inv.existingUser ? t("mform.invitedExisting") : t("mform.invitedNew"), action: copy, duration: 8000 });
  return toast.success(t("mform.added"), { description: t("mform.invitedShare"), action: copy, duration: 15000 });
}
type V = z.infer<typeof Schema>;

function MemberForm({ orgId, member }: { orgId: string; member?: Member }) {
  const close = useDialogClose();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const form = useForm<V>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: member?.name ?? "",
      membershipNumber: member?.membershipNumber ?? "",
      phone: member?.phone ?? "",
      email: member?.email ?? "",
      address: member?.address ?? "",
      joiningDate: member ? isoDate(member.joiningDate) : todayISO(),
      status: member?.status ?? "active",
      notes: member?.notes ?? "",
      haptaShares: String(member?.haptaShares ?? 1),
      inviteToApp: true,
    },
  });
  const emailValue = form.watch("email");
  const sharesValue = Number(form.watch("haptaShares")) || 1;
  const sharesChanged = !!member && sharesValue !== (member.haptaShares ?? 1);
  // which months a share change applies to
  const thisMonth = todayISO().slice(0, 7);
  const [ty, tm] = thisMonth.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(ty, tm, 1)).toISOString().slice(0, 7);
  const monthLabel = (m: string) => monthName(lang, m);
  const [applyFrom, setApplyFrom] = useState<"" | "this" | "next">("");
  const effectiveApply = applyFrom || (sharesChanged ? "this" : "");
  const showApply = !!member && (sharesChanged || sharesValue > 1);
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={form.handleSubmit((v) => {
        const { inviteToApp, haptaShares, ...rest } = v;
        const body = {
          ...rest,
          haptaShares: Number(haptaShares),
          ...(member && effectiveApply ? { sharesFromMonth: effectiveApply === "this" ? thisMonth : nextMonth } : {}),
          membershipNumber: v.membershipNumber || undefined,
          email: v.email || undefined,
          phone: v.phone || undefined,
        };
        submit<Created>(
          member ? { path: `/orgs/${orgId}/members/${member._id}`, method: "PATCH", body } : { path: `/orgs/${orgId}/members`, body: { ...body, inviteToApp: !!v.email && inviteToApp } },
          {
            success: member ? (sharesChanged ? t("mform.sharesSaved", { n: sharesValue }) : t("mform.updated")) : undefined,
            onSuccess: (m) => {
              close();
              if (!member) {
                announceInvitation(m, t);
                router.push(`/org/${orgId}/members/${m._id}`);
              }
            },
          },
        );
      })}
    >
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label={t("mform.fullName")} htmlFor="m-name" error={e.name?.message} className="sm:col-span-2">
        <Input id="m-name" {...form.register("name")} aria-invalid={!!e.name} />
      </Field>
      <Field label={t("mform.number")} htmlFor="m-no" error={e.membershipNumber?.message} hint={member ? undefined : t("mform.numberHint")}>
        <Input id="m-no" {...form.register("membershipNumber")} />
      </Field>
      <Field label={t("mform.joining")} htmlFor="m-join">
        <Input id="m-join" type="date" {...form.register("joiningDate")} />
      </Field>
      <Field label={t("mform.mobile")} htmlFor="m-phone" error={e.phone?.message}>
        <Input id="m-phone" type="tel" inputMode="tel" {...form.register("phone")} />
      </Field>
      <Field label={t("mform.email")} htmlFor="m-email" error={e.email?.message}>
        <Input id="m-email" type="email" {...form.register("email")} />
      </Field>
      {!member && emailValue && !e.email && (
        <label className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3 text-sm sm:col-span-2">
          <Checkbox checked={form.watch("inviteToApp")} onCheckedChange={(c) => form.setValue("inviteToApp", !!c)} className="mt-0.5" aria-label={t("mform.invite")} />
          <span>
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="size-4 text-primary" /> {t("mform.invite")}
            </span>
            <span className="text-xs text-muted-foreground">{t("mform.inviteHint")}</span>
          </span>
        </label>
      )}
      <Field label={t("mform.address")} htmlFor="m-addr" className="sm:col-span-2">
        <Input id="m-addr" {...form.register("address")} />
      </Field>
      <Field
        label={t("mform.haptas")}
        htmlFor="m-shares"
        error={e.haptaShares?.message}
        hint={sharesValue > 1 ? t("mform.haptasMany", { n: sharesValue }) : t("mform.haptasOne")}
      >
        <Input id="m-shares" type="number" inputMode="numeric" min={1} max={50} step={1} {...form.register("haptaShares")} />
      </Field>
      {showApply && (
        <Field
          label={t("mform.applyFrom")}
          htmlFor="m-apply"
          hint={
            effectiveApply === "this"
              ? t("mform.applyThisHint", { month: monthLabel(thisMonth), n: sharesValue })
              : effectiveApply === "next"
                ? t("mform.applyNextHint", { month: monthLabel(thisMonth), n: sharesValue, next: monthLabel(nextMonth) })
                : t("mform.applyNoneHint")
          }
        >
          <NativeSelect id="m-apply" value={effectiveApply} onChange={(ev) => setApplyFrom(ev.target.value as "" | "this" | "next")}>
            {!sharesChanged && <option value="">{t("mform.applyNone")}</option>}
            <option value="this">{t("mform.applyThis", { month: monthLabel(thisMonth) })}</option>
            <option value="next">{t("mform.applyNext", { month: monthLabel(nextMonth) })}</option>
          </NativeSelect>
        </Field>
      )}
      <Field label={t("mform.status")} htmlFor="m-status">
        <NativeSelect id="m-status" {...form.register("status")}>
          <option value="active">{t("members.active")}</option>
          <option value="inactive">{t("members.inactive")}</option>
          <option value="left">{t("members.left")}</option>
        </NativeSelect>
      </Field>
      <Field label={t("mform.notes")} htmlFor="m-notes" className="sm:col-span-2">
        <Textarea id="m-notes" rows={2} {...form.register("notes")} />
      </Field>
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending && <Loader2 className="animate-spin" />} {member ? t("common.saveChanges") : t("members.add")}
      </Button>
    </form>
  );
}

export function MemberDialog({ orgId, member, defaultOpen }: { orgId: string; member?: Member; defaultOpen?: boolean }) {
  const t = useT();
  return (
    <FormDialog
      wide
      defaultOpen={defaultOpen}
      trigger={member ? <><Pencil /> {t("members.edit")}</> : <><Plus /> {t("members.add")}</>}
      triggerVariant={member ? "outline" : "default"}
      title={member ? t("members.editTitle") : t("members.add")}
    >
      <MemberForm orgId={orgId} member={member} />
    </FormDialog>
  );
}
