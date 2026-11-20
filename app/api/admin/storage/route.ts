import { NextResponse } from "next/server";
import { adminApi } from "@/lib/auth/admin";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { z } from "zod";
const bucketSchema = z.enum(["project-images", "certificate-files", "achievement-images"]);
const pathSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpeg|webp|pdf)$/i,
  );
export async function GET(request: Request) {
  const auth = await adminApi();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  const query = new URL(request.url).searchParams;
  const parsed = z
    .object({
      bucket: bucketSchema,
      path: z.string().min(1).max(500),
    })
    .safeParse({ bucket: query.get("bucket"), path: query.get("path") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  try {
    const client = createPrivilegedClient();
    const { data, error } = await client.storage
      .from(parsed.data.bucket)
      .createSignedUrl(parsed.data.path, 120);
    if (error || !data)
      return NextResponse.json({ error: "Could not create file link." }, { status: 404 });
    return NextResponse.redirect(data.signedUrl, {
      headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const auth = await adminApi();
  if (!auth.ok)
    return NextResponse.json(
      { error: "Administrator permission denied." },
      { status: auth.status },
    );
  const parsed = z
    .object({ bucket: bucketSchema, path: pathSchema })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid storage cleanup request." }, { status: 400 });
  const owner =
    parsed.data.bucket === "certificate-files"
      ? { table: "certifications", column: "file_path" }
      : parsed.data.bucket === "project-images"
        ? { table: "projects", column: "image_path" }
        : { table: "achievements", column: "image_path" };
  const { data: references, error: referenceError } = await auth.supabase
    .from(owner.table)
    .select("id")
    .eq(owner.column, parsed.data.path)
    .limit(1);
  if (referenceError) {
    console.error("[admin-storage] Could not check file references", {
      bucket: parsed.data.bucket,
      code: referenceError.code,
    });
    return NextResponse.json(
      { error: "Could not safely verify whether the file is in use." },
      { status: 503 },
    );
  }
  if (references?.length)
    return NextResponse.json(
      { ok: true, referenced: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  const { error } = await auth.supabase.storage.from(parsed.data.bucket).remove([parsed.data.path]);
  if (error) {
    console.error("[admin-storage] Pending upload cleanup failed", {
      bucket: parsed.data.bucket,
      status: error.statusCode,
      code: error.name,
    });
    return NextResponse.json(
      {
        error:
          "The unused file could not be removed. It may need manual cleanup in Supabase Storage.",
      },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
