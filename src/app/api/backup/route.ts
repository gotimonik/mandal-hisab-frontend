import { type NextRequest } from "next/server";
import { apiRequest } from "@/lib/server/api";

/**
 * The Mandal's backup file (Settings → Backup): forwarded from the API with the user's session,
 * so only the Mandal's own admins get it.
 */
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId") ?? "";
  if (!/^[a-f0-9]{24}$/.test(orgId)) return new Response("Not allowed", { status: 400 });
  const res = await apiRequest(`/orgs/${orgId}/backup`);
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return new Response(j?.error?.message ?? "Backup failed", { status: res.status });
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": res.headers.get("content-disposition") ?? 'attachment; filename="MandalHisab-backup.json"',
      "Cache-Control": "no-store",
    },
  });
}
