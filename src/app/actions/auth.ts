"use server";

import { redirect } from "next/navigation";
import { apiCall } from "@/lib/server/api";
import { clearSession, setSession } from "@/lib/server/session";
import type { ActionResult } from "@/lib/action-result";
import { toActionError } from "./api";

export async function loginAction(input: { email: string; password: string }): Promise<ActionResult<null>> {
  try {
    const r = await apiCall<{ token: string; expiresAt: string }>("/auth/login", { method: "POST", body: input, token: null });
    await setSession(r.token, r.expiresAt);
  } catch (e) {
    return toActionError(e);
  }
  return { ok: true, data: null };
}

/**
 * Create the account. New accounts must verify their email before they can sign in, so the
 * user is only signed in straight away when the API says the email is already verified
 * (they registered from an invitation sent to that address).
 */
export async function registerAction(input: { name: string; email: string; phone?: string; password: string; inviteToken?: string }): Promise<ActionResult<{ verified: boolean }>> {
  try {
    const user = await apiCall<{ emailVerified: boolean }>("/auth/register", { method: "POST", body: input, token: null });
    if (!user.emailVerified) return { ok: true, data: { verified: false } };
    const r = await apiCall<{ token: string; expiresAt: string }>("/auth/login", { method: "POST", body: { email: input.email, password: input.password }, token: null });
    await setSession(r.token, r.expiresAt);
    return { ok: true, data: { verified: true } };
  } catch (e) {
    return toActionError(e);
  }
}

/** Resend the verification link to someone who can't sign in yet. */
export async function resendVerificationEmailAction(email: string): Promise<ActionResult<null>> {
  try {
    await apiCall("/auth/resend-verification-email", { method: "POST", body: { email }, token: null });
    return { ok: true, data: null };
  } catch (e) {
    return toActionError(e);
  }
}

export async function logoutAction() {
  try {
    await apiCall("/auth/logout", { method: "POST", body: {} });
  } catch {
    // session may already be invalid
  }
  await clearSession();
  redirect("/login");
}

export async function forgotPasswordAction(input: { email: string }): Promise<ActionResult<null>> {
  try {
    await apiCall("/auth/forgot-password", { method: "POST", body: input, token: null });
    return { ok: true, data: null };
  } catch (e) {
    return toActionError(e);
  }
}

export async function resetPasswordAction(input: { token: string; password: string }): Promise<ActionResult<null>> {
  try {
    await apiCall("/auth/reset-password", { method: "POST", body: input, token: null });
    await clearSession();
    return { ok: true, data: null };
  } catch (e) {
    return toActionError(e);
  }
}

export async function verifyEmailAction(token: string): Promise<ActionResult<{ email: string | null }>> {
  try {
    const r = await apiCall<{ email?: string | null }>("/auth/verify-email", { method: "POST", body: { token }, token: null });
    return { ok: true, data: { email: r.email ?? null } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function changePasswordAction(input: { currentPassword: string; newPassword: string }): Promise<ActionResult<null>> {
  try {
    await apiCall("/auth/change-password", { method: "POST", body: input });
    await clearSession();
    return { ok: true, data: null };
  } catch (e) {
    return toActionError(e);
  }
}
