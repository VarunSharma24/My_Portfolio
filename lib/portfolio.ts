import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Achievement,
  Certification,
  Profile,
  Project,
  Skill,
  SkillGroup,
  Update,
} from "@/types/database";

const fallbackProfile: Profile = {
  id: "",
  display_name: "Varun Sharma",
  headline: "Ethical Hacker · Developer · AI & Technology Builder",
  introduction:
    "I explore cybersecurity, build software, and experiment with AI to create useful technology. Always learning, testing, and building.",
  about:
    "I’m especially interested in ethical hacking and cybersecurity, alongside software development and practical AI. I enjoy learning by testing ideas and building useful technology responsibly.",
  public_email: null,
  github_url: null,
  linkedin_url: null,
  social_links: {},
  updated_at: "",
};

export async function getPortfolioData() {
  try {
    const supabase = createPublicClient();
    const [p, projects, groups, certificates, achievements, updates] = await Promise.all([
      supabase.from("profiles").select("*").limit(1).maybeSingle(),
      supabase.from("projects").select("*").eq("published", true).order("display_order"),
      supabase.from("skill_groups").select("*,skills(*)").order("display_order"),
      supabase
        .from("certifications")
        .select("*")
        .eq("published", true)
        .order("issue_date", { ascending: false }),
      supabase
        .from("achievements")
        .select("*")
        .eq("published", true)
        .order("achievement_date", { ascending: false }),
      supabase
        .from("updates")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false }),
    ]);
    return {
      profile: (p.data as Profile | null) ?? fallbackProfile,
      projects: (projects.data as Project[] | null) ?? [],
      groups: ((groups.data as (SkillGroup & { skills: Skill[] })[] | null) ?? []).map((g) => ({
        ...g,
        skills: [...(g.skills ?? [])].sort((a, b) => a.display_order - b.display_order),
      })),
      certificates: (certificates.data as Certification[] | null) ?? [],
      achievements: (achievements.data as Achievement[] | null) ?? [],
      updates: (updates.data as Update[] | null) ?? [],
    };
  } catch {
    return {
      profile: fallbackProfile,
      projects: [],
      groups: [],
      certificates: [],
      achievements: [],
      updates: [],
    };
  }
}

export const getAssistantPortfolioData = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [profile, projects, groups, skills, certificates, achievements, updates] =
      await Promise.all([
        supabase.from("profiles").select("display_name,headline").eq("is_public", true).limit(1),
        supabase
          .from("projects")
          .select("title,short_description,description,technologies,github_url,live_url")
          .eq("published", true)
          .order("display_order")
          .limit(12),
        supabase.from("skill_groups").select("id,name").order("display_order").limit(16),
        supabase.from("skills").select("group_id,name").order("display_order").limit(160),
        supabase
          .from("certifications")
          .select("title,issuer,issue_date,description,verification_url")
          .eq("published", true)
          .order("issue_date", { ascending: false })
          .limit(16),
        supabase
          .from("achievements")
          .select("title,description,achievement_date,external_url")
          .eq("published", true)
          .order("achievement_date", { ascending: false })
          .limit(16),
        supabase
          .from("updates")
          .select("title,content,published_at")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(12),
      ]);
    const failed = [profile, projects, groups, skills, certificates, achievements, updates].find(
      (result) => result.error,
    );
    if (failed?.error) throw new Error("Could not load public assistant context.");
    return {
      profile: profile.data?.[0] ?? { display_name: "Varun Sharma", headline: "" },
      projects: projects.data ?? [],
      groups: (groups.data ?? []).map((group) => ({
        name: group.name,
        skills: (skills.data ?? [])
          .filter((skill) => skill.group_id === group.id)
          .slice(0, 24)
          .map((skill) => skill.name),
      })),
      certificates: certificates.data ?? [],
      achievements: achievements.data ?? [],
      updates: updates.data ?? [],
    };
  },
  ["z-public-context-v1"],
  { revalidate: 300, tags: ["public-portfolio"] },
);
