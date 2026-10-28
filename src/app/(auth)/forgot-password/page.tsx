import { NO_INDEX } from "@/lib/seo";
import { ForgotForm } from "@/features/auth/forgot-form";

export const metadata = { title: "Forgot password", robots: NO_INDEX };

export default function ForgotPage() {
  return <ForgotForm />;
}
