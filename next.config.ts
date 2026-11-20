import type { NextConfig } from "next";

const prefix = process.env.ADMIN_ROUTE_PREFIX?.replace(/^\/+|\/+$/g, "");
const browserPrefix = process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX?.replace(/^\/+|\/+$/g, "");
if (prefix && browserPrefix && prefix !== browserPrefix)
  throw new Error("NEXT_PUBLIC_ADMIN_ROUTE_PREFIX must match ADMIN_ROUTE_PREFIX.");
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : []),
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  env: {
    ...(process.env.SUPABASE_URL ? { NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL } : {}),
    ...(process.env.SUPABASE_PUBLISHABLE_KEY
      ? { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY }
      : {}),
    NEXT_PUBLIC_ADMIN_ROUTE_PREFIX: browserPrefix || "",
  },
  async rewrites() {
    if (
      !prefix ||
      prefix.length < 32 ||
      prefix.split("/").some((part) => !/^[a-zA-Z0-9_-]{1,64}$/.test(part))
    )
      return [];
    return [
      { source: `/${prefix}/admin/edit`, destination: "/admin/edit" },
      { source: `/${prefix}/admin/login`, destination: "/admin/login" },
      { source: `/${prefix}/admin/logout`, destination: "/admin/logout" },
      { source: `/${prefix}/admin/:path*`, destination: "/admin/:path*" },
    ];
  },
};
export default nextConfig;
