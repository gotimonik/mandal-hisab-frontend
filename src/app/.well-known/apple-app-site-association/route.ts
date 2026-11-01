import { APP_IDS, APP_LINK_PREFIXES } from "@/lib/native";

/**
 * iOS Universal Links: tapping a mandalhisab.com link to a Mandal screen, an invitation or a
 * sign-in email opens the MandalHisab app when it's installed (Safari otherwise).
 * Apple fetches this once when the app is installed / updated; it must be served without a redirect.
 */
export function GET() {
  const components = APP_LINK_PREFIXES.flatMap((p) => [{ "/": p }, { "/": `${p}/*` }]);
  return Response.json(
    { applinks: { details: [{ appIDs: [APP_IDS.ios], components }] }, webcredentials: { apps: [APP_IDS.ios] } },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
