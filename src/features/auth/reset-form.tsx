"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { resetPasswordAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { password } from "./schemas";

const Schema = z.object({ password, confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This reset link is missing its token.");
  const form = useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema), defaultValues: { password: "", confirm: "" } });
  const onSubmit = form.handleSubmit((v) =>
    start(async () => {
      const r = await resetPasswordAction({ token, password: v.password });
      if (!r.ok) return setError(r.error);
      setDone(true);
    }),
  );
  return (
    <AuthCard title="Choose a new password" footer={<Link href="/login" className="hover:underline">Back to sign in</Link>}>
      {done ? (
        <p className="text-sm">
          Your password has been changed and all sessions were signed out.{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormError message={error} />
          <Field label="New password" htmlFor="password" error={form.formState.errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={form.formState.errors.confirm?.message}>
            <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
          </Field>
          <Button type="submit" disabled={pending || !token}>
            {pending && <Loader2 className="animate-spin" />} Update password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
