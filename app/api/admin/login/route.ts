import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
import { z } from "zod";

export async function POST(request: Request) {
  const ip = requestKey(request);
  if (!rateLimit(`login:${ip}`, 5, 15 * 60_000).allowed)
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 4000)
      return NextResponse.json({ error: "Invalid request." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = z
    .object({ email: z.string().email().max(254), password: z.string().min(1).max(256) })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  try {
    const env = getServerEnv();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user)
      return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
    if (data.user.id !== env.adminUserId) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This account is not authorized to administer the portfolio." },
        { status: 403 },
      );
    }
    const { data: member, error: membershipError } = await supabase.rpc("is_portfolio_admin");
    if (membershipError || member !== true) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error: membershipError
            ? "Administrator membership is unavailable. Apply the portfolio database migration."
            : "This account is not registered as a portfolio administrator.",
        },
        { status: membershipError ? 503 : 403 },
      );
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Login is temporarily unavailable." }, { status: 503 });
  }
}
