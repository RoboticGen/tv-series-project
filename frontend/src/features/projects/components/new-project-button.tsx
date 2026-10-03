"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { createDraftProjectRecord } from "@/features/projects/actions";
import { cn } from "@/shared/lib/utils";

interface NewProjectButtonProps {
  className?: string;
  size?: "default" | "lg" | "sm";
  children?: React.ReactNode;
  onNavigate?: () => void;
}

export function NewProjectButton({
  className,
  size = "default",
  children,
  onNavigate,
}: NewProjectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const project = await createDraftProjectRecord();
      onNavigate?.();
      router.push(`/projects/${project.slug}/edit`);
    });
  }

  return (
    <Button
      size={size}
      className={cn("gap-2", className)}
      onClick={handleClick}
      disabled={isPending}
    >
      {children ?? (
        <>
          <Plus className="size-4" />
          {isPending ? "Creating…" : "New project"}
        </>
      )}
    </Button>
  );
}
