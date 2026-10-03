"use client";

import * as React from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { DURATION, EASE_SNAP, SPRING_POP } from "@/lib/motion";

const VIEWPORT = { once: true, margin: "-60px" } as const;

// Slides its children up as they scroll into view.
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.reveal, ease: EASE_SNAP }}
    >
      {children}
    </motion.div>
  );
}

const STAGGER_PARENT = { hidden: {}, shown: { transition: { staggerChildren: 0.06 } } };
const STAGGER_CHILD = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  shown: { opacity: 1, y: 0, scale: 1, transition: SPRING_POP },
};

export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul";
}) {
  const Tag = as === "ul" ? motion.ul : motion.div;
  return (
    <Tag className={className} variants={STAGGER_PARENT} initial="hidden" whileInView="shown" viewport={VIEWPORT}>
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag className={className} variants={STAGGER_CHILD}>
      {children}
    </Tag>
  );
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduceMotion || value === 0) return;
    const controls = animate(0, value, {
      duration: Math.min(1.2, 0.4 + value / 100),
      ease: "easeOut",
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString("en");
      },
    });
    return () => {
      controls.stop();
      node.textContent = value.toLocaleString("en");
    };
  }, [inView, reduceMotion, value]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en")}
    </span>
  );
}
