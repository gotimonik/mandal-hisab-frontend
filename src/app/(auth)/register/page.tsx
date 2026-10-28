import { pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata = pageMeta({ title: "Create your free account", description: "Create a free MandalHisab account and set up your Mandal in minutes — hapta, savings, upad and interest, in English, ગુજરાતી or हिन्दी.", path: "/register" });

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
