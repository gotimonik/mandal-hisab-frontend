"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
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
  const justVerified = sp.get("verified") === "1";
  const form = useForm<z.infer<typeof LoginSchema>>({ resolver: zodResolver(LoginSchema), defaultValues: { email: sp.get("email") ?? "", password: "" } });
  const next = sp.get("next");
  // the page can be served from a static shell: make sure ?email= lands in the field
  const emailParam = sp.get("email");
  useEffect(() => {
    if (emailParam && !form.getValues("email")) form.setValue("email", emailParam);
  }, [emailParam, form]);

  const onSubmit = form.handleSubmit((values) =>
    start(async () => {
      setError(null);
      const res = await loginAction(values);
      if (!res.ok) {
        // Account exists but the email isn't verified yet: show the "check your email" screen.
        if (res.code === "EMAIL_NOT_VERIFIED") {
          const q = new URLSearchParams({ email: values.email, from: "login" });
          if (next) q.set("next", next);
          return router.push(`/check-email?${q}`);
        }
        return setError(res.error);
      }
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
        {justVerified && !error && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0" /> {t("auth.verifiedBanner")}
          </p>
        )}
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
        <Link href="/forgot-password" className="mx-auto inline-flex min-h-8 items-center px-2 text-center text-sm text-muted-foreground hover:underline">
          {t("auth.forgot")}
        </Link>
      </form>
    </AuthCard>
  );
}
