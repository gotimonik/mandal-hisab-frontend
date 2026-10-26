import { LangBoundary } from "@/i18n/boundary";
import { AuthBrand } from "@/features/auth/auth-brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex flex-1 flex-col items-center px-4 pb-10">
      {/* colourful brand band behind the form */}
      <div aria-hidden className="bg-hero absolute inset-x-0 top-0 h-64 rounded-b-[2.5rem] sm:h-72" />
      <div className="relative w-full max-w-sm pt-8 sm:pt-12">
        <LangBoundary>
          <AuthBrand />
          {children}
        </LangBoundary>
      </div>
    </main>
  );
}
