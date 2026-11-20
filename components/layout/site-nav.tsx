"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const links = [
  ["About", "about"],
  ["Projects", "projects"],
  ["Skills", "skills"],
  ["Certificates", "certificates"],
  ["Achievements", "achievements"],
  ["Updates", "updates"],
  ["Contact", "contact"],
];
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const reduced = useReducedMotion();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const sections = ["home", ...links.map(([, id]) => id)]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: [0, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <nav className="container nav" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="Varun Sharma home">
          <Image src="/favicon.png" alt="Varun Sharma logo" width={38} height={38} priority />
        </a>
        <div id="site-navigation" className={`nav-links ${open ? "nav-open" : ""}`}>
          {links.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              className={active === id ? "nav-link-active" : ""}
              aria-current={active === id ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
              {active === id && (
                <motion.span
                  className="nav-active-indicator"
                  layoutId="nav-active-indicator"
                  transition={{ duration: reduced ? 0 : 0.22 }}
                  aria-hidden="true"
                />
              )}
            </a>
          ))}
        </div>
        <a className="nav-cta" href="#contact">
          Let’s talk <span>↗</span>
        </a>
        <button
          className="menu-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
    </header>
  );
}
