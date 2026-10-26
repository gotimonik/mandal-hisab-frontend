import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3 py-10">
      <h2 className="text-lg font-semibold">Not found</h2>
      <p className="text-sm text-muted-foreground">This record does not exist or you don&apos;t have access to it.</p>
      <Link href="/onboarding" className={buttonVariants({ variant: "outline" })}>
        Back to your organizations
      </Link>
    </div>
  );
}
