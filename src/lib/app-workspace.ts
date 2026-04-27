/**
 * App areas where the command palette, trip navigation shortcuts, and related
 * keyboard affordances are enabled. Public marketing, auth, invite, and OAuth
 * callback routes are excluded.
 */
export function isAppWorkspacePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/dashboard") || pathname.startsWith("/trips")
  );
}
