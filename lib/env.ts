const required = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_JWKS_URL",
  "ADMIN_USER_ID",
  "ADMIN_ROUTE_PREFIX",
  "NEXT_PUBLIC_ADMIN_ROUTE_PREFIX",
] as const;

export function getServerEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length)
    throw new Error(`Missing required server configuration: ${missing.join(", ")}`);
  const prefix = process.env.ADMIN_ROUTE_PREFIX!.replace(/^\/+|\/+$/g, "");
  if (prefix.split("/").some((part) => !/^[a-zA-Z0-9_-]{1,64}$/.test(part)) || prefix.length < 32)
    throw new Error(
      "ADMIN_ROUTE_PREFIX must be a multi-segment route with at least 32 total characters, using only letters, numbers, underscores, and hyphens.",
    );
  if (process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX !== prefix)
    throw new Error("NEXT_PUBLIC_ADMIN_ROUTE_PREFIX must match ADMIN_ROUTE_PREFIX.");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      process.env.ADMIN_USER_ID!,
    )
  )
    throw new Error("ADMIN_USER_ID must be a valid UUID.");
  try {
    if (
      new URL(process.env.SUPABASE_URL!).protocol !== "https:" ||
      new URL(process.env.SUPABASE_JWKS_URL!).protocol !== "https:"
    )
      throw new Error();
  } catch {
    throw new Error("SUPABASE_URL and SUPABASE_JWKS_URL must be valid HTTPS URLs.");
  }
  return {
    supabaseUrl: process.env.SUPABASE_URL!,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY!,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    adminUserId: process.env.ADMIN_USER_ID!,
    adminPrefix: prefix,
    groqKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  };
}
