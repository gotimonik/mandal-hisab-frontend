import Link from "next/link";
import { HandCoins, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";

export default function SimpleLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-md sm:px-6">
        <Link href="/onboarding" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="bg-hero flex size-8 items-center justify-center rounded-lg">
            <HandCoins className="size-4" />
          </span>
          MandalHisab
        </Link>
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut /> Sign out
          </Button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
