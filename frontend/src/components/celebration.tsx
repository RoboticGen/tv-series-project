"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CONFETTI_COLORS, SPRING_POP } from "@/lib/motion";

interface Moment {
  id: number;
  title: string;
  subtitle?: string;
}

const LIFETIME_MS = 2800;

let current: Moment | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function set(next: Moment | null) {
  current = next;
  listeners.forEach((listener) => listener());
}

export function celebrate(input: Omit<Moment, "id">) {
  const id = nextId++;
  set({ ...input, id });
  setTimeout(() => {
    if (current?.id === id) set(null);
  }, LIFETIME_MS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function fireConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const shared = { colors: CONFETTI_COLORS, shapes: ["square" as const], scalar: 1.2, ticks: 180 };
  confetti({ ...shared, particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.75 } });
  confetti({ ...shared, particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.75 } });
}

export function Celebration() {
  const moment = React.useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  const reduceMotion = useReducedMotion();
  const id = moment?.id;

  React.useEffect(() => {
    if (id && !reduceMotion) void fireConfetti();
  }, [id, reduceMotion]);

  return (
    <AnimatePresence>
      {moment ? (
        <motion.div
          key={moment.id}
          role="status"
          onClick={() => set(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex cursor-pointer items-center justify-center bg-black/30 p-6"
        >
          <motion.div
            initial={{ scale: 3, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -4, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={SPRING_POP}
            className="rounded-2xl border-4 border-brand-navy bg-brand-yellow px-8 py-6 text-center text-brand-navy shadow-[8px_8px_0_0_var(--brand-navy)]"
          >
            <p className="font-heading text-4xl font-black tracking-tight uppercase sm:text-6xl">{moment.title}</p>
            {moment.subtitle ? <p className="mt-2 text-base font-bold sm:text-lg">{moment.subtitle}</p> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
