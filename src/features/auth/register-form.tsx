"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { registerAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { RegisterSchema } from "./schemas";

export function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextParam = sp.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const invited = !!next?.startsWith("/invite");
  const invitedEmail = sp.get("email") ?? "";
  const invitedName = sp.get("name") ?? "";
  const form = useForm<z.infer<typeof RegisterSchema>>({ resolver: zodResolver(RegisterSchema), defaultValues: { name: invitedName, email: invitedEmail, phone: "", password: "", confirm: "" } });
  // the page can be served from a static shell: make sure the invited name/email land in the fields
  useEffect(() => {
    if (invitedEmail && !form.getValues("email")) form.setValue("email", invitedEmail);
    if (invitedName && !form.getValues("name")) form.setValue("name", invitedName);
  }, [invitedEmail, invitedName, form]);
  const lockEmail = invited && !!invitedEmail;
  const e = form.formState.errors;

  const onSubmit = form.handleSubmit(({ confirm: _c, phone, ...values }) =>
    start(async () => {
      setError(null);
      const res = await registerAction({ ...values, phone: phone || undefined });
      if (!res.ok) {
        if (res.fieldErrors) for (const [k, v] of Object.entries(res.fieldErrors)) form.setError(k as "email", { message: v });
        return setError(res.error);
      }
      router.replace(next ?? "/onboarding?auto=1");
      router.refresh();
    }),
  );

  return (
    <AuthCard
      title={invited ? "You're invited — create your account" : "Create your account"}
      description={invited ? "Set your own password. You'll join the Mandal right after." : "Then create a new Mandal or join an existing one with its code."}
      footer={
        <>
          Already registered?{" "}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={error} />
        <Field label="Full name" htmlFor="name" error={e.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!e.name} {...form.register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={e.email?.message} hint={lockEmail ? "The invitation was sent to this email — you'll sign in with it." : undefined}>
          <Input id="email" type="email" autoComplete="email" inputMode="email" readOnly={lockEmail} className={lockEmail ? "bg-muted/60 text-muted-foreground" : undefined} aria-invalid={!!e.email} {...form.register("email")} />
        </Field>
        <Field label="Mobile (optional)" htmlFor="phone" error={e.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!e.phone} {...form.register("phone")} />
        </Field>
        <Field label="Password" htmlFor="password" error={e.password?.message} hint="At least 8 characters with letters and numbers.">
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!e.password} {...form.register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={e.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!e.confirm} {...form.register("confirm")} />
        </Field>
        <Button type="submit" disabled={pending} size="lg">
          {pending && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
    </AuthCard>
  );
}
