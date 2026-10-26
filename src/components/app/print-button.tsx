"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Print / PDF" }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
      <Printer /> {label}
    </Button>
  );
}
