// Shared Motion settings -- see MOTION.md. Mirrors the tokens in globals.css.
export const EASE_SNAP = [0.2, 0.8, 0.2, 1] as const;

export const SPRING_POP = { type: "spring", stiffness: 520, damping: 16 } as const;
export const SPRING_SNAP = { type: "spring", stiffness: 420, damping: 30 } as const;

export const DURATION = { press: 0.12, enter: 0.26, reveal: 0.4 } as const;

// Confetti in brand colours (globals.css :root).
export const CONFETTI_COLORS = ["#219cbc", "#54afe7", "#e87a55", "#43b268", "#fdb713", "#022f49"];
