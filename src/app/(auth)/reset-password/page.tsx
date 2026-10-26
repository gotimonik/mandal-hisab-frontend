import { Suspense } from "react";
import { ResetForm } from "@/features/auth/reset-form";

export const metadata = { title: "Reset password" };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
