import { APP_IDS } from "@/lib/native";

/**
 * Android App Links: lets mandalhisab.com links open the Android app once it's on Google Play.
 * ANDROID_CERT_SHA256 = the app signing certificate's SHA-256 fingerprint(s), comma separated
 * (Play Console → Test and release → App integrity → App signing key certificate).
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean);
  const body = fingerprints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: APP_IDS.android, sha256_cert_fingerprints: fingerprints } }]
    : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
