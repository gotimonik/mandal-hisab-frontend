import * as React from "react";
import { cn } from "@/lib/utils";

/** Native <select>: accessible, keyboard friendly and uses the phone's own picker on mobile. */
export const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(function NativeSelect({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
