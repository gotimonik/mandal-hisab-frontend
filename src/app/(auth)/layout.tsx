import { LangBoundary } from "@/i18n/boundary";
import { AuthBrand, AuthLanguage } from "@/features/auth/auth-brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex flex-1 flex-col items-center px-4 pb-10">
      {/* colourful brand band behind the form */}
      <div aria-hidden className="bg-hero absolute inset-x-0 top-0 h-64 rounded-b-[2.5rem] sm:h-72" />
      <LangBoundary>
        {/* language switch: top-right of the page, not squeezed into the card column */}
        <div className="relative flex w-full justify-end pt-4 sm:pt-5">
          <AuthLanguage />
        </div>
        <div className="relative w-full max-w-sm pt-5 sm:pt-6">
          <AuthBrand />
          {children}
        </div>
      </LangBoundary>
    </main>
  );
}
