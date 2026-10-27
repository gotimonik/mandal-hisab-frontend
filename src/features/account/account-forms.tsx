"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, KeyRound } from "lucide-react";
import { SubmitButton } from "@/components/app/form-bits";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { useApiSubmit } from "@/components/app/use-api-form";
import { changePasswordAction } from "@/app/actions/auth";
import { password } from "@/features/auth/schemas";

const ProfileSchema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(20).optional() });

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const form = useForm<z.infer<typeof ProfileSchema>>({ resolver: zodResolver(ProfileSchema), defaultValues: { name, phone } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={form.handleSubmit((v) => submit({ path: "/auth/me", method: "PATCH", body: v }, { success: "Profile saved" }))}>
      <FormError message={error} />
      <Field label="Name" htmlFor="p-name" error={form.formState.errors.name?.message}>
        <Input id="p-name" {...form.register("name")} />
      </Field>
      <Field label="Mobile" htmlFor="p-phone" error={form.formState.errors.phone?.message}>
        <Input id="p-phone" type="tel" inputMode="tel" {...form.register("phone")} />
      </Field>
      <SubmitButton page pending={pending} icon={<Check />}>
        Save
      </SubmitButton>
    </form>
  );
}

const PwSchema = z.object({ currentPassword: z.string().min(1, "Required"), newPassword: password, confirm: z.string() }).refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function PasswordForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof PwSchema>>({ resolver: zodResolver(PwSchema), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) =>
        start(async () => {
          const r = await changePasswordAction({ currentPassword: v.currentPassword, newPassword: v.newPassword });
          if (!r.ok) return setError(r.error);
          toast.success("Password changed. Please sign in again.");
          router.push("/login");
        }),
      )}
    >
      <FormError message={error} />
      <Field label="Current password" htmlFor="pw-cur" error={e.currentPassword?.message}>
        <Input id="pw-cur" type="password" autoComplete="current-password" {...form.register("currentPassword")} />
      </Field>
      <Field label="New password" htmlFor="pw-new" error={e.newPassword?.message}>
        <Input id="pw-new" type="password" autoComplete="new-password" {...form.register("newPassword")} />
      </Field>
      <Field label="Confirm new password" htmlFor="pw-conf" error={e.confirm?.message}>
        <Input id="pw-conf" type="password" autoComplete="new-password" {...form.register("confirm")} />
      </Field>
      <SubmitButton page pending={pending} icon={<KeyRound />}>
        Change password
      </SubmitButton>
    </form>
  );
}
