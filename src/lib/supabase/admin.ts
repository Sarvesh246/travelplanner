import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 *
 * Use for cross-user admin tasks (for example cleaning up every upload under a
 * shared trip storage folder when the trip is deleted). Do NOT import from
 * client components.
 *
 * Returns `null` when `SUPABASE_SERVICE_ROLE_KEY` (or the URL) is missing so
 * callers can choose to fall back to a best-effort SSR client or skip the
 * admin-only step.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
