"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useLockPageScroll } from "@/shared/hooks/use-lock-page-scroll";
import { cn } from "@/shared/lib/utils";

interface SlidePanelStackProps {
  back: React.ReactNode;
  front: React.ReactNode;
  backWidthClassName?: string;
  frontWidthClassName?: string;
}

const DEFAULT_FRONT_WIDTH_PX = 672;

export function SlidePanelStack({
  back,
  front,
  backWidthClassName = "max-w-xl",
  frontWidthClassName = "max-w-2xl",
}: SlidePanelStackProps) {
  const router = useRouter();
  const frontRef = React.useRef<HTMLElement>(null);
  const [frontWidth, setFrontWidth] = React.useState<number | null>(null);
  useLockPageScroll();

  function close() {
    router.back();
  }

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleResizeStart(event: React.PointerEvent) {
    event.preventDefault();
    const front = frontRef.current;
    if (!front) return;

    const startX = event.clientX;
    const startWidth = front.offsetWidth;

    function handlePointerMove(moveEvent: PointerEvent) {
      const next = startWidth + (startX - moveEvent.clientX);
      const max = window.innerWidth - 32;
      setFrontWidth(Math.min(max, Math.max(DEFAULT_FRONT_WIDTH_PX, next)));
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
      <div className="absolute inset-0 bg-overlay" onClick={close} />
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        <aside
          className={cn(
            "hidden min-h-0 w-screen flex-col overflow-y-auto overscroll-contain border-r bg-background shadow-2xl brightness-95 xl:flex",
            backWidthClassName,
          )}
        >
          {back}
        </aside>
        <aside
          ref={frontRef}
          style={frontWidth ? { width: frontWidth, maxWidth: "none" } : undefined}
          className={cn(
            "relative flex min-h-0 w-screen flex-col overflow-y-auto overscroll-contain bg-background shadow-2xl",
            frontWidthClassName,
          )}
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
          {front}
        </aside>
      </div>
    </div>
  );
}
