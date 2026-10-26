import { Suspense } from "react";
import { VerifyEmail } from "@/features/auth/verify-email";

export const metadata = { title: "Verify email" };

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
