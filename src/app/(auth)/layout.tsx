import { LangBoundary } from "@/i18n/boundary";
import { AuthBrand } from "@/features/auth/auth-brand";
import { PublicShell } from "@/features/public/shell";

/** Sign in, create account, forgot / reset password, verify email — with the same header and footer as the website. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <PublicShell>
      <div className="relative flex min-h-[calc(100dvh-4rem)] flex-1 flex-col items-center px-4 pb-12">
        {/* colourful brand band behind the form */}
        <div aria-hidden className="bg-hero absolute inset-x-0 top-0 h-64 rounded-b-[2.5rem] sm:h-72" />
        <LangBoundary>
          <div className="relative w-full max-w-sm pt-8 sm:pt-10">
            <AuthBrand />
            {children}
          </div>
        </LangBoundary>
      </div>
    </PublicShell>
  );
}
