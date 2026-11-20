import { notFound } from "next/navigation";
import { ArrowUpRight, Github } from "lucide-react";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import type { Project } from "@/types/database";
import { SafeMarkdown } from "@/components/ui/safe-markdown";
import { safeWebUrl } from "@/lib/public-assets";
import { ImageLightbox } from "@/components/ui/image-lightbox";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("projects")
    .select("title,short_description")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data ? { title: data.title, description: data.short_description } : {};
}
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!data) notFound();
  const project = data as Project;
  return (
    <main className="privacy-page container">
      <Link href="/#projects" className="back-link">
        ← Back to projects
      </Link>
      <article className="project-detail">
        <span className="eyebrow">Project</span>
        <h1>{project.title}</h1>
        <p className="project-summary">{project.short_description}</p>
        {project.image_path && (
          <div className="project-detail-image">
            <ImageLightbox
              className="project-detail-lightbox"
              src={`/api/assets/projects/${project.id}`}
              alt={`${project.title} project screenshot`}
            />
          </div>
        )}
        <div className="tag-row">
          {project.technologies.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
        <SafeMarkdown content={project.description} />
        <div className="project-detail-links">
          {safeWebUrl(project.github_url) && (
            <a
              className="button"
              href={safeWebUrl(project.github_url)!}
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} /> Source code
            </a>
          )}
          {safeWebUrl(project.live_url) && (
            <a
              className="button button-primary"
              href={safeWebUrl(project.live_url)!}
              target="_blank"
              rel="noreferrer"
            >
              Open live project <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      </article>
    </main>
  );
}
