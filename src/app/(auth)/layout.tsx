import { LangBoundary } from "@/i18n/boundary";
import { AuthBrand } from "@/features/auth/auth-brand";
import { PublicShell } from "@/features/public/shell";

/** Sign in, create account, forgot / reset password, verify email — with the same header and footer as the website. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <PublicShell>
      {/* Reserve most of the screen so the footer doesn't jump while the form loads, but leave
          its top ~5rem in view so it's clear the page continues. */}
      <div className="relative flex min-h-[calc(100dvh-9rem)] flex-1 flex-col items-center px-4 pb-10">
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
