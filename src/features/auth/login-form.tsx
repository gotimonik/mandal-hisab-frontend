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

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(sp.get("expired") ? "Your session expired. Please sign in again." : null);
  const form = useForm<z.infer<typeof LoginSchema>>({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });
  const next = sp.get("next");

  const onSubmit = form.handleSubmit((values) =>
    start(async () => {
      setError(null);
      const res = await loginAction(values);
      if (!res.ok) return setError(res.error);
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/onboarding?auto=1");
      router.refresh();
    }),
  );

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to MandalHisab."
      footer={
        <>
          New here?{" "}
          <Link href={next && next.startsWith("/") && !next.startsWith("//") ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={error} />
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!form.formState.errors.password} {...form.register("password")} />
        </Field>
        <Button type="submit" disabled={pending} size="lg">
          {pending && <Loader2 className="animate-spin" />} Sign in
        </Button>
        <Link href="/forgot-password" className="text-center text-sm text-muted-foreground hover:underline">
          Forgot password?
        </Link>
      </form>
    </AuthCard>
  );
}
