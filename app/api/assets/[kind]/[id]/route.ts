import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
const assets = {
  projects: { table: "projects", bucket: "project-images", column: "image_path" },
  achievements: { table: "achievements", bucket: "achievement-images", column: "image_path" },
} as const;
export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  if (!rateLimit(`asset:${requestKey(request)}`, 60, 60_000).allowed)
    return NextResponse.json(
      { error: "Please wait before requesting more images." },
      { status: 429 },
    );
  const { kind, id } = await params;
  if (!z.string().uuid().safeParse(id).success || !(kind in assets))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const config = assets[kind as keyof typeof assets];
  try {
    const db = createPrivilegedClient();
    const { data, error } = await db
      .from(config.table)
      .select(config.column)
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();
    const path = data?.[config.column];
    if (error || typeof path !== "string" || !path)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { data: link, error: storageError } = await db.storage
      .from(config.bucket)
      .createSignedUrl(path, 180);
    if (storageError || !link)
      return NextResponse.json({ error: "Image unavailable" }, { status: 404 });
    return NextResponse.redirect(link.signedUrl, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Image unavailable" }, { status: 503 });
  }
}
