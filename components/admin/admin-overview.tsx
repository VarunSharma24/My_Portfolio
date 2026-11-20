import Link from "next/link";
import {
  ArrowUpRight,
  FileBadge,
  FolderKanban,
  Medal,
  Newspaper,
  Inbox,
  Wrench,
} from "lucide-react";
import { AdminNavigation } from "@/components/admin/admin-navigation";
type Recent = {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  created_at: string;
};
type Content = { id: string; title: string; created_at: string; kind: string };
export function AdminOverview({
  prefix,
  stats,
  recent,
  content,
}: {
  prefix: string;
  stats: Record<string, number>;
  recent: Recent[];
  content: Content[];
}) {
  const cards = [
    ["Projects", stats.projects, FolderKanban, "projects"],
    ["Certificates", stats.certificates, FileBadge, "certifications"],
    ["Achievements", stats.achievements, Medal, "achievements"],
    ["Skills", stats.skills, Wrench, "skills"],
    ["Updates", stats.updates, Newspaper, "updates"],
    ["Unread enquiries", stats.unread, Inbox, "enquiries"],
  ] as const;
  const shortcuts = [
    ["Manage projects", "projects", FolderKanban],
    ["Manage certificates", "certifications", FileBadge],
    ["Manage updates", "updates", Newspaper],
  ] as const;
  return (
    <div className="admin-shell">
      <AdminNavigation prefix={prefix} active="edit" />
      <main className="admin-main">
        <div className="admin-top">
          <div className="admin-breadcrumb">
            <span>Workspace</span><i>/</i><b>Overview</b>
          </div>
          <span className="admin-private-note">
            <span /> Private workspace
          </span>
        </div>
        <div className="manager-head">
          <div>
            <span className="eyebrow">Portfolio admin</span>
            <h1>Overview</h1>
            <p>Here’s the current state of your portfolio content.</p>
          </div>
        </div>
        <div className="stats-grid">
          {cards.map(([label, value, Icon, path]) => (
            <a className="stat-card card" href={`/${prefix}/admin/${path}`} key={label}>
              <span className="stat-icon">
                <Icon size={17} />
              </span>
              <small>{label}</small>
              <b>{value}</b>
              <ArrowUpRight size={14} className="stat-arrow" />
            </a>
          ))}
        </div>
        <section className="admin-quick-actions" aria-labelledby="admin-quick-actions-title">
          <div>
            <span className="admin-section-kicker">SHORTCUTS</span>
            <h2 id="admin-quick-actions-title">Quick actions</h2>
            <p>Go straight to the content you want to update.</p>
          </div>
          <div className="admin-quick-links">
            {shortcuts.map(([label, path, Icon]) => (
              <Link
                className="admin-quick-link"
                href={`/${prefix}/admin/${path}`}
                key={path}
              >
                <Icon size={16} />
                <span>{label}</span>
                <ArrowUpRight size={14} />
              </Link>
            ))}
          </div>
        </section>
        <section className="recent-panel card">
          <div className="recent-head">
            <div>
              <h2>Recent enquiries</h2>
              <p>Latest visitor messages submitted through Z.</p>
            </div>
            <a href={`/${prefix}/admin/enquiries`}>
              Open inbox <ArrowUpRight size={14} />
            </a>
          </div>
          {recent.length ? (
            <div className="recent-list">
              {recent.map((row) => (
                <a className="recent-row" key={row.id} href={`/${prefix}/admin/enquiries`}>
                  <span className={`status status-${row.status}`}>{row.status}</span>
                  <div>
                    <b>{row.subject}</b>
                    <small>
                      {row.name} · {row.email}
                    </small>
                  </div>
                  <time>{new Date(row.created_at).toLocaleDateString()}</time>
                </a>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <h3>No enquiries yet</h3>
              <p>Messages from visitors will appear in this inbox.</p>
            </div>
          )}
        </section>
        <section className="recent-panel card">
          <div className="recent-head">
            <div>
              <h2>Recently added content</h2>
              <p>Latest saved portfolio records.</p>
            </div>
          </div>
          {content.length ? (
            <div className="recent-list">
              {content.map((row) => (
                <div className="recent-row" key={`${row.kind}-${row.id}`}>
                  <span className="status">{row.kind}</span>
                  <div>
                    <b>{row.title}</b>
                  </div>
                  <time>{new Date(row.created_at).toLocaleDateString()}</time>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <h3>No published content added yet</h3>
              <p>Your recent portfolio content will appear here.</p>
            </div>
          )}
        </section>
        <p className="dashboard-tip">Public pages read published content directly from Supabase.</p>
      </main>
    </div>
  );
}
