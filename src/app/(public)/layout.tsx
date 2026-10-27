import { Suspense } from "react";
import { NATIVE_APP_UA } from "@/lib/native";
import { PublicHeader } from "@/features/public/header";
import { PublicFooter } from "@/features/public/footer";
import { GuestCta, SessionCta } from "@/features/public/session-cta";

/** Marketing / information pages: Home, Features, Download, About, FAQ, Contact, Privacy, Terms. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Inside the iOS / Android app: mark the page before it paints, so website-only links stay hidden. */}
      <script dangerouslySetInnerHTML={{ __html: `try{var C=window.Capacitor;if(navigator.userAgent.indexOf(${JSON.stringify(NATIVE_APP_UA)})>-1||(C&&C.isNativePlatform&&C.isNativePlatform()))document.documentElement.classList.add("native-app")}catch(e){}` }} />
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
