import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

// Public content must be queried anonymously, even when the current request
// carries an administrator cookie. RLS then limits the result to public data.
export function createPublicClient() {
  const env = getServerEnv();
  return createSupabaseClient(env.supabaseUrl, env.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
