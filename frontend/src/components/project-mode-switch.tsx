import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectModeSwitchProps {
  slug: string;
  mode: "edit" | "preview";
  className?: string;
}

const segmentClassName =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors";

export function ProjectModeSwitch({ slug, mode, className }: ProjectModeSwitchProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-[3px] rounded-lg bg-muted p-[3px]",
        className,
      )}
    >
      <Link
        href={`/projects/${slug}/edit`}
        className={cn(
          segmentClassName,
          mode === "edit"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Pencil className="size-3.5" />
        Edit
      </Link>
      <Link
        href={`/projects/${slug}`}
        className={cn(
          segmentClassName,
          mode === "preview"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Eye className="size-3.5" />
        Preview
      </Link>
    </div>
  );
}
