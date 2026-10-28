import { NO_INDEX } from "@/lib/seo";
import { Suspense } from "react";
import { VerifyEmail } from "@/features/auth/verify-email";

export const metadata = { title: "Verify email", robots: NO_INDEX };

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
