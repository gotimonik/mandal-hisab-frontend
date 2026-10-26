"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Loader2, MailPlus, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
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
      <Field label="Role" htmlFor={`r-${membershipId}`} hint="Admins have full control. Managers handle day-to-day work as permitted in Settings. Members see only their own data.">
        <NativeSelect id={`r-${membershipId}`} {...form.register("role")} disabled={isSelf}>
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </NativeSelect>
      </Field>
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
        <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 text-sm">
          <label className="flex items-center gap-2">
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
        <div className="flex gap-2">
          <Button
            disabled={busy}
            onClick={form.handleSubmit((v) =>
              send({ action: "approve", role: v.role, memberId: v.memberId || null, createMember: v.memberId ? undefined : v.createMember, haptaStartMonth: !v.memberId && v.createMember && hasMonthlyHapta ? v.haptaStartMonth : undefined }, "Request approved"),
            )}
          >
            {busy && <Loader2 className="animate-spin" />} Approve
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => send({ action: "reject" }, "Request rejected")}>
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy}
            onClick={form.handleSubmit(async (v) => {
              if (v.role !== role) send({ action: "change_role", role: v.role, memberId: v.memberId || null }, "Role updated");
              else send({ action: "link_member", memberId: v.memberId || null }, "Member link updated");
            })}
          >
            {busy && <Loader2 className="animate-spin" />} Save
          </Button>
          {status === "active" && !memberId && !linking && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={form.handleSubmit((v) => send({ action: "link_member", createMember: true, haptaStartMonth: hasMonthlyHapta ? v.haptaStartMonth : undefined }, "Added to members"))}
            >
              Add as a new member
            </Button>
          )}
          {!isSelf && status === "active" && (
            <Button variant="destructive" disabled={busy} onClick={() => send({ action: "deactivate" }, "Access removed")}>
              Deactivate access
            </Button>
          )}
          {status === "deactivated" && (
            <Button variant="outline" disabled={busy} onClick={() => send({ action: "reactivate" }, "Access restored")}>
              Reactivate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ManageMembershipDialog(props: ManageProps & { name: string }) {
  return (
    <FormDialog trigger={props.status === "pending" ? "Review" : <UserCog />} triggerVariant={props.status === "pending" ? "default" : "ghost"} triggerSize="xs" title={props.status === "pending" ? `Join request: ${props.name}` : `Manage ${props.name}`}>
      <ManageForm {...props} />
    </FormDialog>
  );
}

const InviteSchema = z.object({ email: z.string().trim().email("Enter a valid email"), role: z.enum(["member", "manager", "admin"]), memberId: z.string().optional() });

function InviteForm({ members }: { members: Mem[] }) {
  const { orgId } = useParams<{ orgId: string }>();
  const [link, setLink] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const form = useForm<z.infer<typeof InviteSchema>>({ resolver: zodResolver(InviteSchema), defaultValues: { email: "", role: "member", memberId: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) => submit<{ inviteLink: string; existingUser: boolean }>({ path: `/orgs/${orgId}/invitations`, body: { ...v, memberId: v.memberId || undefined } }, { success: "Invitation sent", onSuccess: (r) => { setLink(r.inviteLink); setExisting(r.existingUser); }, refresh: true }))}
    >
      <FormError message={error} />
      <Field label="Email" htmlFor="inv-email" error={form.formState.errors.email?.message}>
        <Input id="inv-email" type="email" {...form.register("email")} />
      </Field>
      <Field label="Role" htmlFor="inv-role">
        <NativeSelect id="inv-role" {...form.register("role")}>
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </NativeSelect>
      </Field>
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
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Send invitation
      </Button>
      {link && existing && <p className="text-sm text-success">They already use MandalHisab — the invitation is waiting for them in the app.</p>}
      {link && !existing && <p className="text-sm text-muted-foreground">They don&apos;t have an account yet. Share this link (WhatsApp, SMS) — they register and join in one step.</p>}
      {link && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs">
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
    <FormDialog trigger={<><MailPlus /> Invite</>} title="Invite someone" description="Existing users see the invitation in the app. Others get an email link (valid 7 days) that you can also share directly.">
      <InviteForm members={members} />
    </FormDialog>
  );
}
