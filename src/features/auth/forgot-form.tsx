"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { forgotPasswordAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { email } from "./schemas";

const Schema = z.object({ email });

export function ForgotForm() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema), defaultValues: { email: "" } });
  const onSubmit = form.handleSubmit((v) =>
    start(async () => {
      const r = await forgotPasswordAction(v);
      if (!r.ok) return setError(r.error);
      setSent(true);
    }),
  );
  return (
    <AuthCard title="Forgot password" description="We'll email you a link to reset it." footer={<Link href="/login" className="hover:underline">Back to sign in</Link>}>
      {sent ? (
        <p className="text-sm">If an account exists for that email, a reset link is on its way. The link is valid for one hour.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormError message={error} />
          <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
