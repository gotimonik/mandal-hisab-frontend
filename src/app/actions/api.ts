"use server";

import { ApiError, apiCall } from "@/lib/server/api";
import { rememberOrg } from "@/lib/server/session";
import type { ActionResult } from "@/lib/action-result";
import type { BillScan } from "@/features/personal/types";

/**
 * Generic mutation proxy used by client components. The browser never sees the API
 * token: this runs on the server, attaches the HttpOnly session token and forwards the
 * call. Paths are restricted to the user-facing API surface; authorization is enforced
 * by the API itself for every request.
 */
const ALLOWED = /^\/(orgs\/[a-f0-9]{24}(\/[A-Za-z0-9_\-/.]*)?|organizations(\/[a-z-]+)?|invitations\/(accept|mine|[a-f0-9]{24}\/(accept|decline))|notifications(\/read)?|auth\/(me|change-password|resend-verification|logout-all)|me\/push-devices|me\/personal\/[a-z-]+(\/[a-f0-9]{24}(\/(paid|skip|later))?)?|me\/personal\/bills\/usage|platform\/[A-Za-z0-9_\-/]+)$/;

export async function apiMutate<T = unknown>(input: { path: string; method?: "POST" | "PATCH" | "DELETE"; body?: unknown }): Promise<ActionResult<T>> {
  const pathOnly = input.path.split("?")[0];
  if (!ALLOWED.test(pathOnly) || pathOnly.includes("..")) return { ok: false, error: "Not allowed" };
  try {
    const data = await apiCall<T>(input.path, { method: input.method ?? "POST", body: input.body ?? {} });
    return { ok: true, data };
  } catch (e) {
    return toActionError(e);
  }
}

/** Read-only helper for client components that need fresh data (e.g. allocation preview). */
export async function apiRead<T = unknown>(path: string): Promise<ActionResult<T>> {
  const pathOnly = path.split("?")[0];
  if (!ALLOWED.test(pathOnly) || pathOnly.includes("..")) return { ok: false, error: "Not allowed" };
  try {
    return { ok: true, data: await apiCall<T>(path) };
  } catch (e) {
    return toActionError(e);
  }
}

export async function selectOrg(orgId: string) {
  if (/^[a-f0-9]{24}$/.test(orgId)) await rememberOrg(orgId);
}

export async function toActionError(e: unknown): Promise<{ ok: false; error: string; code?: string; fieldErrors?: Record<string, string> }> {
  if (e instanceof ApiError) {
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(e.details)) {
      for (const d of e.details as { path: string; message: string }[]) if (d.path && !fieldErrors[d.path]) fieldErrors[d.path] = d.message;
    }
    // Some conflicts carry a more specific code (e.g. DUPLICATE_SUSPECTED → ask the user to confirm)
    const detailCode = e.details && typeof e.details === "object" && !Array.isArray(e.details) ? (e.details as { code?: unknown }).code : undefined;
    return { ok: false, error: e.message, code: typeof detailCode === "string" ? detailCode : e.code, fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined };
  }
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/** Forward a receipt/invoice file to the API (which validates type, size and content). */
export async function uploadAttachment(orgId: string, formData: FormData): Promise<ActionResult<{ url: string; name: string; contentType: string; size: number }>> {
  if (!/^[a-f0-9]{24}$/.test(orgId)) return { ok: false, error: "Not allowed" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose a file" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Files must be smaller than 5 MB" };
  const { getSessionToken } = await import("@/lib/server/session");
  const token = await getSessionToken();
  const fd = new FormData();
  fd.set("file", file);
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/orgs/${orgId}/uploads`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd, cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { data?: { url: string; name: string; contentType: string; size: number }; error?: { message: string } };
    if (!res.ok || !json.data) return { ok: false, error: json.error?.message ?? "Upload failed" };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Upload failed" };
  }
}

/**
 * Personal Hisab: send a bill photo / PDF (max 5 MB) to be kept and read. The API checks the
 * owner, the type, the size and the monthly limit, and returns what it read off the bill.
 */
export async function scanPersonalBill(formData: FormData): Promise<ActionResult<BillScan>> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose a bill" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "The bill must be 5 MB or smaller", code: "BILL_TOO_BIG" };
  const { getSessionToken } = await import("@/lib/server/session");
  const token = await getSessionToken();
  const fd = new FormData();
  fd.set("file", file);
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/me/personal/bills`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd, cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { data?: BillScan; error?: { message: string; details?: { code?: string } } };
    if (!res.ok || !json.data) return { ok: false, error: json.error?.message ?? "Upload failed", code: json.error?.details?.code };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Upload failed" };
  }
}

/** Forward a Mandal logo (PNG / JPEG / WEBP, max 1 MB) to the API, which stores it in Vercel Blob. */
export async function uploadOrgLogo(orgId: string, formData: FormData): Promise<ActionResult<{ logoUrl: string }>> {
  if (!/^[a-f0-9]{24}$/.test(orgId)) return { ok: false, error: "Not allowed" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose an image" };
  if (file.size > 1024 * 1024) return { ok: false, error: "The logo must be 1 MB or smaller" };
  const { getSessionToken } = await import("@/lib/server/session");
  const token = await getSessionToken();
  const fd = new FormData();
  fd.set("file", file);
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/orgs/${orgId}/logo`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd, cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { data?: { logoUrl: string }; error?: { message: string } };
    if (!res.ok || !json.data) return { ok: false, error: json.error?.message ?? "Upload failed" };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Upload failed" };
  }
}

export interface RestoreSummary {
  organization: { id: string; name: string; code: string };
  backupCreatedAt: string;
  signatureValid: boolean;
  existsInDatabase: boolean;
  replacedExisting: boolean;
  usersCreated: number;
  usersMatchedByEmail: number;
  counts: Record<string, number>;
  dryRun: boolean;
}

/**
 * Platform admin: load a Mandal back from its backup file (compressed in the browser).
 * `dryRun` only checks the file; the API refuses everyone who isn't a platform admin.
 */
export async function restoreMandalBackup(formData: FormData, opts: { dryRun?: boolean; replace?: boolean; trustUnsigned?: boolean }): Promise<ActionResult<RestoreSummary>> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose the backup file" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "The backup file is too big to upload (max 5 MB). Restore it with npm run backup:restore instead." };
  const { getSessionToken } = await import("@/lib/server/session");
  const token = await getSessionToken();
  const fd = new FormData();
  fd.set("file", file);
  const q = new URLSearchParams();
  if (opts.dryRun) q.set("dryRun", "1");
  if (opts.replace) q.set("replace", "1");
  if (opts.trustUnsigned) q.set("trustUnsigned", "1");
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/platform/backups/restore?${q}`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd, cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { data?: RestoreSummary; error?: { message: string } };
    if (!res.ok || !json.data) return { ok: false, error: json.error?.message ?? "Restore failed" };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Restore failed — the server couldn't be reached" };
  }
}
