import { NO_INDEX } from "@/lib/seo";
import { LangBoundary } from "@/i18n/boundary";
import { SimpleHeader } from "@/features/auth/simple-header";
import { NativePush } from "@/components/app/native-push";
import { AppLock } from "@/components/app/app-lock";
import { PullToRefresh } from "@/components/app/pull-to-refresh";
import { Suspense } from "react";
import { HeaderAccount } from "@/components/app/header-account";

/** The signed-in app is private: keep it out of search results. */
export const metadata = { robots: NO_INDEX };

export default function SimpleLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LangBoundary>
        <SimpleHeader
          account={
            <Suspense fallback={<span aria-hidden className="size-8 rounded-full bg-muted" />}>
              <HeaderAccount />
            </Suspense>
          }
        />
        <NativePush />
        <AppLock />
        <PullToRefresh />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </LangBoundary>
    </div>
  );
}
