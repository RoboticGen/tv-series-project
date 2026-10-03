"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Bot } from "lucide-react";
import { SPRING_SNAP } from "@/lib/motion";

const STEP_MS = 750;
// Extra ticks spent on the last square before starting over.
const REST_STEPS = 3;

// The robot piece on the level board
export function LevelBoardToken({
  stops,
  cols,
  rows,
}: {
  stops: { left: number; top: number }[];
  cols: number;
  rows: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (!inView || reduceMotion) return;
    const timer = setInterval(() => setStep((current) => (current + 1) % (stops.length + REST_STEPS)), STEP_MS);
    return () => clearInterval(timer);
  }, [inView, reduceMotion, stops.length]);

  const index = Math.min(step, stops.length - 1);
  const stop = stops[index];
  const finished = index === stops.length - 1;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute flex items-end justify-end p-[1%]"
        style={{ width: `${100 / cols}%`, height: `${100 / rows}%` }}
        initial={false}
        animate={{ left: `${stop.left}%`, top: `${stop.top}%` }}
        transition={SPRING_SNAP}
      >
        <motion.span
          key={index}
          animate={finished ? { rotate: [0, -14, 14, -8, 0], scale: [1, 1.25, 1] } : { y: [0, -12, 0] }}
          transition={{ duration: finished ? 0.7 : 0.35 }}
          className="flex size-6 items-center justify-center rounded-full border-2 border-brand-navy dark:border-edge bg-brand-coral text-white shadow-[2px_2px_0_0_var(--brand-navy)] dark:shadow-[2px_2px_0_0_var(--edge)] sm:size-9"
        >
          <Bot className="size-4 sm:size-6" />
        </motion.span>
      </motion.div>
    </div>
  );
}
