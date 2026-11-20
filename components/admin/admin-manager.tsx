"use client";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  FileText,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AdminNavigation } from "@/components/admin/admin-navigation";

type Field = {
  key: string;
  label: string;
  type?: "text" | "email" | "textarea" | "boolean" | "date" | "number" | "tags" | "file" | "url";
  required?: boolean;
  hint?: string;
  bucket?: string;
  accept?: string;
};
type Row = Record<string, unknown> & { id: string };
type PendingUpload = { bucket: string; path: string };
const specs: Record<string, { title: string; description: string; fields: Field[] }> = {
  projects: {
    title: "Projects",
    description: "Manage portfolio projects and publication settings.",
    fields: [
      { key: "title", label: "Project title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "short_description", label: "Short description", type: "textarea" },
      { key: "description", label: "Full description", type: "textarea" },
      { key: "technologies", label: "Technologies (comma separated)", type: "tags" },
      { key: "github_url", label: "GitHub URL", type: "url" },
      { key: "live_url", label: "Live demo URL", type: "url" },
      {
        key: "image_path",
        label: "Project image",
        type: "file",
        bucket: "project-images",
        accept: "image/png,image/jpeg,image/webp",
      },
      { key: "featured", label: "Featured", type: "boolean" },
      { key: "published", label: "Published", type: "boolean" },
      { key: "display_order", label: "Display order", type: "number" },
    ],
  },
  certifications: {
    title: "Certificates",
    description: "Add credentials after manually selecting their image or PDF.",
    fields: [
      { key: "title", label: "Certificate name", required: true },
      { key: "issuer", label: "Issuing organization", required: true },
      { key: "issue_date", label: "Issue date", type: "date" },
      { key: "description", label: "Description", type: "textarea" },
      {
        key: "file_path",
        label: "Image or PDF",
        type: "file",
        bucket: "certificate-files",
        accept: "image/png,image/jpeg,image/webp,application/pdf",
      },
      { key: "verification_url", label: "Verification URL", type: "url" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  achievements: {
    title: "Achievements",
    description: "Publish verified milestones and supporting links.",
    fields: [
      { key: "title", label: "Achievement title", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "achievement_date", label: "Date", type: "date" },
      {
        key: "image_path",
        label: "Supporting image",
        type: "file",
        bucket: "achievement-images",
        accept: "image/png,image/jpeg,image/webp",
      },
      { key: "external_url", label: "External link", type: "url" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  updates: {
    title: "Updates",
    description: "Write project notes, learning updates, and announcements.",
    fields: [
      { key: "title", label: "Post title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "content", label: "Content (plain text or Markdown)", type: "textarea" },
      { key: "published_at", label: "Publication date", type: "date" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  skill_groups: {
    title: "Skill groups",
    description: "Create categories such as Programming, AI, or Security.",
    fields: [
      { key: "name", label: "Category name", required: true },
      { key: "display_order", label: "Display order", type: "number" },
    ],
  },
  skills: {
    title: "Skills",
    description: "Add skills to an existing group.",
    fields: [
      {
        key: "group_id",
        label: "Skill group",
        required: true,
        hint: "Choose the group this skill belongs to.",
      },
      { key: "name", label: "Skill name", required: true },
      { key: "display_order", label: "Display order", type: "number" },
    ],
  },
  profiles: {
    title: "Profile",
    description:
      "Edit the public portfolio introduction and social links. Only add contact details you intend to publish.",
    fields: [
      { key: "display_name", label: "Display name", required: true },
      { key: "headline", label: "Headline", required: true },
      { key: "introduction", label: "Introduction", type: "textarea" },
      { key: "about", label: "About section", type: "textarea" },
      { key: "public_email", label: "Public email", type: "email" },
      { key: "github_url", label: "GitHub URL", type: "url" },
      { key: "linkedin_url", label: "LinkedIn URL", type: "url" },
      { key: "social_links", label: "Other social links (JSON object)", type: "textarea" },
    ],
  },
  enquiries: {
    title: "Enquiries inbox",
    description: "Private messages submitted by visitors through Z.",
    fields: [{ key: "status", label: "Status" }],
  },
};

export function AdminManager({ section }: { section: string }) {
  const config = specs[section] ?? { title: "Unknown section", description: "", fields: [] };
  const isKnown = !!specs[section];
  const [rows, setRows] = useState<Row[]>([]),
    [form, setForm] = useState<Record<string, unknown>>({}),
    [editing, setEditing] = useState<Row | null>(null),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [skillGroups, setSkillGroups] = useState<Row[]>([]),
    [deleteTarget, setDeleteTarget] = useState<Row | null>(null),
    [deleting, setDeleting] = useState(false),
    [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const uploadBusy = useRef(false);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const enquiry = section === "enquiries";
  const fetchRows = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    const r = await fetch(`/api/admin/data/${section}?${params}`, { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    return (d.data || []) as Row[];
  }, [filter, section]);
  const refreshRows = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchRows());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load content.");
    } finally {
      setLoading(false);
    }
  }, [fetchRows, setError, setLoading]);
  useEffect(() => {
    let cancelled = false;
    fetchRows()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setError("");
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load content.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchRows]);
  useEffect(() => {
    if (section !== "skills") return;
    const controller = new AbortController();
    fetch("/api/admin/data/skill_groups", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load skill groups.");
        setSkillGroups((result.data || []) as Row[]);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Could not load skill groups.");
      });
    return () => controller.abort();
  }, [section]);
  useEffect(() => {
    const dialog = deleteDialog.current;
    if (deleteTarget && dialog && !dialog.open) dialog.showModal();
    if (!deleteTarget && dialog?.open) dialog.close();
  }, [deleteTarget]);
  const filtered = useMemo(
    () =>
      rows.filter((r) => !query || JSON.stringify(r).toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );
  async function clearPendingUploads(uploads = pendingUploads) {
    const results = await Promise.all(
      uploads.map(async ({ bucket, path }) => {
        try {
          const response = await fetch("/api/admin/storage", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ bucket, path }),
          });
          return response.ok;
        } catch {
          return false;
        }
      }),
    );
    setPendingUploads((current) => current.filter((item) => !uploads.includes(item)));
    const failed = results.some((ok) => !ok);
    if (failed)
      setError(
        "An unused uploaded file could not be removed from private storage. Check Supabase Storage.",
      );
    return failed;
  }
  function start(row?: Row) {
    if (uploadBusy.current || uploading) {
      setError("Wait for the current file upload to finish.");
      return;
    }
    if (pendingUploads.length) void clearPendingUploads();
    setEditing(row || null);
    const next: Record<string, unknown> = {};
    for (const f of config.fields) {
      const value = row?.[f.key];
      next[f.key] =
        f.key === "social_links" && value
          ? JSON.stringify(value, null, 2)
          : (value ??
            (f.type === "boolean"
              ? false
              : f.type === "number"
                ? 0
                : f.type === "tags"
                  ? []
                  : f.key === "social_links"
                    ? "{}"
                    : ""));
    }
    setForm(next);
    setError("");
    setNotice("");
  }
  async function upload(field: Field, file?: File) {
    if (!file || !field.bucket) return;
    const allowedTypes =
      field.bucket === "certificate-files"
        ? ["image/png", "image/jpeg", "image/webp", "application/pdf"]
        : ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        field.bucket === "certificate-files"
          ? "Certificate files must be PNG, JPEG, WebP, or PDF."
          : "This image must be PNG, JPEG, or WebP.",
      );
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("This file exceeds the 8 MB upload limit.");
      return;
    }
    if (uploadBusy.current) {
      setError("Wait for the current file upload to finish.");
      return;
    }
    uploadBusy.current = true;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("bucket", field.bucket);
      body.set("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const replacedPending = pendingUploads.filter(
        (pending) => pending.bucket === field.bucket && pending.path === form[field.key],
      );
      if (replacedPending.length) await clearPendingUploads(replacedPending);
      setForm((v) => ({ ...v, [field.key]: d.path }));
      setPendingUploads((uploads) => [...uploads, { bucket: field.bucket!, path: d.path }]);
      setNotice("File uploaded.");
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "Network request failed while uploading. Check your connection and retry."
          : e instanceof Error
            ? e.message
            : "Upload failed. Check the storage configuration and retry.",
      );
    } finally {
      uploadBusy.current = false;
      setUploading(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const data = { ...form };
    for (const f of config.fields) {
      if (f.type === "tags")
        data[f.key] = String(data[f.key] || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      if (f.type === "number") data[f.key] = Number(data[f.key] || 0);
      if (f.type === "url") data[f.key] = data[f.key] || null;
      if (f.type === "date") data[f.key] = data[f.key] || null;
      if (f.key === "public_email" || f.key === "image_path" || f.key === "file_path")
        data[f.key] = data[f.key] || null;
      if (f.key === "social_links") {
        try {
          data[f.key] = JSON.parse(String(data[f.key] || "{}"));
        } catch {
          setError("Social links must be valid JSON.");
          setSaving(false);
          return;
        }
      }
    }
    try {
      const r = await fetch(`/api/admin/data/${section}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, data } : { ...data }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPendingUploads([]);
      setNotice(
        d.cleanupWarning
          ? "Changes saved. The previous file could not be removed from private storage."
          : "Changes saved.",
      );
      setEditing(null);
      setForm({});
      await refreshRows();
    } catch (e) {
      const cleanupFailed = await clearPendingUploads();
      const message = e instanceof Error ? e.message : "Could not save changes.";
      setError(
        cleanupFailed
          ? `${message} An unused uploaded file could not be removed; check its private storage bucket.`
          : message,
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove(row: Row) {
    setError("");
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/data/${section}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setNotice(
        d.cleanupWarning
          ? "Record deleted, but its old file could not be removed from private storage."
          : "Record deleted.",
      );
      setDeleteTarget(null);
      await refreshRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setDeleting(false);
    }
  }
  async function status(row: Row, value: string) {
    try {
      const r = await fetch(`/api/admin/data/${section}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: row.id, data: { status: value } }),
      });
      if (!r.ok) throw new Error();
      await refreshRows();
    } catch {
      setError("Could not update status.");
    }
  }
  function filePreviewHref(row: Row) {
    const bucket =
      section === "projects"
        ? "project-images"
        : section === "certifications"
          ? "certificate-files"
          : section === "achievements"
            ? "achievement-images"
            : null;
    const path = section === "certifications" ? row.file_path : row.image_path;
    return bucket && typeof path === "string" && path
      ? `/api/admin/storage?bucket=${bucket}&path=${encodeURIComponent(path)}`
      : null;
  }
  if (!isKnown)
    return (
      <main className="admin-main">
        <h1>Section not found</h1>
      </main>
    );
  return (
    <div className="admin-shell">
      <AdminNavigation
        prefix={process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX || ""}
        active={section}
      />
      <main className="admin-main">
        <div className="admin-top">
          <div className="admin-breadcrumb">
            <span>Workspace</span><i>/</i><b>{config.title}</b>
          </div>
          <span className="admin-private-note"><span /> Private workspace</span>
        </div>
        <div className="manager-head">
          <div>
            <span className="eyebrow">Portfolio admin</span>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
          {!enquiry && (
            <button className="button button-primary" onClick={() => start()}>
              <Plus size={15} /> Add {config.title.replace(/s$/i, "")}
            </button>
          )}
        </div>
        {notice && (
          <div className="admin-notice" role="status">
            {notice}
          </div>
        )}
        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}
        <div className="manager-tools">
          <label className="admin-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={query}
              aria-label={`Search ${config.title.toLowerCase()}`}
              placeholder={enquiry ? "Search name, email, subject…" : `Search ${config.title.toLowerCase()}…`}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {enquiry && (
            <select
              aria-label="Filter enquiries by status"
              value={filter}
              onChange={(e) => {
                setLoading(true);
                setError("");
                setFilter(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              {["unread", "read", "replied", "archived"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
        {editing !== null || (!enquiry && Object.keys(form).length > 0) ? (
          <form className="record-form card" onSubmit={save}>
            <div className="record-form-head">
              <h2>{editing ? "Edit record" : `New ${config.title.replace(/s$/i, "")}`}</h2>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  void clearPendingUploads();
                  setEditing(null);
                  setForm({});
                }}
              >
                Close
              </button>
            </div>
            <div className="record-fields">
              {config.fields.map((f) => (
                <label
                  key={f.key}
                  className={f.type === "textarea" || f.type === "file" ? "wide" : ""}
                >
                  {f.label}
                  {f.key === "group_id" && section === "skills" ? (
                    <select
                      required={f.required}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setForm((v) => ({ ...v, [f.key]: e.target.value }))}
                    >
                      <option value="">Select a skill group</option>
                      {skillGroups.map((group) => (
                        <option value={group.id} key={group.id}>
                          {String(group.name || group.id)}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(form[f.key])}
                      onChange={(e) => setForm((v) => ({ ...v, [f.key]: e.target.checked }))}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      required={f.required}
                      rows={5}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setForm((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  ) : f.type === "file" ? (
                    <span
                      className="file-input"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        void upload(f, event.dataTransfer.files[0]);
                      }}
                    >
                      <input
                        type="file"
                        accept={f.accept}
                        onChange={(e) => void upload(f, e.target.files?.[0])}
                      />
                      <small>{String(form[f.key] || "No file selected")}</small>
                      <Upload size={14} />
                      <small className="file-help">Choose or drop a file · Max 8 MB</small>
                      {typeof form[f.key] === "string" &&
                        Boolean(form[f.key]) &&
                        Boolean(f.bucket) && (
                          <span className="file-preview">
                            {!String(form[f.key]).toLowerCase().endsWith(".pdf") && (
                              <span
                                className="file-preview-image"
                              >
                                <Image
                                  src={`/api/admin/storage?bucket=${f.bucket}&path=${encodeURIComponent(String(form[f.key]))}`}
                                  alt={`${f.label} preview`}
                                  fill
                                  unoptimized
                                  sizes="84px"
                                />
                              </span>
                            )}
                            {String(form[f.key]).toLowerCase().endsWith(".pdf") && (
                              <FileText size={20} aria-hidden="true" />
                            )}
                            <a
                              href={`/api/admin/storage?bucket=${f.bucket}&path=${encodeURIComponent(String(form[f.key]))}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {String(form[f.key]).toLowerCase().endsWith(".pdf")
                                ? "Open PDF preview"
                                : "Open image preview"}
                            </a>
                          </span>
                        )}
                    </span>
                  ) : (
                    <input
                      required={f.required}
                      type={
                        f.type === "number"
                          ? "number"
                          : f.type === "date"
                            ? "date"
                            : f.type === "email"
                              ? "email"
                              : f.type === "url"
                                ? "url"
                                : "text"
                      }
                      value={
                        f.type === "tags"
                          ? Array.isArray(form[f.key])
                            ? (form[f.key] as string[]).join(", ")
                            : String(form[f.key] || "")
                          : String(form[f.key] ?? "")
                      }
                      onChange={(e) => setForm((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                  {f.hint && <small className="field-hint">{f.hint}</small>}
                </label>
              ))}
            </div>
            <div className="form-actions">
              <button className="button button-primary" disabled={saving || uploading}>
                {saving || uploading ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Save size={15} />
                )}{" "}
                {uploading ? "Uploading file…" : saving ? "Saving…" : "Save"}
                changes
              </button>
              <button
                type="button"
                className="button"
                onClick={() => {
                  void clearPendingUploads();
                  setEditing(null);
                  setForm({});
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
        {loading ? (
          <div className="admin-loading">
            <LoaderCircle className="spin" /> Loading…
          </div>
        ) : (
          <div className="records">
            {filtered.length === 0 ? (
              <div className="admin-empty card">
                <h3>{enquiry ? "No enquiries found" : "No records yet"}</h3>
                <p>
                  {enquiry
                    ? "Visitor enquiries will appear here."
                    : "Add content when you’re ready to publish it."}
                </p>
              </div>
            ) : (
              filtered.map((row) => (
                <article
                  className={`record card ${enquiry ? `record-enquiry record-enquiry-${String(row.status)}` : ""}`}
                  key={row.id}
                >
                  <div className="record-info">
                    {section === "enquiries" ? (
                      <>
                        <div className="record-line">
                          <b>{String(row.subject)}</b>
                          <span className={`status status-${row.status}`}>
                            {String(row.status)}
                          </span>
                        </div>
                        <p>
                          {String(row.name)} ·{" "}
                          <a href={`mailto:${encodeURIComponent(String(row.email))}`}>
                            {String(row.email)}
                          </a>
                        </p>
                        <p className="record-message">{String(row.message)}</p>
                        <small>{new Date(String(row.created_at)).toLocaleString()}</small>
                      </>
                    ) : (
                      <>
                        <div className="record-line">
                          <b>{String(row.title || row.name || row.display_name || row.id)}</b>
                          <span className={`status ${row.published ? "status-published" : ""}`}>
                            {row.published ? "published" : "draft"}
                          </span>
                        </div>
                        <p>
                          {String(
                            row.short_description ||
                              row.description ||
                              row.headline ||
                              row.slug ||
                              "",
                          )}
                        </p>
                        <small>{row.id}</small>
                      </>
                    )}
                  </div>
                  <div className="record-actions">
                    {enquiry && (
                      <>
                        <select
                          aria-label="Enquiry status"
                          value={String(row.status)}
                          onChange={(e) => void status(row, e.target.value)}
                        >
                          {["unread", "read", "replied", "archived"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <a
                          className="button"
                          href={`mailto:${encodeURIComponent(String(row.email))}?subject=${encodeURIComponent(`Re: ${String(row.subject)}`)}`}
                        >
                          Reply via email ↗
                        </a>
                      </>
                    )}
                    {filePreviewHref(row) && (
                      <a
                        className="button"
                        target="_blank"
                        rel="noreferrer"
                        href={filePreviewHref(row)!}
                      >
                        Preview ↗
                      </a>
                    )}
                    <button className="button" onClick={() => start(row)}>
                      Edit
                    </button>
                    <button
                      className="danger-button"
                      aria-label={`Delete ${String(row.title || row.subject || row.name || "record")}`}
                      onClick={() => {
                        setError("");
                        setDeleteTarget(row);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
        <dialog
          ref={deleteDialog}
          className="admin-confirm-dialog"
          aria-labelledby="delete-confirm-title"
          onCancel={(event) => {
            event.preventDefault();
            if (!deleting) setDeleteTarget(null);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          {deleteTarget && (
            <>
              <button
                className="admin-dialog-close"
                type="button"
                aria-label="Close delete confirmation"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                <X size={17} />
              </button>
              <span className="admin-dialog-icon"><AlertTriangle size={19} /></span>
              <span className="admin-section-kicker">CONFIRM DELETE</span>
              <h2 id="delete-confirm-title">Delete this record?</h2>
              <p>
                <b>{String(deleteTarget.title || deleteTarget.subject || deleteTarget.name || "Selected record")}</b>
                <br />This action cannot be undone.
              </p>
              {error && <p className="admin-error" role="alert">{error}</p>}
              <div className="admin-dialog-actions">
                <button
                  className="button"
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="button admin-danger-action"
                  type="button"
                  disabled={deleting}
                  onClick={() => void remove(deleteTarget)}
                >
                  {deleting ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}
                  {deleting ? "Deleting…" : "Delete record"}
                </button>
              </div>
            </>
          )}
        </dialog>
      </main>
    </div>
  );
}
