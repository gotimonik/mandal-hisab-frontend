/**
 * Where "back" goes when there's no in-app history to go back through (the app was opened straight
 * onto this screen, e.g. from a notification or after a reload). `null` = a top-level screen, no back.
 */
export function parentPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "org" && parts[1]) {
    const base = `/org/${parts[1]}`;
    const rest = parts.slice(2);
    if (rest.length === 0) return null; // the dashboard
    if (rest.length === 1) return base;
    if (rest[0] === "my" || rest[0] === "receipts") return rest[0] === "my" ? `${base}/my` : base; // no list page in between
    return `${base}/${rest.slice(0, -1).join("/")}`;
  }
  if (parts[0] === "personal") return parts.length === 1 ? null : `/${parts.slice(0, -1).join("/")}`;
  if (parts.length === 0 || parts[0] === "onboarding") return null;
  return "/onboarding";
}
