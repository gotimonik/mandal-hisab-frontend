import { LangBoundary } from "@/i18n/boundary";
import { SimpleHeader } from "@/features/auth/simple-header";

export default function SimpleLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LangBoundary>
        <SimpleHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </LangBoundary>
    </div>
  );
}
