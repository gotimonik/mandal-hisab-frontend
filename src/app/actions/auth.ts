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

export async function registerAction(input: { name: string; email: string; phone?: string; password: string }): Promise<ActionResult<null>> {
  try {
    await apiCall("/auth/register", { method: "POST", body: input, token: null });
    const r = await apiCall<{ token: string; expiresAt: string }>("/auth/login", { method: "POST", body: { email: input.email, password: input.password }, token: null });
    await setSession(r.token, r.expiresAt);
  } catch (e) {
    return toActionError(e);
  }
  return { ok: true, data: null };
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

export async function verifyEmailAction(token: string): Promise<ActionResult<null>> {
  try {
    await apiCall("/auth/verify-email", { method: "POST", body: { token }, token: null });
    return { ok: true, data: null };
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
