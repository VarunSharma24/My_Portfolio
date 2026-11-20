import { ArrowDown, ArrowUpRight, Github, Linkedin, LockKeyhole, Sparkles } from "lucide-react";
import Image from "next/image";
import { getPortfolioData } from "@/lib/portfolio";
import { SiteNav } from "@/components/layout/site-nav";
import { OpenZButton } from "@/components/assistant/open-z-button";
import { safeEmail, safeWebUrl } from "@/lib/public-assets";
import { SafeMarkdown } from "@/components/ui/safe-markdown";
import { Reveal } from "@/components/ui/reveal";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { InteractiveCard, RevealItem, ScrollProgress } from "@/components/ui/portfolio-motion";
import {
  CinematicName,
  HorizontalProjectShowcase,
  RoleTyper,
  SectionLine,
  TerminalReveal,
} from "@/components/ui/cinematic-motion";

export const revalidate = 60;

export default async function HomePage() {
  const { profile, projects, groups, certificates, achievements, updates } =
    await getPortfolioData();
  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main>
        <section className="hero" id="home">
          <div className="hero-grid grid-bg" />
          <div className="container hero-inner">
            <div className="hero-copy">
              <span className="eyebrow">ETHICAL HACKER · BUILDER · ALWAYS LEARNING</span>
              <CinematicName />
              <RoleTyper />
              <p className="hero-intro">
                I explore cybersecurity, build software, and experiment with AI to create useful
                technology. Always learning, testing, and building.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#projects">
                  Explore Projects <ArrowUpRight size={16} />
                </a>
                <a className="button" href="#contact">
                  Let&apos;s Connect
                </a>
              </div>
              <div className="hero-social">
                {safeWebUrl(profile.github_url) && (
                  <a href={safeWebUrl(profile.github_url)!} target="_blank" rel="noreferrer">
                    <Github size={17} /> GitHub
                  </a>
                )}
                {safeWebUrl(profile.linkedin_url) && (
                  <a href={safeWebUrl(profile.linkedin_url)!} target="_blank" rel="noreferrer">
                    <Linkedin size={17} /> LinkedIn
                  </a>
                )}
                {Object.entries(profile.social_links || {})
                  .filter(([, url]) => !!safeWebUrl(url))
                  .map(([label, url]) => (
                    <a key={label} href={safeWebUrl(url)!} target="_blank" rel="noreferrer">
                      {label}
                    </a>
                  ))}
                <span className="hero-note">
                  <span /> Open to learning & building
                </span>
              </div>
            </div>
            <div className="hero-art" aria-label="Cybersecurity and technology code illustration">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="art-glow" />
              <span className="art-particle particle-one" aria-hidden="true" />
              <span className="art-particle particle-two" aria-hidden="true" />
              <span className="art-particle particle-three" aria-hidden="true" />
              <span className="art-particle particle-four" aria-hidden="true" />
              <TerminalReveal>
                <header className="window-top">
                  <div className="window-dots">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>varun.ts</span>
                  <span className="window-lock">
                    <LockKeyhole size={13} />
                  </span>
                </header>
                <div className="code-lines mono">
                  <p>
                    <span className="code-purple">const</span>{" "}
                    <span className="code-cyan">builder</span> = {"{"}
                  </p>
                  <p className="indent">
                    <span className="code-lilac">focus</span>: [
                  </p>
                  <p className="indent2">&quot;cybersecurity&quot;,</p>
                  <p className="indent2">&quot;development&quot;,</p>
                  <p className="indent2">&quot;AI &amp; technology&quot;</p>
                  <p className="indent">],</p>
                  <p className="indent">
                    <span className="code-lilac">approach</span>:{" "}
                    <span className="code-green">&quot;learn by building&quot;</span>
                  </p>
                  <p>{"}"};</p>
                  <p className="code-cursor">▍</p>
                </div>
                <footer className="window-foot">
                  <span>
                    <i /> Curious by default
                  </span>
                  <Sparkles size={15} />
                </footer>
              </TerminalReveal>
            </div>
          </div>
          <a className="scroll-cue" href="#about">
            <ArrowDown size={14} /> Scroll to explore
          </a>
        </section>

        <section className="section" id="about">
          <Reveal className="container about-grid">
            <div className="about-heading">
              <span className="eyebrow">A little about me</span>
              <h2 className="section-title about-display">
                CURIOSITY IS A <em>PROCESS.</em>
              </h2>
              <p>Cybersecurity first. Building to understand.</p>
            </div>
            <div className="about-copy">
              <RevealItem className="about-statement" delay={0.04}>
                <p>
                  Hey, I&apos;m Varun — a young ethical hacking enthusiast, developer, and technology
                  explorer fascinated by what happens beneath the surface.
                </p>
              </RevealItem>
              <RevealItem className="about-statement" delay={0.1} direction="right">
                <p>
                  Cybersecurity is my biggest interest. I explore web security, learn how
                  applications communicate, and study responsible ways to understand vulnerabilities
                  and improve security.
                </p>
              </RevealItem>
              <RevealItem className="about-statement" delay={0.1}>
                <p>
                  I also build software and experiment with AI, turning curiosity into practical
                  projects and learning through every iteration.
                </p>
              </RevealItem>
              <div className="principles">
                <RevealItem as="article" className="principle-item" delay={0.02}>
                  <span>01</span>
                  <b>Build to understand</b>
                  <small>Learning sticks when ideas become working software.</small>
                </RevealItem>
                <RevealItem as="article" className="principle-item" delay={0.1}>
                  <span>02</span>
                  <b>Stay curious</b>
                  <small>Explore widely, then focus on what matters.</small>
                </RevealItem>
                <RevealItem as="article" className="principle-item" delay={0.18}>
                  <span>03</span>
                  <b>Think responsibly</b>
                  <small>Make security and thoughtful design part of the process.</small>
                </RevealItem>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="section section-alt" id="projects">
          <Reveal className="container">
            <span className="eyebrow">Selected work</span>
            <div className="section-head">
              <div>
                <h2 className="section-title">Projects that teach me something.</h2>
                <p className="section-lead">
                  A growing collection of things I’ve designed, built, and learned from.
                </p>
              </div>
              <span className="count-note mono">
                {String(projects.length).padStart(2, "0")} / PROJECTS
              </span>
            </div>
            {projects.length ? (
              <HorizontalProjectShowcase count={projects.length}>
                {projects.map((project, index) => {
                  const image = project.image_path ? `/api/assets/projects/${project.id}` : null;
                  return (
                    <div className="project-frame" key={project.id}>
                      <InteractiveCard
                        className={`project-card card ${project.featured ? "project-featured" : ""} project-showcase-card`}
                      >
                        <div className={`project-visual ${image ? "project-has-image" : ""}`}>
                          {image && (
                            <ImageLightbox
                              className="project-image-lightbox"
                              src={image}
                              alt={`${project.title} project screenshot`}
                            />
                          )}
                          <span className="project-index mono">0{index + 1}</span>
                          {!image && (
                            <div className="project-symbol">
                              {project.title.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="project-topline">
                            <span>{project.featured ? "FEATURED" : "PROJECT"}</span>
                            <a
                              href={`/projects/${project.slug}`}
                              aria-label={`Read about ${project.title}`}
                            >
                              <ArrowUpRight size={16} />
                            </a>
                          </div>
                        </div>
                        <div className="project-content">
                          <h3>
                            <a href={`/projects/${project.slug}`}>{project.title}</a>
                          </h3>
                          <p>{project.short_description}</p>
                          <div className="tag-row">
                            {project.technologies.slice(0, 4).map((tech) => (
                              <span className="tag" key={tech}>
                                {tech}
                              </span>
                            ))}
                          </div>
                          <div className="project-links">
                            <a href={`/projects/${project.slug}`}>
                              Details <ArrowUpRight size={14} />
                            </a>
                            {safeWebUrl(project.github_url) && (
                              <a
                                href={safeWebUrl(project.github_url)!}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Github size={15} /> Source
                              </a>
                            )}
                            {safeWebUrl(project.live_url) && (
                              <a
                                href={safeWebUrl(project.live_url)!}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Live demo <ArrowUpRight size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </InteractiveCard>
                    </div>
                  );
                })}
              </HorizontalProjectShowcase>
            ) : (
              <div className="empty-state card">
                <div className="empty-mark">✳</div>
                <h3>Work in progress</h3>
                <p>Projects will appear here as they’re published.</p>
              </div>
            )}
          </Reveal>
        </section>

        <section className="section" id="skills">
          <Reveal className="container">
            <span className="eyebrow">Tools of the trade</span>
            <h2 className="section-title">Skills & interests.</h2>
            <p className="section-lead">
              A living toolkit, shaped by projects and ongoing curiosity. No scores — just areas I
              work with and explore.
            </p>
            <div className="skills-grid">
              {groups.length ? (
                groups.map((group, index) => (
                  <RevealItem
                    as="article"
                    className="skill-card card"
                    key={group.id}
                    delay={Math.min(index * 0.08, 0.32)}
                    direction={index % 2 ? "right" : "left"}
                  >
                    <h3>
                      <span className="mono">0{index + 1}</span>
                      {group.name}
                    </h3>
                    <div className="skill-list">
                      {group.skills?.map((skill, skillIndex) => (
                        <span
                          key={skill.id}
                          style={{ "--skill-index": skillIndex } as React.CSSProperties}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </RevealItem>
                ))
              ) : (
                <article className="skill-card card skill-empty">
                  <h3>Growing toolkit</h3>
                  <p>Skills will be added here as they are curated.</p>
                </article>
              )}
            </div>
          </Reveal>
        </section>

        <section className="section section-alt" id="certificates">
          <Reveal className="container">
            <span className="eyebrow">Learning & credentials</span>
            <h2 className="section-title">Certificates.</h2>
            <p className="section-lead">
              Credentials and completed learning, added as they’re earned and verified.
            </p>
            <div className="credential-grid">
              {certificates.length ? (
                certificates.map((c, index) => (
                  <RevealItem
                    as="article"
                    className="credential card"
                    key={c.id}
                    delay={Math.min(index * 0.05, 0.3)}
                    direction={index % 2 ? "right" : "left"}
                  >
                    {c.file_path ? (
                      <ImageLightbox
                        className="credential-preview"
                        src={`/api/certificates/${c.id}`}
                        alt={`${c.title} certificate`}
                        fit="contain"
                        mediaType={c.file_path.toLowerCase().endsWith(".pdf") ? "pdf" : "image"}
                      />
                    ) : (
                      <div className="credential-icon">
                        <Sparkles size={19} />
                      </div>
                    )}
                    <div>
                      <h3>{c.title}</h3>
                      <p>
                        {c.issuer}
                        {c.issue_date ? ` · ${new Date(c.issue_date).getFullYear()}` : ""}
                      </p>
                      {c.description && <p className="credential-desc">{c.description}</p>}
                      {c.verification_url && (
                        <a href={c.verification_url} target="_blank" rel="noreferrer">
                          Verify credential <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                  </RevealItem>
                ))
              ) : (
                <div className="empty-state card">
                  <h3>Nothing published yet</h3>
                  <p>Verified certificates will be shared here when ready.</p>
                </div>
              )}
            </div>
          </Reveal>
        </section>

        <section className="section" id="achievements">
          <Reveal className="container">
            <span className="eyebrow">Milestones</span>
            <h2 className="section-title">Achievements.</h2>
            <p className="section-lead">
              A record of meaningful milestones and work worth sharing.
            </p>
            <div className="achievement-timeline">
              <SectionLine className="achievement-line" />
              <div className="achievement-list">
                {achievements.length ? (
                  achievements.map((a, index) => {
                    const image = a.image_path ? `/api/assets/achievements/${a.id}` : null;
                    return (
                      <RevealItem
                        as="article"
                        className="achievement card"
                        key={a.id}
                        delay={Math.min(index * 0.04, 0.24)}
                        direction={index % 2 ? "right" : "left"}
                      >
                        {image ? (
                          <ImageLightbox
                            className="achievement-image"
                            src={image}
                            alt={`Supporting image for ${a.title}`}
                            fit="contain"
                          />
                        ) : (
                          <span className="achievement-dot" />
                        )}
                        <div>
                          <h3>{a.title}</h3>
                          <p>{a.description}</p>
                          {safeWebUrl(a.external_url) && (
                            <a
                              className="achievement-link"
                              href={safeWebUrl(a.external_url)!}
                              target="_blank"
                              rel="noreferrer"
                            >
                              More details <ArrowUpRight size={12} />
                            </a>
                          )}
                        </div>
                        <span className="achievement-date mono">{a.achievement_date || ""}</span>
                      </RevealItem>
                    );
                  })
                ) : (
                  <div className="empty-state card">
                    <h3>Milestones ahead</h3>
                    <p>Achievements will appear here when there’s something to share.</p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="section section-alt" id="updates">
          <Reveal className="container">
            <span className="eyebrow">Notes from the process</span>
            <h2 className="section-title">Recent updates.</h2>
            <div className="updates-list">
              <SectionLine className="updates-line" />
              {updates.length ? (
                updates.map((u, index) => (
                  <RevealItem
                    as="article"
                    className="update-row"
                    key={u.id}
                    delay={Math.min(index * 0.07, 0.28)}
                    direction={index % 2 ? "right" : "left"}
                  >
                    <time className="mono">
                      {u.published_at
                        ? new Date(u.published_at).toLocaleDateString("en", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </time>
                    <div>
                      <h3>{u.title}</h3>
                      <SafeMarkdown content={u.content} />
                    </div>
                  </RevealItem>
                ))
              ) : (
                <div className="empty-state card">
                  <h3>More soon</h3>
                  <p>Published notes and updates will show up here.</p>
                </div>
              )}
            </div>
          </Reveal>
        </section>

        <section className="section contact-section" id="contact">
          <Reveal className="container contact-card card">
            <div className="contact-orb" />
            <div className="contact-main">
              <div className="contact-copy">
                <span className="eyebrow">Start a conversation</span>
                <h2 className="section-title">Have something in mind?</h2>
                <p className="section-lead">
                  Ask Z about my work, or share a project idea. Z can prepare an enquiry for me to
                  review.
                </p>
              </div>
              <div className="contact-actions">
                <div className="contact-console mono">
                  <span>
                    <i /> CHANNEL STATUS: READY
                  </span>
                </div>
                <OpenZButton />
                {safeEmail(profile.public_email) && (
                  <a className="button" href={`mailto:${safeEmail(profile.public_email)}`}>
                    Email me <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </div>
            <p className="privacy-inline">
              Enquiries submitted through Z are stored securely in Supabase for review.{" "}
              <a href="/privacy">Privacy details</a>.
            </p>
          </Reveal>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <a className="brand" href="#home">
            <Image src="/favicon.png" alt="Varun Sharma logo" width={30} height={30} />
          </a>
          <p>Built with curiosity and care.</p>
          <div>
            <a href="#about">About</a>
            <a href="#projects">Projects</a>
            <a href="/privacy">Privacy</a>
            {safeWebUrl(profile.github_url) && (
              <a href={safeWebUrl(profile.github_url)!} target="_blank" rel="noreferrer">
                <Github size={16} />
                <span className="sr-only">GitHub</span>
              </a>
            )}
          </div>
          <small>© {new Date().getFullYear()} Varun Sharma</small>
        </div>
      </footer>
    </>
  );
}
