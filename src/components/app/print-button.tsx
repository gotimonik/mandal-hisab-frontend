"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function PrintButton({ label = "Print / PDF" }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => {
        track("print");
        window.print();
      }} className="no-print">
      <Printer /> {label}
    </Button>
  );
}
