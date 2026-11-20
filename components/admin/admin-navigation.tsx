"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  FileBadge,
  FolderKanban,
  Gauge,
  LogOut,
  Menu,
  Newspaper,
  Settings2,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

const groups = [
  {
    label: "WORKSPACE",
    links: [{ label: "Overview", path: "edit", icon: Gauge }],
  },
  {
    label: "CONTENT",
    links: [
      { label: "Projects", path: "projects", icon: FolderKanban },
      { label: "Certificates", path: "certifications", icon: FileBadge },
      { label: "Achievements", path: "achievements", icon: Award },
      { label: "Updates", path: "updates", icon: Newspaper },
    ],
  },
  {
    label: "SKILLS & PROFILE",
    links: [
      { label: "Skill groups", path: "skill_groups", icon: BriefcaseBusiness },
      { label: "Skills", path: "skills", icon: Wrench },
      { label: "Profile", path: "profiles", icon: Settings2 },
    ],
  },
  {
    label: "INBOX",
    links: [{ label: "Enquiries", path: "enquiries", icon: UsersRound }],
  },
];

export function AdminNavigation({
  prefix,
  active,
}: {
  prefix: string;
  active: string;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace(`/${prefix}/admin/login`);
    }
  }

  return (
    <aside className={`admin-sidebar ${open ? "admin-sidebar-open" : ""}`}>
      <div className="admin-sidebar-head">
        <Link className="admin-brand" href="/" aria-label="Varun Sharma public website">
          <Image src="/favicon.png" alt="" width={36} height={36} priority />
          <span>Varun Sharma</span>
        </Link>
        <span className="admin-brand-caption">PORTFOLIO ADMIN</span>
        <div className="admin-mobile-actions">
          <button
            className="admin-menu-toggle"
            type="button"
            aria-label={open ? "Close admin navigation" : "Open admin navigation"}
            aria-expanded={open}
            aria-controls="admin-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
            <span>{open ? "Close" : "Menu"}</span>
          </button>
          <button
            className="admin-signout admin-signout-mobile"
            type="button"
            disabled={signingOut}
            onClick={() => void signOut()}
          >
            <LogOut size={15} /> <span>{signingOut ? "Signing out" : "Sign out"}</span>
          </button>
        </div>
      </div>
      <nav
        className="admin-navigation"
        id="admin-navigation"
        aria-label="Admin navigation"
      >
        {groups.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <span className="admin-nav-label">{group.label}</span>
            {group.links.map(({ label, path, icon: Icon }) => (
              <Link
                className={`admin-nav-link ${active === path ? "selected" : ""}`}
                href={
                  path === "edit"
                    ? `/${prefix}/admin/edit`
                    : `/${prefix}/admin/${path}`
                }
                key={path}
                aria-current={active === path ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
                {active === path && <ArrowRight className="admin-nav-current" size={13} />}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="admin-sidebar-foot">
        <Link href="/" target="_blank" rel="noreferrer" className="admin-public-link">
          View public site <span aria-hidden="true">↗</span>
        </Link>
        <button
          className="admin-signout"
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
        >
          <LogOut size={15} /> {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
