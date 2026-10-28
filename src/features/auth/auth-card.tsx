import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({ title, description, children, footer }: { title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="shadow-xl shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children}
        {footer && <div className="text-center text-sm text-muted-foreground [&_a]:inline-flex [&_a]:min-h-8 [&_a]:items-center [&_a]:px-1">{footer}</div>}
      </CardContent>
    </Card>
  );
}
