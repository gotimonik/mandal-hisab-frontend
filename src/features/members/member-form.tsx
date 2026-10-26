"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import type { Member } from "@/lib/types";
import { isoDate, todayISO } from "@/lib/format";

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
});
type V = z.infer<typeof Schema>;

function MemberForm({ orgId, member }: { orgId: string; member?: Member }) {
  const close = useDialogClose();
  const router = useRouter();
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
    },
  });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={form.handleSubmit((v) => {
        const body = { ...v, membershipNumber: v.membershipNumber || undefined, email: v.email || undefined, phone: v.phone || undefined };
        submit<Member>(
          member ? { path: `/orgs/${orgId}/members/${member._id}`, method: "PATCH", body } : { path: `/orgs/${orgId}/members`, body },
          {
            success: member ? "Member updated" : "Member added",
            onSuccess: (m) => {
              close();
              if (!member) router.push(`/org/${orgId}/members/${m._id}`);
            },
          },
        );
      })}
    >
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label="Full name" htmlFor="m-name" error={e.name?.message} className="sm:col-span-2">
        <Input id="m-name" {...form.register("name")} aria-invalid={!!e.name} />
      </Field>
      <Field label="Membership no." htmlFor="m-no" error={e.membershipNumber?.message} hint={member ? undefined : "Leave blank to auto-number (M0001…)"}>
        <Input id="m-no" {...form.register("membershipNumber")} />
      </Field>
      <Field label="Joining date" htmlFor="m-join">
        <Input id="m-join" type="date" {...form.register("joiningDate")} />
      </Field>
      <Field label="Mobile" htmlFor="m-phone" error={e.phone?.message}>
        <Input id="m-phone" type="tel" inputMode="tel" {...form.register("phone")} />
      </Field>
      <Field label="Email" htmlFor="m-email" error={e.email?.message}>
        <Input id="m-email" type="email" {...form.register("email")} />
      </Field>
      <Field label="Address" htmlFor="m-addr" className="sm:col-span-2">
        <Input id="m-addr" {...form.register("address")} />
      </Field>
      <Field label="Status" htmlFor="m-status">
        <NativeSelect id="m-status" {...form.register("status")}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="left">Left</option>
        </NativeSelect>
      </Field>
      <Field label="Notes" htmlFor="m-notes" className="sm:col-span-2">
        <Textarea id="m-notes" rows={2} {...form.register("notes")} />
      </Field>
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending && <Loader2 className="animate-spin" />} {member ? "Save changes" : "Add member"}
      </Button>
    </form>
  );
}

export function MemberDialog({ orgId, member, defaultOpen }: { orgId: string; member?: Member; defaultOpen?: boolean }) {
  return (
    <FormDialog
      wide
      defaultOpen={defaultOpen}
      trigger={member ? <><Pencil /> Edit</> : <><Plus /> Add member</>}
      triggerVariant={member ? "outline" : "default"}
      title={member ? "Edit member" : "Add member"}
    >
      <MemberForm orgId={orgId} member={member} />
    </FormDialog>
  );
}
