"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { loginAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { LoginSchema } from "./schemas";
import { useT } from "@/i18n/client";
import { track } from "@/lib/analytics";

export function LoginForm() {
  const router = useRouter();
  const t = useT();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(sp.get("expired") ? t("auth.expired") : null);
  const form = useForm<z.infer<typeof LoginSchema>>({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });
  const next = sp.get("next");

  const onSubmit = form.handleSubmit((values) =>
    start(async () => {
      setError(null);
      const res = await loginAction(values);
      if (!res.ok) return setError(res.error);
      track("login", { method: "email" });
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/onboarding?auto=1");
      router.refresh();
    }),
  );

  return (
    <AuthCard
      title={t("auth.signIn")}
      description={next?.startsWith("/invite") ? t("auth.signInToAccept") : t("auth.welcomeBack")}
      footer={
        <>
          {t("auth.newHere")}{" "}
          <Link href={next && next.startsWith("/") && !next.startsWith("//") ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-medium text-primary underline-offset-4 hover:underline">
            {t("auth.createAccount")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={error} />
        <Field label={t("auth.email")} htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
        </Field>
        <Field label={t("auth.password")} htmlFor="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!form.formState.errors.password} {...form.register("password")} />
        </Field>
        <Button type="submit" disabled={pending} size="lg">
          {pending && <Loader2 className="animate-spin" />} {t("auth.signIn")}
        </Button>
        <Link href="/forgot-password" className="text-center text-sm text-muted-foreground hover:underline">
          {t("auth.forgot")}
        </Link>
      </form>
    </AuthCard>
  );
}
