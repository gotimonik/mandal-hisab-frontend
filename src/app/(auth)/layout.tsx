import { LangBoundary } from "@/i18n/boundary";
import { AuthBrand } from "@/features/auth/auth-brand";
import { PublicShell } from "@/features/public/shell";

/** Sign in, create account, forgot / reset password, verify email — with the same header and footer as the website. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <PublicShell>
      <div className="relative flex flex-col items-center px-4 pb-12 sm:pb-16">
        {/* colourful brand band behind the form */}
        <div aria-hidden className="bg-hero absolute inset-x-0 top-0 h-64 rounded-b-[2.5rem] sm:h-72" />
        {/* While the language loads, hold a card-sized space so the footer doesn't jump up and back down. */}
        <LangBoundary fallback={<AuthPlaceholder />}>
          <div className="relative w-full max-w-sm pt-8 sm:pt-10">
            <AuthBrand />
            {children}
          </div>
        </LangBoundary>
      </div>
    </PublicShell>
  );
}

/** Same footprint as the logo + sign-in card, shown for a moment while the language loads. */
function AuthPlaceholder() {
  return (
    <div aria-hidden className="relative w-full max-w-sm pt-8 sm:pt-10">
      <div className="mx-auto mb-6 h-[7.5rem] w-48" />
      <div className="h-[27rem] rounded-3xl bg-card shadow-card ring-1 ring-foreground/[0.06]" />
    </div>
  );
}
