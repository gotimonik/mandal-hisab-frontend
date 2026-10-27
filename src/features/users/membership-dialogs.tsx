"use client";

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
const ROLE_OPTIONS: { value: Role; label: string; icon: React.ReactNode }[] = [
  { value: "member", label: "Member", icon: <UserRound /> },
  { value: "manager", label: "Manager", icon: <ShieldCheck /> },
  { value: "admin", label: "Admin", icon: <Crown /> },
];
const ROLE_INFO: Record<string, string> = {
  admin: "Admins have full control of the Mandal.",
  manager: "Managers handle day-to-day work as permitted in Settings.",
  member: "Members see only their own data.",
};
import { useApiSubmit } from "@/components/app/use-api-form";

type Mem = { _id: string; name: string; membershipNumber: string };

type ManageProps = { membershipId: string; status: string; role: string; memberId?: string | null; members: Mem[]; isSelf: boolean; autoCreateMember?: boolean; hasMonthlyHapta?: boolean };

function ManageForm({ membershipId, status, role, memberId, members, isSelf, autoCreateMember = true, hasMonthlyHapta = false }: ManageProps) {
  const { orgId } = useParams<{ orgId: string }>();
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
      <Field label="Role" htmlFor={`r-${membershipId}`}>
        {isSelf ? (
          <NativeSelect id={`r-${membershipId}`} {...form.register("role")} disabled>
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </NativeSelect>
        ) : (
          <>
            <input type="hidden" id={`r-${membershipId}`} {...form.register("role")} />
            <ChoicePills label="Role" options={ROLE_OPTIONS} value={form.watch("role") as Role} onChange={(r) => form.setValue("role", r, { shouldDirty: true })} />
          </>
        )}
      </Field>
      <FormNote>{ROLE_INFO[form.watch("role")] ?? ROLE_INFO.member}</FormNote>
      <Field label="Linked member record" htmlFor={`m-${membershipId}`} hint="Links this login to a member so they can see their own hapta, receipts and loans.">
        <NativeSelect id={`m-${membershipId}`} {...form.register("memberId")}>
          <option value="">— not linked —</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.membershipNumber})
            </option>
          ))}
        </NativeSelect>
      </Field>
      {!pending && status === "active" && !memberId && !linking && hasMonthlyHapta && (
        <Field label="If adding as a new member: hapta from month" htmlFor={`hs2-${membershipId}`} hint="Not a member record yet — pick an existing one above, or add them as a new member.">
          <Input id={`hs2-${membershipId}`} type="month" {...form.register("haptaStartMonth")} />
        </Field>
      )}
      {pending && !linking && (
        <div className="flex flex-col gap-2 rounded-2xl bg-sky-500/10 p-3 text-sm ring-1 ring-sky-500/20">
          <label className="flex cursor-pointer items-center gap-2 font-medium">
            <Checkbox checked={form.watch("createMember")} onCheckedChange={(c) => form.setValue("createMember", !!c)} /> Add as a new member{hasMonthlyHapta ? " and start their monthly hapta" : ""}
          </label>
          {creating && hasMonthlyHapta && (
            <Field label="Hapta from month" htmlFor={`hs-${membershipId}`}>
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
              send({ action: "approve", role: v.role, memberId: v.memberId || null, createMember: v.memberId ? undefined : v.createMember, haptaStartMonth: !v.memberId && v.createMember && hasMonthlyHapta ? v.haptaStartMonth : undefined }, "Request approved"),
            )}
          >
            {busy ? <Loader2 className="animate-spin" /> : <UserRoundCheck />} Approve
          </Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => send({ action: "reject" }, "Request rejected")}>
            <X /> Reject
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={form.handleSubmit(async (v) => {
              if (v.role !== role) send({ action: "change_role", role: v.role, memberId: v.memberId || null }, "Role updated");
              else send({ action: "link_member", memberId: v.memberId || null }, "Member link updated");
            })}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Check />} Save
          </Button>
          <div className="flex flex-wrap gap-2 empty:hidden">
          {status === "active" && !memberId && !linking && (
            <Button
              variant="secondary"
              className="flex-1"
              disabled={busy}
              onClick={form.handleSubmit((v) => send({ action: "link_member", createMember: true, haptaStartMonth: hasMonthlyHapta ? v.haptaStartMonth : undefined }, "Added to members"))}
            >
              <UserPlus /> Add as a new member
            </Button>
          )}
          {!isSelf && status === "active" && (
            <Button variant="destructive" className="flex-1" disabled={busy} onClick={() => send({ action: "deactivate" }, "Access removed")}>
              Deactivate access
            </Button>
          )}
          {status === "deactivated" && (
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => send({ action: "reactivate" }, "Access restored")}>
              Reactivate
            </Button>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ManageMembershipDialog(props: ManageProps & { name: string }) {
  return (
    <FormDialog trigger={props.status === "pending" ? "Review" : <UserCog />} triggerVariant={props.status === "pending" ? "default" : "ghost"} triggerSize="xs" title={props.status === "pending" ? `Join request: ${props.name}` : `Manage ${props.name}`} icon={props.status === "pending" ? <UserPlus /> : <UserCog />} tone={props.status === "pending" ? "amber" : "indigo"}>
      <ManageForm {...props} />
    </FormDialog>
  );
}

const InviteSchema = z.object({ email: z.string().trim().email("Enter a valid email"), role: z.enum(["member", "manager", "admin"]), memberId: z.string().optional() });

function InviteForm({ members }: { members: Mem[] }) {
  const { orgId } = useParams<{ orgId: string }>();
  const [link, setLink] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const form = useForm<z.infer<typeof InviteSchema>>({ resolver: zodResolver(InviteSchema), defaultValues: { email: "", role: "member", memberId: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) => submit<{ inviteLink: string; existingUser: boolean; emailed: boolean }>({ path: `/orgs/${orgId}/invitations`, body: { ...v, memberId: v.memberId || undefined } }, { success: "Invitation sent", onSuccess: (r) => { setLink(r.inviteLink); setExisting(r.existingUser); setEmailed(r.emailed); }, refresh: true }))}
    >
      <FormError message={error} />
      <Field label="Email" htmlFor="inv-email" error={form.formState.errors.email?.message}>
        <Input id="inv-email" type="email" {...form.register("email")} />
      </Field>
      <Field label="Role" htmlFor="inv-role">
        <input type="hidden" id="inv-role" {...form.register("role")} />
        <ChoicePills label="Role" options={ROLE_OPTIONS} value={form.watch("role")} onChange={(r) => form.setValue("role", r, { shouldDirty: true })} />
      </Field>
      <FormNote>{ROLE_INFO[form.watch("role")]}</FormNote>
      <Field label="Link to member record (optional)" htmlFor="inv-member">
        <NativeSelect id="inv-member" {...form.register("memberId")}>
          <option value="">— none —</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.membershipNumber})
            </option>
          ))}
        </NativeSelect>
      </Field>
      <SubmitButton pending={pending} icon={<Send />}>
        Send invitation
      </SubmitButton>
      {link && (
        <FormNote tone={emailed ? "good" : "warn"} className="text-sm">
          {emailed ? "Invitation emailed. " : "Email isn't set up yet — share this link (WhatsApp, SMS). "}
          {existing ? "They already use MandalHisab: the invitation is also waiting for them in the app." : "They create their account with that email and join in one step."}
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
              toast.success("Link copied");
            }}
          >
            <Copy /> Copy
          </Button>
        </div>
      )}
    </form>
  );
}

export function InviteDialog({ members }: { members: Mem[] }) {
  return (
    <FormDialog trigger={<><MailPlus /> Invite</>} title="Invite someone" icon={<MailPlus />} tone="indigo" description="Existing users see the invitation in the app. Others get an email link (valid 7 days) that you can also share directly.">
      <InviteForm members={members} />
    </FormDialog>
  );
}
