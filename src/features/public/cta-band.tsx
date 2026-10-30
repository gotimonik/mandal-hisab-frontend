import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";

/** Closing call-to-action band used at the bottom of the content pages. */
export function CtaBand({ title = "Bring your Mandal's hisab online", text = `${site.pricing.headline}. Set up in a few minutes.` }: { title?: string; text?: string }) {
  return (
    <div className="bg-hero relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-primary/20 sm:p-10">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full bg-white/10" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{title}</h2>
          <p className="mt-2 text-white/85">{text}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-2xl bg-white px-5 text-primary hover:bg-white/90")}>
            Create your Mandal <ArrowRight />
          </Link>
          <Link href="/contact" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 rounded-2xl border-white/40 bg-white/10 px-5 text-white hover:bg-white/20 hover:text-white")}>
            Talk to us
          </Link>
        </div>
      </div>
    </div>
  );
}
