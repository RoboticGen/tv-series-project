"use client";

import * as React from "react";

let lockCount = 0;

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
