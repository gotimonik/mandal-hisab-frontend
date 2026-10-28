"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * The submit button inside a <form action={logoutAction}>: shows a spinner and
 * "Signing out…" while the session is ended, and can't be pressed twice.
 */
export function LogoutButton({ variant = "ghost", size = "sm", iconOnly = false, showLabelFrom, className }: { variant?: "ghost" | "outline"; size?: "sm" | "default" | "icon-sm"; iconOnly?: boolean; showLabelFrom?: "sm"; className?: string }) {
  const { pending } = useFormStatus();
  const t = useT();
  const label = pending ? t("shell.signingOut") : t("shell.signOut");
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} aria-label={label} aria-busy={pending || undefined} className={className}>
      {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
      {!iconOnly && <span className={cn(showLabelFrom === "sm" && "hidden sm:inline")}>{label}</span>}
    </Button>
  );
}
