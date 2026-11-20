import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

export async function createClient() {
  const env = getServerEnv();
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.publishableKey, {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Server components cannot mutate cookies. */
        }
      },
    },
  });
}
