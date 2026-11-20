import { requireAdmin } from "@/lib/auth/admin";
import { getServerEnv } from "@/lib/env";
import { AdminOverview } from "@/components/admin/admin-overview";
export const metadata = { title: "Portfolio dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const env = getServerEnv();
  const [p, c, a, s, u, e, recent, projects, certificates, achievements, updates] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("certifications").select("id", { count: "exact", head: true }),
    supabase.from("achievements").select("id", { count: "exact", head: true }),
    supabase.from("skills").select("id", { count: "exact", head: true }),
    supabase.from("updates").select("id", { count: "exact", head: true }),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "unread"),
    supabase
      .from("enquiries")
      .select("id,name,email,subject,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("projects")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("certifications")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("achievements")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("updates")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  const content = [
    ...(projects.data || []).map((row) => ({ ...row, kind: "Project" })),
    ...(certificates.data || []).map((row) => ({ ...row, kind: "Certificate" })),
    ...(achievements.data || []).map((row) => ({ ...row, kind: "Achievement" })),
    ...(updates.data || []).map((row) => ({ ...row, kind: "Update" })),
  ]
    .sort((x, y) => y.created_at.localeCompare(x.created_at))
    .slice(0, 6);
  return (
    <AdminOverview
      prefix={env.adminPrefix}
      stats={{
        projects: p.count || 0,
        certificates: c.count || 0,
        achievements: a.count || 0,
        skills: s.count || 0,
        updates: u.count || 0,
        unread: e.count || 0,
      }}
      recent={recent.data || []}
      content={content}
    />
  );
}
