import { NO_INDEX } from "@/lib/seo";
import { Suspense } from "react";
import { ResetForm } from "@/features/auth/reset-form";

export const metadata = { title: "Reset password", robots: NO_INDEX };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
