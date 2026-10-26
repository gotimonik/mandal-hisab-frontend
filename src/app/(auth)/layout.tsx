import Link from "next/link";
import { HandCoins } from "lucide-react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex flex-1 flex-col items-center px-4 pb-10">
      {/* colourful brand band behind the form */}
      <div aria-hidden className="bg-hero absolute inset-x-0 top-0 h-64 rounded-b-[2.5rem] sm:h-72" />
      <div className="relative w-full max-w-sm pt-12 sm:pt-16">
        <Link href="/" className="mb-6 flex flex-col items-center gap-2 text-center text-white">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur">
            <HandCoins className="size-7" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight">MandalHisab</span>
          <span className="text-sm text-white/85">Hapta, upad and savings — simple and clear</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
