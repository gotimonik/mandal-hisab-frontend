import { type NextRequest } from "next/server";
import { apiRequest } from "@/lib/server/api";

/**
 * CSV download proxy: forwards to the API with the user's session so the same
 * authorization rules apply to exports as to the screens. Only report/statement
 * endpoints with format=csv are allowed.
 */
const ALLOWED = /^\/orgs\/[a-f0-9]{24}\/(reports\/[a-z-]+|members\/[a-f0-9]{24}\/(statement|ledger)|me\/(statement|ledger)|cashbook|monthly-report)$/;

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!ALLOWED.test(path)) return new Response("Not allowed", { status: 400 });
  const params = new URLSearchParams(req.nextUrl.searchParams);
  params.delete("path");
  params.set("format", "csv");
  const res = await apiRequest(`${path}?${params.toString()}`, { headers: { Accept: "text/csv" } });
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return new Response(j?.error?.message ?? "Export failed", { status: res.status });
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": res.headers.get("content-disposition") ?? 'attachment; filename="export.csv"',
      "Cache-Control": "no-store",
    },
  });
}
