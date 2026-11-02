import { type NextRequest } from "next/server";
import { apiRequest } from "@/lib/server/api";

/** A nightly server backup file (encrypted), for platform admins to keep a copy elsewhere too. */
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") ?? "";
  if (!/^[\w.-]+\.mhsb$/.test(name)) return new Response("Not allowed", { status: 400 });
  const res = await apiRequest(`/platform/server-backups/download?name=${encodeURIComponent(name)}`, { headers: { Accept: "application/octet-stream" } });
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return new Response(j?.error?.message ?? "Download failed", { status: res.status });
  }
  return new Response(res.body, { status: 200, headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });
}
