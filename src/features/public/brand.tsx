import Link from "next/link";
import { HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <span className={cn("flex size-9 items-center justify-center rounded-xl text-white shadow-sm", light ? "bg-white/15 ring-1 ring-white/25" : "bg-hero shadow-primary/30")}>
        <HandCoins className="size-5" />
      </span>
      <span className="text-lg">MandalHisab</span>
    </Link>
  );
}
