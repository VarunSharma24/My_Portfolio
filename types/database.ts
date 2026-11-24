export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Profile {
  id: string;
  display_name: string;
  headline: string;
  introduction: string;
  about: string;
  public_email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  social_links: Record<string, string>;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  technologies: string[];
  github_url: string | null;
  live_url: string | null;
  image_path: string | null;
  featured: boolean;
  published: boolean;
  display_order: number;
  created_at: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  display_order: number;
  skills?: Skill[];
}
export interface Skill {
  id: string;
  group_id: string;
  name: string;
  display_order: number;
}
export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issue_date: string | null;
  description: string;
  file_path: string | null;
  verification_url: string | null;
  published: boolean;
}
export interface Achievement {
  id: string;
  title: string;
  description: string;
  achievement_date: string | null;
  image_path: string | null;
  external_url: string | null;
  published: boolean;
}
export interface Update {
  id: string;
  title: string;
  slug: string;
  content: string;
  published_at: string | null;
  published: boolean;
  updated_at: string;
}
export interface Enquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  created_at: string;
}
