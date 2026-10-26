import "server-only";
import { notFound, redirect } from "next/navigation";
import { getSessionToken } from "./session";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

type Init = { method?: string; body?: unknown; token?: string | null; raw?: boolean; headers?: Record<string, string> };

/** Low-level call to the backend. Never call from client components. */
export async function apiRequest(path: string, init: Init = {}): Promise<Response> {
  const token = init.token === undefined ? await getSessionToken() : init.token;
  const headers: Record<string, string> = { Accept: "application/json", ...(init.headers ?? {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  return fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
}

export async function apiCall<T>(path: string, init: Init = {}): Promise<T> {
  let res: Response;
  try {
    res = await apiRequest(path, init);
  } catch {
    throw new ApiError(503, "UNAVAILABLE", "The MandalHisab service is unreachable. Please try again shortly.");
  }
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: { code: string; message: string; details?: unknown } };
  if (!res.ok) {
    throw new ApiError(res.status, json.error?.code ?? "ERROR", json.error?.message ?? "Request failed", json.error?.details);
  }
  return json.data as T;
}

/**
 * For Server Components: fetch data, redirecting to /login on 401 and rendering
 * the not-found page on 404 (also used for cross-organization access attempts).
 */
export async function api<T>(path: string): Promise<T> {
  try {
    return await apiCall<T>(path);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) redirect("/login?expired=1");
      if (e.status === 404) notFound();
      if (e.status === 423) redirect("/onboarding");
    }
    throw e;
  }
}

export function qs(params: Record<string, string | number | undefined | null | boolean>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
}
