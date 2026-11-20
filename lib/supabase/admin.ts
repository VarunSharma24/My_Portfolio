import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

export function createPrivilegedClient() {
  const env = getServerEnv();
  if (!env.secretKey)
    throw new Error("SUPABASE_SECRET_KEY is required for this protected server operation.");
  return createSupabaseClient(env.supabaseUrl, env.secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
