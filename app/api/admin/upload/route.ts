import { NextResponse } from "next/server";
import { adminApi } from "@/lib/auth/admin";
import { z } from "zod";
export const runtime = "nodejs";
const buckets = ["project-images", "certificate-files", "achievement-images"] as const;
function matchesSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/png")
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  if (mime === "image/jpeg")
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/webp")
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  if (mime === "application/pdf")
    return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  return false;
}
export async function POST(request: Request) {
  const auth = await adminApi();
  if (!auth.ok) {
    const message =
      auth.status === 401
        ? "Sign in to upload files."
        : auth.status === 503
          ? "Administrator membership is unavailable. Apply the portfolio database migration."
          : "Administrator permission denied. Confirm this Auth user is registered in admin_members.";
    return NextResponse.json({ error: message }, { status: auth.status });
  }
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 9 * 1024 * 1024)
    return NextResponse.json({ error: "Files must be smaller than 8 MB." }, { status: 413 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const bucketResult = z.enum(buckets).safeParse(form.get("bucket"));
  const file = form.get("file");
  if (!bucketResult.success || !(file instanceof File))
    return NextResponse.json({ error: "Choose an allowed file and destination." }, { status: 400 });
  const bucket = bucketResult.data;
  const mime = file.type;
  const allowed =
    bucket === "certificate-files"
      ? ["image/png", "image/jpeg", "image/webp", "application/pdf"]
      : ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(mime))
    return NextResponse.json(
      {
        error:
          bucket === "certificate-files"
            ? "Certificate files must be PNG, JPEG, WebP, or PDF."
            : "This image must be PNG, JPEG, or WebP.",
      },
      { status: 415 },
    );
  if (file.size < 1 || file.size > 8 * 1024 * 1024)
    return NextResponse.json({ error: "Files must be smaller than 8 MB." }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(bytes.slice(0, 12), mime))
    return NextResponse.json(
      { error: "File content does not match the selected MIME type." },
      { status: 415 },
    );
  const extension = mime === "application/pdf" ? "pdf" : mime.split("/")[1];
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await auth.supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) {
    const status = Number(error.statusCode) || 500;
    const code = String(error.statusCode || error.name || "storage_error");
    console.error("[admin-upload] Storage rejected upload", { bucket, status, code });
    const message = error.message.toLowerCase();
    if (status === 404 || message.includes("bucket not found"))
      return NextResponse.json(
        {
          error: `Storage bucket “${bucket}” does not exist. Apply the portfolio storage migration.`,
        },
        { status: 503 },
      );
    if (status === 401)
      return NextResponse.json(
        { error: "Your administrator session expired. Sign in again and retry the upload." },
        { status: 401 },
      );
    if (status === 403 || /row level|policy|permission|not allowed/i.test(message))
      return NextResponse.json(
        {
          error:
            "Storage policy rejected this upload. Confirm your Auth user is in public.admin_members and the storage policies from the migration are installed.",
        },
        { status: 403 },
      );
    return NextResponse.json(
      { error: "Storage could not save this file. Check the server upload diagnostic and retry." },
      { status: 502 },
    );
  }
  return NextResponse.json({ path }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
