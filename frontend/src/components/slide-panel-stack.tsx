"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlidePanelStackProps {
  /** The panel further from the edge — e.g. the project, shown for context. Hidden on narrow screens. */
  back: React.ReactNode;
  /** The active, closable panel — e.g. the submission. Always visible, anchored to the screen edge. */
  front: React.ReactNode;
  backWidthClassName?: string;
  frontWidthClassName?: string;
}

/**
 * Two slide-in panels shown side by side (not overlapping), like a
 * master/detail drill-down: `back` sits to the left for context, `front` is
 * the active panel on the right with the close control. Closing pops both,
 * since there's no separate history entry for `back` alone in this flow.
 */
export function SlidePanelStack({
  back,
  front,
  backWidthClassName = "max-w-xl",
  frontWidthClassName = "max-w-2xl",
}: SlidePanelStackProps) {
  const router = useRouter();

  function close() {
    router.back();
  }

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        <aside
          className={cn(
            "hidden min-h-0 w-screen flex-col overflow-y-auto border-r bg-background shadow-2xl brightness-95 xl:flex",
            backWidthClassName,
          )}
        >
          {back}
        </aside>
        <aside
          className={cn(
            "relative flex min-h-0 w-screen flex-col overflow-y-auto bg-background shadow-2xl",
            frontWidthClassName,
          )}
        >
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
