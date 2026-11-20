"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const roles = ["Ethical Hacker", "Developer", "AI Builder", "Technology Enthusiast"];

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
  const [visible, setVisible] = useState("");

  useEffect(() => {
    if (reduced) return;
    let role = 0;
    let length = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const current = roles[role];
      if (!deleting) {
        length += 1;
        setVisible(current.slice(0, length));
        if (length >= current.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1350);
          return;
        }
      } else {
        length -= 1;
        setVisible(current.slice(0, length));
        if (length <= 0) {
          deleting = false;
          role = (role + 1) % roles.length;
          setRoleIndex(role);
          timer = window.setTimeout(tick, 250);
          return;
        }
      }
      timer = window.setTimeout(tick, deleting ? 34 : 72);
    };
    timer = window.setTimeout(tick, 720);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  return (
    <p className="hero-role mono" aria-label={`Role: ${roles[roleIndex]}`}>
      <span className="role-prefix">ROLE /</span>
      <span aria-hidden="true" className="role-value">
        {reduced ? roles[0] : visible}
        <i className="terminal-cursor" />
      </span>
      <span className="sr-only" aria-live="polite">
        {roles[roleIndex]}
      </span>
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
      transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
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
