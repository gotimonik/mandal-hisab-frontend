import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";

export default function SimpleLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6">
        <Link href="/onboarding" className="font-semibold tracking-tight">
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
