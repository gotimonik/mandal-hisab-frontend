import { type NextRequest } from "next/server";
import { apiRequest } from "@/lib/server/api";

/**
 * A Personal Hisab bill (photo / PDF), opened from an entry. Forwarded to the API with the
 * person's session, which only hands the file to its owner — the stored file's address is never
 * given to the browser.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new Response("Not found", { status: 404 });
  const res = await apiRequest(`/me/personal/bills/${id}/file`, { headers: { Accept: "*/*" } });
  if (!res.ok) return new Response(res.status === 404 ? "This bill isn't available any more." : "Couldn't open the bill.", { status: res.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": res.headers.get("content-disposition") ?? "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
