import { Suspense } from "react";
import { api } from "@/lib/server/api";
import { getMe } from "@/lib/server/data";
import { BottomBar, PersonalShell } from "@/features/personal/personal-nav";
import { BookSwitcher, type BookList } from "@/features/personal/books";
import type { PCategory, PWallet } from "@/features/personal/types";

/** The phone bottom bar's "＋ add" needs the person's wallets and categories (hidden ones too). */
async function BottomBarWithBook() {
  const [w, c, me] = await Promise.all([api<{ wallets: PWallet[] }>("/me/personal/wallets"), api<{ categories: PCategory[] }>("/me/personal/categories"), getMe()]);
  return <BottomBar book={{ wallets: w.wallets, categories: c.categories }} user={{ name: me.user.name, email: me.user.email, isPlatformAdmin: me.user.isPlatformAdmin }} />;
}

/** Which book this device is looking at, and the others to switch to. */
async function Switcher() {
  return <BookSwitcher list={await api<BookList>("/me/personal/books")} />;
}

/** Every Personal Hisab page shares its tabs (desktop) / bottom bar (phones). The page itself streams in on its own. */
export default function PersonalLayout({ children }: LayoutProps<"/personal">) {
  return (
    <PersonalShell
      switcher={
        <Suspense fallback={<div className="mb-3 h-10" />}>
          <Switcher />
        </Suspense>
      }
      bottomBar={
        <Suspense fallback={null}>
          <BottomBarWithBook />
        </Suspense>
      }
    >
      {children}
    </PersonalShell>
  );
}
