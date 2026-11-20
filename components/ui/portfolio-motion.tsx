"use client";

import { motion, useReducedMotion, useScroll } from "framer-motion";
import { type PointerEvent, type ReactNode } from "react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
    />
  );
}

export function RevealItem({
  children,
  className,
  delay = 0,
  as = "div",
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "article";
  direction?: "up" | "left" | "right";
}) {
  const reduced = useReducedMotion();
  const MotionElement = as === "article" ? motion.article : motion.div;
  const offset = direction === "left" ? -42 : direction === "right" ? 42 : 26;
  return (
    <MotionElement
      className={className}
      initial={reduced ? false : { opacity: 0, x: direction === "up" ? 0 : offset, y: direction === "up" ? 26 : 0 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{
        duration: reduced ? 0 : 0.48,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionElement>
  );
}

export function InteractiveCard({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const reduced = useReducedMotion();
  function move(event: PointerEvent<HTMLElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty("--pointer-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--pointer-y", `${y * 100}%`);
  }
  function reset(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--pointer-x", "50%");
    event.currentTarget.style.setProperty("--pointer-y", "50%");
  }
  return (
    <motion.article
      className={className}
      onPointerMove={move}
      onPointerLeave={reset}
      whileTap={reduced ? undefined : { scale: 0.995 }}
    >
      {children}
    </motion.article>
  );
}
