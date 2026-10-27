import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSessionToken } from "@/lib/server/session";

/**
 * Sign in / Get started — or "Open MandalHisab" when the visitor is already signed in.
 * Reads the session cookie, so render it inside <Suspense> with <GuestCta> as the fallback.
 */
export async function SessionCta({ stacked = false }: { stacked?: boolean }) {
  const signedIn = !!(await getSessionToken());
  return signedIn ? <OpenAppCta stacked={stacked} /> : <GuestCta stacked={stacked} />;
}

export function GuestCta({ stacked = false }: { stacked?: boolean }) {
  return (
    <>
      <Link href="/login" className={cn(buttonVariants({ variant: stacked ? "outline" : "ghost" }), stacked && "h-11 w-full")}>
        Sign in
      </Link>
      <Link href="/register" className={cn(buttonVariants(), stacked && "h-11 w-full")}>
        Get started free
      </Link>
    </>
  );
}

function OpenAppCta({ stacked }: { stacked: boolean }) {
  return (
    <Link href="/onboarding?auto=1" className={cn(buttonVariants(), stacked && "h-11 w-full")}>
      Open MandalHisab <ArrowRight />
    </Link>
  );
}
