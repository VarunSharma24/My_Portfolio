import { NextResponse, type NextRequest } from "next/server";

// The rewrite-only internal implementation paths are never valid public URLs.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
