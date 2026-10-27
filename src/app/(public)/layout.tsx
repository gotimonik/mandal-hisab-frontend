import { Suspense } from "react";
import { PublicHeader } from "@/features/public/header";
import { PublicFooter } from "@/features/public/footer";
import { GuestCta, SessionCta } from "@/features/public/session-cta";

/** Marketing / information pages: Home, Features, Download, About, FAQ, Contact, Privacy, Terms. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader
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
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
