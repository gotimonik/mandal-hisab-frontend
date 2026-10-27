"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyEmailAction } from "@/app/actions/auth";
import { AuthCard } from "./auth-card";
import { track } from "@/lib/analytics";

export function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"working" | "ok" | "error">(token ? "working" : "error");
  const [msg, setMsg] = useState(token ? "" : "This verification link is missing its token.");
  useEffect(() => {
    if (!token) return;
    verifyEmailAction(token).then((r) => {
      setState(r.ok ? "ok" : "error");
      if (r.ok) track("email_verified");
      if (!r.ok) setMsg(r.error);
    });
  }, [token]);
  return (
    <AuthCard title="Email verification" footer={<Link href="/onboarding?auto=1" className="hover:underline">Continue</Link>}>
      <p className="text-sm" role="status">
        {state === "working" ? "Verifying…" : state === "ok" ? "Thank you — your email address is verified." : msg}
      </p>
    </AuthCard>
  );
}
