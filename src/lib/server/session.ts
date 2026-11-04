import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "mh_session";
export const ORG_COOKIE = "mh_org";
/** Personal Hisab: the book chosen on this device (absent = the person's main book). */
export const BOOK_COOKIE = "mh_book";

/** The API bearer token lives only in an HttpOnly cookie; client JS can never read it. */
export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function setSession(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  c.delete(ORG_COOKIE);
  c.delete(BOOK_COOKIE);
}

export async function currentBook(): Promise<string | null> {
  const v = (await cookies()).get(BOOK_COOKIE)?.value ?? null;
  return v && /^[a-f0-9]{24}$/.test(v) ? v : null;
}

/** Remember the Personal Hisab book on this device; null = back to the main book. */
export async function rememberBook(bookId: string | null) {
  const c = await cookies();
  if (!bookId) c.delete(BOOK_COOKIE);
  else c.set(BOOK_COOKIE, bookId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function rememberOrg(orgId: string) {
  (await cookies()).set(ORG_COOKIE, orgId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function lastOrg(): Promise<string | null> {
  return (await cookies()).get(ORG_COOKIE)?.value ?? null;
}
