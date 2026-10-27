import { apiMutate as serverMutate } from "@/app/actions/api";
import { trackApiResult } from "@/lib/analytics";
import type { ActionResult } from "@/lib/action-result";

/**
 * What client components use to change data: the server-side proxy (apiMutate) plus an
 * analytics event for the action. See src/lib/analytics.ts for what is (and isn't) sent.
 */
export async function apiMutate<T = unknown>(input: { path: string; method?: "POST" | "PATCH" | "DELETE"; body?: unknown }): Promise<ActionResult<T>> {
  const res = await serverMutate<T>(input);
  trackApiResult(input, res);
  return res;
}
