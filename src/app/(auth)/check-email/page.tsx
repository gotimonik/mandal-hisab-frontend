import { Suspense } from "react";
import { CheckEmail } from "@/features/auth/check-email";

export const metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmail />
    </Suspense>
  );
}
