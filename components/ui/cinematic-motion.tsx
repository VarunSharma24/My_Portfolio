"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const roles = [
  "Ethical Hacker",
  "Developer",
  "AI Explorer",
  "Security Researcher",
  "Technology Enthusiast",
];

export function CinematicName() {
  const reduced = useReducedMotion();
  const name = "VARUN SHARMA";
  return (
    <h1 className="cinematic-name" aria-label={name}>
      {name.split("").map((letter, index) => (
        <span className="name-mask" key={`${letter}-${index}`} aria-hidden="true">
          <motion.span
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: reduced ? 0 : 0.72,
              delay: reduced ? 0 : 0.12 + index * 0.045,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {letter === " " ? "\u00a0" : letter}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export function RoleTyper() {
  const reduced = useReducedMotion();
  const [roleIndex, setRoleIndex] = useState(0);
  const [visibleCharacters, setVisibleCharacters] = useState(roles[0].length);
  const [deleting, setDeleting] = useState(false);
  const cycleStarted = useRef(false);

  useEffect(() => {
    if (reduced) return;
    if (!cycleStarted.current) {
      cycleStarted.current = true;
      setVisibleCharacters(0);
      return;
    }

    const currentRole = roles[roleIndex];
    const delay =
      !deleting && visibleCharacters === currentRole.length
        ? 1250
        : deleting && visibleCharacters === 0
          ? 160
          : deleting
            ? 36
            : 78;
    const timeout = window.setTimeout(() => {
      if (!deleting && visibleCharacters === currentRole.length) {
        setDeleting(true);
      } else if (deleting && visibleCharacters === 0) {
        setRoleIndex((index) => (index + 1) % roles.length);
        setDeleting(false);
      } else {
        setVisibleCharacters((count) => count + (deleting ? -1 : 1));
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [deleting, reduced, roleIndex, visibleCharacters]);

  const currentRole = roles[roleIndex];
  const visibleRole = reduced ? roles[0] : currentRole.slice(0, visibleCharacters);

  return (
    <p className="hero-role mono" aria-label={`Role: ${reduced ? roles[0] : currentRole}`}>
      <span className="role-prefix">ROLE /</span>
      <span aria-hidden="true" className="role-value">
        <span className="role-label">{visibleRole}</span>
        <span className="role-cursor" />
      </span>
      <span className="sr-only">{reduced ? roles[0] : currentRole}</span>
    </p>
  );
}

export function TerminalReveal({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="code-window card"
      initial={reduced ? false : { opacity: 0, y: 18, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      transition={{
        duration: reduced ? 0 : 0.8,
        delay: reduced ? 0 : 0.85,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function HorizontalProjectShowcase({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `${-((count - 1) / count) * 100}%`]);

  const staticLayout = reduced || count < 2;
  return (
    <div
      className={`project-showcase ${staticLayout ? "project-showcase-static" : ""}`}
      ref={ref}
      style={{ "--project-count": count } as React.CSSProperties}
    >
      <div className="project-stage">
        <motion.div className="project-track" style={staticLayout ? undefined : { x }}>
          {children}
        </motion.div>
        {!staticLayout && <span className="showcase-progress mono">SCROLL TO EXPLORE</span>}
      </div>
    </div>
  );
}

export function SectionLine({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 40%"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div className={`section-line ${className}`} ref={ref} aria-hidden="true">
      <motion.i style={{ scaleY }} />
    </div>
  );
}
