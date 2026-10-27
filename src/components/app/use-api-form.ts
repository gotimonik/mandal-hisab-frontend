"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { apiMutate } from "@/lib/api-client";
import type { ActionResult } from "@/lib/action-result";

/**
 * Submit a react-hook-form to the API via the server-side proxy. Server validation
 * errors are mapped back onto the matching fields; other errors are shown in the form.
 */
export function useApiSubmit<TForm extends FieldValues>(form: UseFormReturn<TForm>) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit<T>(req: { path: string; method?: "POST" | "PATCH"; body: unknown }, opts: { success?: string; onSuccess?: (data: T) => void; refresh?: boolean } = {}) {
    start(async () => {
      setError(null);
      const res = (await apiMutate<T>(req)) as ActionResult<T>;
      if (!res.ok) {
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) form.setError(k as Path<TForm>, { message: v });
        }
        setError(res.error);
        return;
      }
      if (opts.success) toast.success(opts.success);
      opts.onSuccess?.(res.data);
      if (opts.refresh !== false) router.refresh();
    });
  }
  return { submit, pending, error, setError };
}
