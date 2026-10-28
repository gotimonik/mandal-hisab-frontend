import { apiMutate as serverMutate } from "@/app/actions/api";
import { trackApiResult } from "@/lib/analytics";
import type { ActionResult } from "@/lib/action-result";
import { hapticSuccess } from "@/lib/native-plugins";

// background calls that shouldn't buzz the phone
const QUIET = ["/me/push-devices", "/notifications/read"];

/**
 * What client components use to change data: the server-side proxy (apiMutate) plus an
 * analytics event for the action (see src/lib/analytics.ts) and, in the app, a success haptic.
 */
export async function apiMutate<T = unknown>(input: { path: string; method?: "POST" | "PATCH" | "DELETE"; body?: unknown }): Promise<ActionResult<T>> {
  const res = await serverMutate<T>(input);
  trackApiResult(input, res);
  // in the app: a light tap when something is saved
  if (res.ok && !QUIET.includes(input.path)) hapticSuccess();
  return res;
}
