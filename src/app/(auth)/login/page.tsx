import { pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = pageMeta({ title: "Sign in", description: "Sign in to MandalHisab to see your Mandal's hapta, savings, upad and reports — or join your Mandal with the code from your admin.", path: "/login" });

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
