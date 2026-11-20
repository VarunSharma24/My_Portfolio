import { z } from "zod";

const url = z
  .string()
  .url()
  .max(2048)
  .refine((value) => new URL(value).protocol === "https:")
  .or(z.literal(""))
  .nullable()
  .transform((v) => v || null);
const assetPath = z
  .string()
  .regex(/^[0-9a-f-]{36}\.(png|jpeg|webp|pdf)$/i)
  .max(500)
  .nullable()
  .optional();
export const enquirySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    subject: z.string().trim().min(2).max(160),
    message: z.string().trim().min(10).max(5000),
    website: z.string().max(0).optional().default(""),
    confirmed: z.literal(true),
  })
  .strict();

export const projectSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    short_description: z.string().trim().max(280),
    description: z.string().trim().max(12000),
    technologies: z.array(z.string().trim().min(1).max(50)).max(30),
    github_url: url,
    live_url: url,
    image_path: assetPath,
    featured: z.boolean(),
    published: z.boolean(),
    display_order: z.number().int().min(0).max(10000),
  })
  .strict();

export const profileSchema = z
  .object({
    display_name: z.string().trim().min(1).max(100),
    headline: z.string().trim().min(1).max(180),
    introduction: z.string().max(1500),
    about: z.string().max(6000),
    public_email: z.string().email().max(254).nullable(),
    github_url: url,
    linkedin_url: url,
    social_links: z.record(
      z
        .string()
        .url()
        .max(2048)
        .refine((value) => new URL(value).protocol === "https:"),
    ),
    is_public: z.boolean().optional(),
  })
  .strict();
export const skillGroupSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    display_order: z.number().int().min(0).max(10000),
  })
  .strict();
export const skillSchema = z
  .object({
    group_id: z.string().uuid(),
    name: z.string().trim().min(1).max(80),
    display_order: z.number().int().min(0).max(10000),
  })
  .strict();
export const certificationSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    issuer: z.string().trim().min(1).max(180),
    issue_date: z.string().date().nullable(),
    description: z.string().max(2000),
    file_path: assetPath,
    verification_url: url,
    published: z.boolean(),
  })
  .strict();
export const achievementSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    description: z.string().max(3000),
    achievement_date: z.string().date().nullable(),
    image_path: assetPath,
    external_url: url,
    published: z.boolean(),
  })
  .strict();
export const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    content: z.string().max(12000),
    published_at: z.string().date().nullable(),
    published: z.boolean(),
  })
  .strict();
export const enquiryStatusSchema = z
  .object({ status: z.enum(["unread", "read", "replied", "archived"]) })
  .strict();
