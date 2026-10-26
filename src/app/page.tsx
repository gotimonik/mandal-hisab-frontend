import Link from "next/link";
import { BookOpenCheck, HandCoins, Landmark, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: HandCoins, title: "Hapta & installments", text: "Weekly, monthly or quarterly schemes with per-month due dates, partial payments and receipts." },
  { icon: Landmark, title: "Loans & interest", text: "Simple, compound, flat and reducing-balance loans with transparent schedules and early closure." },
  { icon: BookOpenCheck, title: "Double-entry ledger", text: "Every rupee posted to a balanced ledger. Corrections are reversals — history is never overwritten." },
  { icon: ShieldCheck, title: "Roles & isolation", text: "Admins, managers and members each see only what they should. Every Mandal's data is separate." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:py-16">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">MandalHisab</span>
        <div className="flex gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
            Sign in
          </Link>
          <Link href="/register" className={cn(buttonVariants())}>
            Get started
          </Link>
        </div>
      </header>
      <section className="mt-14 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Transparent hisab for your Mandal.</h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Members, hapta, collections, loans, expenses and reports in one place — accurate to the paisa and auditable by everyone who needs to see it.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Create your Mandal
          </Link>
          <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            Join with a code
          </Link>
        </div>
      </section>
      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl p-5 ring-1 ring-foreground/10">
            <f.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-medium">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
