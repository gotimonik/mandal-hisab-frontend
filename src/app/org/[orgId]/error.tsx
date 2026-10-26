"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function OrgError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="font-semibold">We couldn&apos;t load this page</h2>
      <p className="text-sm text-muted-foreground">{error.message && !error.digest ? error.message : "Something went wrong while talking to the server. Your data has not been changed."}</p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
