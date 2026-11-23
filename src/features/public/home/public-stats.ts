import "server-only";
import { cacheLife } from "next/cache";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";

export interface PublicStats {
  mandals: number;
  members: number;
  cities: number;
  haptaEntries: number;
  haptaCollectedPaise: number;
  upadsGiven: number;
  updatedAt: string;
}

/** Platform-wide totals for the home page (no sign-in). null when the API can't be reached. */
export async function getPublicStats(): Promise<PublicStats | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });
  try {
    const res = await fetch(`${API_URL}/public/stats`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: PublicStats };
    return json.data ?? null;
  } catch {
    return null;
  }
}
