"use client";

import { useT } from "@/i18n/client";
import type { T } from "@/i18n/core";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Copy, Crown, Loader2, MailPlus, Send, ShieldCheck, UserCog, UserPlus, UserRound, UserRoundCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { ChoicePills, FormNote, SubmitButton } from "@/components/app/form-bits";

type Role = "member" | "manager" | "admin";
const roleOptions = (t: T): { value: Role; label: string; icon: React.ReactNode }[] => [
  { value: "member", label: t("shell.roles.member"), icon: <UserRound /> },
  { value: "manager", label: t("shell.roles.manager"), icon: <ShieldCheck /> },
  { value: "admin", label: t("shell.roles.admin"), icon: <Crown /> },
];
const roleInfo = (t: T, role: string) => (role === "admin" ? t("users.info.admin") : role === "manager" ? t("users.info.manager") : t("users.info.member"));
import { useApiSubmit } from "@/components/app/use-api-form";

type Mem = { _id: string; name: string; membershipNumber: string };

type ManageProps = { membershipId: string; status: string; role: string; memberId?: string | null; members: Mem[]; isSelf: boolean; autoCreateMember?: boolean; hasMonthlyHapta?: boolean };

function ManageForm({ membershipId, status, role, memberId, members, isSelf, autoCreateMember = true, hasMonthlyHapta = false }: ManageProps) {
  const { orgId } = useParams<{ orgId: string }>();
  const t = useT();
  const close = useDialogClose();
  const pending = status === "pending";
  const form = useForm({ defaultValues: { role, memberId: memberId ?? "", createMember: autoCreateMember, haptaStartMonth: new Date().toISOString().slice(0, 7) } });
  const linking = !!form.watch("memberId");
  const creating = form.watch("createMember") && !linking;
  const { submit, pending: busy, error } = useApiSubmit(form);
  const path = `/orgs/${orgId}/memberships/${membershipId}`;
  const send = (body: Record<string, unknown>, msg: string) => submit({ path, method: "PATCH", body }, { success: msg, onSuccess: close });
  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <Field label={t("users.role")} htmlFor={`r-${membershipId}`}>
        {isSelf ? (
          <NativeSelect id={`r-${membershipId}`} {...form.register("role")} disabled>
            <option value="member">{t("shell.roles.member")}</option>
            <option value="manager">{t("shell.roles.manager")}</option>
            <option value="admin">{t("shell.roles.admin")}</option>
          </NativeSelect>
        ) : (
          <>
            <input type="hidden" id={`r-${membershipId}`} {...form.register("role")} />
            <ChoicePills label={t("users.role")} options={roleOptions(t)} value={form.watch("role") as Role} onChange={(r) => form.setValue("role", r, { shouldDirty: true })} />
          </>
        )}
      </Field>
      <FormNote>{roleInfo(t, form.watch("role"))}</FormNote>
      <Field label={t("users.linked")} htmlFor={`m-${membershipId}`} hint={t("users.linkedHint")}>
        <NativeSelect id={`m-${membershipId}`} {...form.register("memberId")}>
          <option value="">{t("users.notLinked")}</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.membershipNumber})
            </option>
          ))}
        </NativeSelect>
      </Field>
      {!pending && status === "active" && !memberId && !linking && hasMonthlyHapta && (
        <Field label={t("users.newFrom")} htmlFor={`hs2-${membershipId}`} hint={t("users.newFromHint")}>
          <Input id={`hs2-${membershipId}`} type="month" {...form.register("haptaStartMonth")} />
        </Field>
      )}
      {pending && !linking && (
        <div className="flex flex-col gap-2 rounded-2xl bg-sky-500/10 p-3 text-sm ring-1 ring-sky-500/20">
          <label className="flex cursor-pointer items-center gap-2 font-medium">
            <Checkbox checked={form.watch("createMember")} onCheckedChange={(c) => form.setValue("createMember", !!c)} /> {hasMonthlyHapta ? t("users.addNewHapta") : t("users.addNew")}
          </label>
          {creating && hasMonthlyHapta && (
            <Field label={t("users.haptaFrom")} htmlFor={`hs-${membershipId}`}>
              <Input id={`hs-${membershipId}`} type="month" {...form.register("haptaStartMonth")} />
            </Field>
          )}
        </div>
      )}
      {pending ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            disabled={busy}
            onClick={form.handleSubmit((v) =>
              send({ action: "approve", role: v.role, memberId: v.memberId || null, createMember: v.memberId ? undefined : v.createMember, haptaStartMonth: !v.memberId && v.createMember && hasMonthlyHapta ? v.haptaStartMonth : undefined }, t("users.approved")),
            )}
          >
            {busy ? <Loader2 className="animate-spin" /> : <UserRoundCheck />} {t("users.approve")}
          </Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => send({ action: "reject" }, t("users.rejected"))}>
            <X /> {t("users.reject")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={form.handleSubmit(async (v) => {
              if (v.role !== role) send({ action: "change_role", role: v.role, memberId: v.memberId || null }, t("users.roleUpdated"));
              else send({ action: "link_member", memberId: v.memberId || null }, t("users.linkUpdated"));
            })}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Check />} {t("users.save")}
          </Button>
          <div className="flex flex-wrap gap-2 empty:hidden">
          {status === "active" && !memberId && !linking && (
            <Button
              variant="secondary"
              className="flex-1"
              disabled={busy}
              onClick={form.handleSubmit((v) => send({ action: "link_member", createMember: true, haptaStartMonth: hasMonthlyHapta ? v.haptaStartMonth : undefined }, t("users.addedToMembers")))}
            >
              <UserPlus /> {t("users.addNew")}
            </Button>
          )}
          {!isSelf && status === "active" && (
            <Button variant="destructive" className="flex-1" disabled={busy} onClick={() => send({ action: "deactivate" }, t("users.accessRemoved"))}>
              {t("users.deactivate")}
            </Button>
          )}
          {status === "deactivated" && (
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => send({ action: "reactivate" }, t("users.accessRestored"))}>
              {t("users.reactivate")}
            </Button>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ManageMembershipDialog(props: ManageProps & { name: string }) {
  const t = useT();
  return (
    <FormDialog trigger={props.status === "pending" ? t("users.review") : <UserCog />} triggerVariant={props.status === "pending" ? "default" : "ghost"} triggerSize="xs" title={props.status === "pending" ? t("users.joinReq", { name: props.name }) : t("users.manage", { name: props.name })} icon={props.status === "pending" ? <UserPlus /> : <UserCog />} tone={props.status === "pending" ? "amber" : "indigo"}>
      <ManageForm {...props} />
    </FormDialog>
  );
}

const InviteSchema = z.object({ email: z.string().trim().email("Enter a valid email"), role: z.enum(["member", "manager", "admin"]), memberId: z.string().optional() });

function InviteForm({ members }: { members: Mem[] }) {
  const { orgId } = useParams<{ orgId: string }>();
  const t = useT();
  const [link, setLink] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const form = useForm<z.infer<typeof InviteSchema>>({ resolver: zodResolver(InviteSchema), defaultValues: { email: "", role: "member", memberId: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) => submit<{ inviteLink: string; existingUser: boolean; emailed: boolean }>({ path: `/orgs/${orgId}/invitations`, body: { ...v, memberId: v.memberId || undefined } }, { success: t("users.invSent"), onSuccess: (r) => { setLink(r.inviteLink); setExisting(r.existingUser); setEmailed(r.emailed); }, refresh: true }))}
    >
      <FormError message={error} />
      <Field label={t("users.email")} htmlFor="inv-email" error={form.formState.errors.email?.message}>
        <Input id="inv-email" type="email" {...form.register("email")} />
      </Field>
      <Field label={t("users.role")} htmlFor="inv-role">
        <input type="hidden" id="inv-role" {...form.register("role")} />
        <ChoicePills label={t("users.role")} options={roleOptions(t)} value={form.watch("role")} onChange={(r) => form.setValue("role", r, { shouldDirty: true })} />
      </Field>
      <FormNote>{roleInfo(t, form.watch("role"))}</FormNote>
      <Field label={t("users.linkOpt")} htmlFor="inv-member">
        <NativeSelect id="inv-member" {...form.register("memberId")}>
          <option value="">{t("users.none")}</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.membershipNumber})
            </option>
          ))}
        </NativeSelect>
      </Field>
      <SubmitButton pending={pending} icon={<Send />}>
        {t("users.sendInv")}
      </SubmitButton>
      {link && (
        <FormNote tone={emailed ? "good" : "warn"} className="text-sm">
          {emailed ? t("users.emailed") : t("users.noEmail")}{" "}
          {existing ? t("users.existing") : t("users.newUser")}
        </FormNote>
      )}
      {link && (
        <div className="flex items-center gap-2 rounded-2xl bg-muted/60 p-2 pl-3 text-xs ring-1 ring-foreground/[0.06]">
          <span className="min-w-0 flex-1 truncate">{link}</span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              toast.success(t("users.copied"));
            }}
          >
            <Copy /> {t("users.copy")}
          </Button>
        </div>
      )}
    </form>
  );
}

export function InviteDialog({ members }: { members: Mem[] }) {
  const t = useT();
  return (
    <FormDialog trigger={<><MailPlus /> {t("users.invite")}</>} title={t("users.inviteTitle")} icon={<MailPlus />} tone="indigo" description={t("users.inviteDesc")}>
      <InviteForm members={members} />
    </FormDialog>
  );
}
