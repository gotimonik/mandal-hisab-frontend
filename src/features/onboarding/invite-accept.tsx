"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/app/field";
import { apiMutate } from "@/app/actions/api";

export function InviteAccept({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(token ? null : "This invitation link is incomplete.");
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Accept invitation</CardTitle>
        <CardDescription>You have been invited to join an organization on MandalHisab.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <FormError message={error} />
        <Button
          disabled={pending || !token}
          onClick={() =>
            start(async () => {
              const r = await apiMutate<{ organizationId: string }>({ path: "/invitations/accept", body: { token } });
              if (!r.ok) return setError(r.error);
              router.push(`/org/${r.data.organizationId}`);
            })
          }
        >
          {pending && <Loader2 className="animate-spin" />} Accept and continue
        </Button>
      </CardContent>
    </Card>
  );
}
