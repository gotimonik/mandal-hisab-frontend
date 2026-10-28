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
import { useT } from "@/i18n/client";
import { track } from "@/lib/analytics";

export function RegisterForm() {
  const router = useRouter();
  const t = useT();
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
      // Registering from an invitation link: its token proves the email, so no verification step.
      const inviteToken = next?.startsWith("/invite") ? (new URLSearchParams(next.split("?")[1] ?? "").get("token") ?? undefined) : undefined;
      const res = await registerAction({ ...values, phone: phone || undefined, inviteToken });
      if (!res.ok) {
        if (res.fieldErrors) for (const [k, v] of Object.entries(res.fieldErrors)) form.setError(k as "email", { message: v });
        return setError(res.error);
      }
      track("sign_up", { method: "email" });
      if (!res.data.verified) {
        const q = new URLSearchParams({ email: values.email });
        if (next) q.set("next", next);
        return router.replace(`/check-email?${q}`);
      }
      router.replace(next ?? "/onboarding?auto=1");
      router.refresh();
    }),
  );

  return (
    <AuthCard
      title={invited ? t("auth.invitedTitle") : t("auth.createTitle")}
      description={invited ? t("auth.invitedDesc") : t("auth.createDesc")}
      footer={
        <>
          {t("auth.already")}{" "}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-primary underline-offset-4 hover:underline">
            {t("auth.signIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={error} />
        <Field label={t("auth.fullName")} htmlFor="name" error={e.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!e.name} {...form.register("name")} />
        </Field>
        <Field label={t("auth.email")} htmlFor="email" error={e.email?.message} hint={lockEmail ? t("auth.invitedEmailHint") : undefined}>
          <Input id="email" type="email" autoComplete="email" inputMode="email" readOnly={lockEmail} className={lockEmail ? "bg-muted/60 text-muted-foreground" : undefined} aria-invalid={!!e.email} {...form.register("email")} />
        </Field>
        <Field label={t("auth.mobileOptional")} htmlFor="phone" error={e.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!e.phone} {...form.register("phone")} />
        </Field>
        <Field label={t("auth.password")} htmlFor="password" error={e.password?.message} hint={t("auth.passwordHint")}>
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!e.password} {...form.register("password")} />
        </Field>
        <Field label={t("auth.confirmPassword")} htmlFor="confirm" error={e.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!e.confirm} {...form.register("confirm")} />
        </Field>
        <Button type="submit" disabled={pending} size="lg">
          {pending && <Loader2 className="animate-spin" />} {t("auth.createAccountBtn")}
        </Button>
      </form>
    </AuthCard>
  );
}
