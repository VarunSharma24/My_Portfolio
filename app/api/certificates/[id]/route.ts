import { NextResponse } from "next/server";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`certificate:${requestKey(request)}`, 30, 60_000).allowed)
    return NextResponse.json(
      { error: "Please wait before requesting more files." },
      { status: 429 },
    );
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const db = createPrivilegedClient();
    const { data, error } = await db
      .from("certifications")
      .select("file_path")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();
    if (error || !data?.file_path)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { data: link, error: storageError } = await db.storage
      .from("certificate-files")
      .createSignedUrl(data.file_path, 180);
    if (storageError || !link)
      return NextResponse.json({ error: "File unavailable" }, { status: 404 });
    return NextResponse.redirect(link.signedUrl, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 503 });
  }
}
