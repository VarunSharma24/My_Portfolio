import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";

export async function requireAdmin() {
  const env = getServerEnv();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect(`/${env.adminPrefix}/admin/login`);
  if (user.id !== env.adminUserId) redirect("/unauthorized");
  const { data: member, error: membershipError } = await supabase.rpc("is_portfolio_admin");
  if (membershipError || member !== true) redirect("/unauthorized");
  return { supabase, user };
}

export async function adminApi() {
  const env = getServerEnv();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { ok: false as const, status: 401 };
  if (user.id !== env.adminUserId) return { ok: false as const, status: 403 };
  const { data: member, error: membershipError } = await supabase.rpc("is_portfolio_admin");
  if (membershipError) return { ok: false as const, status: 503 };
  if (member !== true) return { ok: false as const, status: 403 };
  return { ok: true as const, supabase, user };
}
