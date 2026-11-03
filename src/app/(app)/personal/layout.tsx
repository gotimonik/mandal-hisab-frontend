import { Suspense } from "react";
import { api } from "@/lib/server/api";
import { BottomBar, PersonalShell } from "@/features/personal/personal-nav";
import type { PCategory, PWallet } from "@/features/personal/types";

/** The phone bottom bar's "＋ add" needs the person's wallets and categories (hidden ones too). */
async function BottomBarWithBook() {
  const [w, c] = await Promise.all([api<{ wallets: PWallet[] }>("/me/personal/wallets"), api<{ categories: PCategory[] }>("/me/personal/categories")]);
  return <BottomBar book={{ wallets: w.wallets, categories: c.categories }} />;
}

/** Every Personal Hisab page shares its tabs (desktop) / bottom bar (phones). The page itself streams in on its own. */
export default function PersonalLayout({ children }: LayoutProps<"/personal">) {
  return (
    <PersonalShell
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
