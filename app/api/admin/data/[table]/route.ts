import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminApi } from "@/lib/auth/admin";
import { z } from "zod";
import {
  achievementSchema,
  certificationSchema,
  enquiryStatusSchema,
  profileSchema,
  projectSchema,
  skillGroupSchema,
  skillSchema,
  updateSchema,
} from "@/lib/validation/schemas";

export const runtime = "nodejs";
const allowedTables = [
  "profiles",
  "projects",
  "skill_groups",
  "skills",
  "certifications",
  "achievements",
  "updates",
  "enquiries",
] as const;
const contentSchemas = {
  profiles: profileSchema,
  projects: projectSchema,
  skill_groups: skillGroupSchema,
  skills: skillSchema,
  certifications: certificationSchema,
  achievements: achievementSchema,
  updates: updateSchema,
};
const noStore = { "Cache-Control": "no-store" };
const mediaByTable = {
  projects: { bucket: "project-images", column: "image_path" },
  certifications: { bucket: "certificate-files", column: "file_path" },
  achievements: { bucket: "achievement-images", column: "image_path" },
} as const;
async function removeMedia(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  table: string,
  column: string,
) {
  const { data: references, error: lookupError } = await supabase
    .from(table)
    .select("id")
    .eq(column, path)
    .limit(1);
  if (lookupError) {
    console.error("[admin-content] Could not verify media references", {
      table,
      code: lookupError.code,
    });
    return false;
  }
  if (references?.length) return true;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error("[admin-content] Storage cleanup failed", {
      bucket,
      status: error.statusCode,
      code: error.name,
    });
    return false;
  }
  return true;
}
function validateContent(table: string, value: Record<string, unknown>, partial: boolean) {
  if (table === "enquiries") return partial ? enquiryStatusSchema.safeParse(value) : null;
  const schema = contentSchemas[table as keyof typeof contentSchemas];
  if (!schema) return null;
  return (partial ? schema.partial() : schema).safeParse(value);
}
export async function GET(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const auth = await adminApi();
  if (!auth.ok)
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status, headers: noStore });
  const { table } = await params;
  if (!allowedTables.includes(table as (typeof allowedTables)[number]))
    return NextResponse.json({ error: "Unknown content type" }, { status: 404, headers: noStore });
  const url = new URL(request.url);
  let query = auth.supabase.from(table).select("*");
  const status = url.searchParams.get("status");
  if (table === "enquiries" && status && ["unread", "read", "replied", "archived"].includes(status))
    query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error)
    return NextResponse.json(
      { error: "Could not load records." },
      { status: 500, headers: noStore },
    );
  return NextResponse.json({ data }, { headers: noStore });
}
export async function POST(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const auth = await adminApi();
  if (!auth.ok)
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status, headers: noStore });
  const { table } = await params;
  if (!allowedTables.includes(table as (typeof allowedTables)[number]))
    return NextResponse.json({ error: "Unknown content type" }, { status: 404, headers: noStore });
  if (table === "enquiries")
    return NextResponse.json(
      { error: "Enquiries can only be submitted through the visitor enquiry form." },
      { status: 405, headers: noStore },
    );
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 30_000)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = z.record(z.unknown()).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid record" }, { status: 400 });
  const validated = validateContent(table, parsed.data, false);
  if (!validated?.success) {
    const media = mediaByTable[table as keyof typeof mediaByTable];
    const path = media ? parsed.data[media.column] : null;
    if (media && typeof path === "string")
      await removeMedia(auth.supabase, media.bucket, path, table, media.column);
    return NextResponse.json(
      { error: "The record contains invalid fields or values." },
      { status: 400 },
    );
  }
  const row = { ...validated.data };
  const { data, error } = await auth.supabase
    .from(table)
    .insert(row as never)
    .select()
    .single();
  if (error) {
    const media = mediaByTable[table as keyof typeof mediaByTable];
    const path = media ? (row as Record<string, unknown>)[media.column] : null;
    const cleanupWarning =
      !!media &&
      typeof path === "string" &&
      !(await removeMedia(auth.supabase, media.bucket, path, table, media.column));
    return NextResponse.json(
      {
        error: cleanupWarning
          ? "The record was not saved, and its uploaded file could not be removed from private storage."
          : "Could not save record. Check required fields and unique values.",
      },
      { status: 400, headers: noStore },
    );
  }
  revalidateTag("public-portfolio", "max");
  return NextResponse.json({ data }, { status: 201, headers: noStore });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const auth = await adminApi();
  if (!auth.ok)
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status, headers: noStore });
  const { table } = await params;
  if (!allowedTables.includes(table as (typeof allowedTables)[number]))
    return NextResponse.json({ error: "Unknown content type" }, { status: 404, headers: noStore });
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 30_000)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = z
    .object({ id: z.string().uuid(), data: z.record(z.unknown()) })
    .strict()
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid record" }, { status: 400 });
  const validated = validateContent(table, parsed.data.data, true);
  if (!validated?.success) {
    const media = mediaByTable[table as keyof typeof mediaByTable];
    const path = media ? parsed.data.data[media.column] : null;
    if (media && typeof path === "string")
      await removeMedia(auth.supabase, media.bucket, path, table, media.column);
    return NextResponse.json(
      { error: "The record contains invalid fields or values." },
      { status: 400 },
    );
  }
  const update = { ...validated.data };
  const media = mediaByTable[table as keyof typeof mediaByTable];
  let previousMediaPath: string | null = null;
  if (media) {
    const { data: previous } = await auth.supabase
      .from(table)
      .select(media.column)
      .eq("id", parsed.data.id)
      .maybeSingle();
    const previousValue = (previous as Record<string, unknown> | null)?.[media.column];
    if (typeof previousValue === "string") previousMediaPath = previousValue;
  }
  const nextMediaPath = media ? (update as Record<string, unknown>)[media.column] : null;
  const { data, error } = await auth.supabase
    .from(table)
    .update(update as never)
    .eq("id", parsed.data.id)
    .select()
    .single();
  if (error) {
    const cleanupWarning =
      !!media &&
      typeof nextMediaPath === "string" &&
      nextMediaPath !== previousMediaPath &&
      !(await removeMedia(auth.supabase, media.bucket, nextMediaPath, table, media.column));
    return NextResponse.json(
      {
        error: cleanupWarning
          ? "The record was not updated, and its uploaded file could not be removed from private storage."
          : "Could not update record.",
      },
      { status: 400, headers: noStore },
    );
  }
  let cleanupWarning = false;
  if (
    media &&
    previousMediaPath &&
    (typeof nextMediaPath === "string" || nextMediaPath === null) &&
    nextMediaPath !== previousMediaPath
  ) {
    cleanupWarning = !(await removeMedia(
      auth.supabase,
      media.bucket,
      previousMediaPath,
      table,
      media.column,
    ));
  }
  revalidateTag("public-portfolio", "max");
  return NextResponse.json({ data, cleanupWarning }, { headers: noStore });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const auth = await adminApi();
  if (!auth.ok)
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status, headers: noStore });
  const { table } = await params;
  if (!allowedTables.includes(table as (typeof allowedTables)[number]))
    return NextResponse.json({ error: "Unknown content type" }, { status: 404, headers: noStore });
  const parsed = z
    .object({ id: z.string().uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
  const media = mediaByTable[table as keyof typeof mediaByTable];
  let mediaPath: string | null = null;
  if (media) {
    const { data } = await auth.supabase
      .from(table)
      .select(media.column)
      .eq("id", parsed.data.id)
      .maybeSingle();
    mediaPath = ((data as Record<string, unknown> | null)?.[media.column] as string | null) ?? null;
  }
  const { error } = await auth.supabase.from(table).delete().eq("id", parsed.data.id);
  if (error)
    return NextResponse.json(
      { error: "Could not delete record." },
      { status: 400, headers: noStore },
    );
  const cleanupWarning =
    !!media &&
    !!mediaPath &&
    !(await removeMedia(auth.supabase, media.bucket, mediaPath, table, media.column));
  revalidateTag("public-portfolio", "max");
  return NextResponse.json({ ok: true, cleanupWarning }, { headers: noStore });
}
