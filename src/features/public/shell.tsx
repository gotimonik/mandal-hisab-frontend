import { Suspense, type ReactNode } from "react";
import { PublicHeader } from "./header";
import { PublicFooter } from "./footer";
import { GuestCta, SessionCta } from "./session-cta";
import { LangBoundary } from "@/i18n/boundary";
import { LanguageMenu } from "@/i18n/switcher";

/**
 * Header + footer shared by every page outside the signed-in app: the website pages
 * (Home, Features, …) and the sign-in pages (Sign in, Create account, Forgot password, …).
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader
        language={
          <LangBoundary fallback={<span className="size-9" aria-hidden />}>
            <LanguageMenu />
          </LangBoundary>
        }
        actions={
          <Suspense fallback={<GuestCta />}>
            <SessionCta />
          </Suspense>
        }
        mobileActions={
          <Suspense fallback={<GuestCta stacked />}>
            <SessionCta stacked />
          </Suspense>
        }
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <PublicFooter />
    </div>
  );
}
