import { NextResponse } from "next/server";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { enquirySchema } from "@/lib/validation/schemas";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  const ip = requestKey(request),
    allowed = rateLimit(`enquiry:${ip}`, 3, 60 * 60_000);
  if (!allowed.allowed)
    return reply({ error: "Please wait before submitting another enquiry." }, 429);
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 8_000) return reply({ error: "The enquiry is too large." }, 413);
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 8_000) return reply({ error: "The enquiry is too large." }, 413);
    body = JSON.parse(text);
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success)
    return reply({ error: "Please check the name, email, subject, and message." }, 400);
  if (parsed.data.website) return reply({ ok: true });
  try {
    const db = createPrivilegedClient();
    const { error } = await db.from("enquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: "unread",
    });
    if (error)
      return reply(
        { error: "Your enquiry could not be saved right now. Please try again later." },
        503,
      );
    return reply(
      {
        ok: true,
        message:
          "Your enquiry has been submitted successfully. Varun can review it in his private dashboard.",
      },
      201,
    );
  } catch {
    return reply({ error: "Enquiry submission is temporarily unavailable." }, 503);
  }
}
