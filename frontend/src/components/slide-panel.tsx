"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLockPageScroll } from "@/lib/use-lock-page-scroll";

// Current max-w-4xl default -- also the drag-to-resize minimum, so
// resizing only ever makes the panel wider than it already is by default.
const DEFAULT_WIDTH_PX = 896;

// closeHref: set when the panel is rendered by the real page (URL typed or
// reloaded) rather than an intercepted route -- router.back() would then
// leave the app, so close navigates to the page shown behind it instead.
export function SlidePanel({
  children,
  closeHref,
}: {
  children: React.ReactNode;
  closeHref?: string;
}) {
  const router = useRouter();
  const asideRef = React.useRef<HTMLElement>(null);
  const [width, setWidth] = React.useState<number | null>(null);
  useLockPageScroll();

  function close() {
    if (closeHref) router.push(closeHref);
    else router.back();
  }

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleResizeStart(event: React.PointerEvent) {
    event.preventDefault();
    const aside = asideRef.current;
    if (!aside) return;

    const startX = event.clientX;
    const startWidth = aside.offsetWidth;

    // Panel is anchored to the right edge and the handle sits on its left
    // edge, so dragging left (negative clientX delta) grows it.
    function handlePointerMove(moveEvent: PointerEvent) {
      const next = startWidth + (startX - moveEvent.clientX);
      const max = window.innerWidth - 32;
      setWidth(Math.min(max, Math.max(DEFAULT_WIDTH_PX, next)));
    }

    function handlePointerUp() {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    }

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div className="fixed inset-0 z-50">
      <React.ViewTransition enter="backdrop-in" exit="backdrop-out" default="none">
        <div className="absolute inset-0 bg-black/40" onClick={close} />
      </React.ViewTransition>
      <React.ViewTransition enter="panel-in" exit="panel-out" default="none">
        <aside
          ref={asideRef}
          style={width ? { width, maxWidth: "none" } : undefined}
          className="absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col bg-background shadow-2xl"
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel width"
            onPointerDown={handleResizeStart}
            className="absolute inset-y-0 left-0 z-10 hidden w-3 -translate-x-1/2 cursor-col-resize items-center justify-center touch-none sm:flex"
          >
            <div className="h-10 w-1 rounded-full bg-border transition-colors hover:bg-brand-teal" />
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            className="absolute top-4 right-4 z-10"
            onClick={close}
          >
            <X className="size-4" />
          </Button>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </aside>
      </React.ViewTransition>
    </div>
  );
}
