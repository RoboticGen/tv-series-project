"use client";

import * as React from "react";

// Number of mounted panels holding the lock -- a directly-loaded panel page
// can have an intercepted @modal panel on top, and they don't necessarily
// unmount in reverse order, so save/restore of the previous value isn't safe.
let lockCount = 0;

// Freezes the page behind an open slide panel. Without this the page keeps
// its own scrollbar at the window's right edge -- drawn over the panel -- so
// dragging it (or scrolling past the panel's end) moves the page instead of
// the panel. scrollbar-gutter keeps the page from shifting sideways when its
// scrollbar disappears.
export function useLockPageScroll() {
  React.useEffect(() => {
    const root = document.documentElement;
    if (lockCount++ === 0) {
      root.style.overflow = "hidden";
      root.style.scrollbarGutter = "stable";
    }
    return () => {
      if (--lockCount === 0) {
        root.style.overflow = "";
        root.style.scrollbarGutter = "";
      }
    };
  }, []);
}
