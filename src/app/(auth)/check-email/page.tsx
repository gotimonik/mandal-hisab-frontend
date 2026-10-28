import { NO_INDEX } from "@/lib/seo";
import { Suspense } from "react";
import { CheckEmail } from "@/features/auth/check-email";

export const metadata = { title: "Check your email", robots: NO_INDEX };

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmail />
    </Suspense>
  );
}
