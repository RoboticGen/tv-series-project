import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/project-form";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { ProjectModeSwitch } from "@/components/project-mode-switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "secondary" | "outline"> = {
  draft: "outline",
  pending_review: "secondary",
  rejected: "outline",
  published: "secondary",
};

interface ProjectEditorPanelProps {
  project: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    category: string;
    coverImageUrl: string | null;
    status: string;
    rejectionReason: string | null;
  };
  body: string;
  variant?: "page" | "modal";
}

export function ProjectEditorPanel({
  project,
  body,
  variant = "page",
}: ProjectEditorPanelProps) {
  const isModal = variant === "modal";

  return (
    <div
      className={cn(
        "px-6 py-8 sm:py-10",
        !isModal && "mx-auto max-w-4xl",
      )}
    >
      {!isModal ? (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      ) : null}

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3",
          !isModal && "mt-4",
          isModal && "pr-10",
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
              {project.title === "Untitled project" ? "New project" : "Edit project"}
            </h1>
            <Badge
              variant={STATUS_VARIANT[project.status] ?? "outline"}
              className="capitalize"
            >
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{project.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectModeSwitch slug={project.slug} mode="edit" />
          <DeleteProjectButton
            projectId={project.id}
            title={project.title}
            inModal={isModal}
          />
        </div>
      </div>

      <div className="mt-8">
        <ProjectForm
          projectId={project.id}
          initialTitle={project.title}
          initialSummary={project.summary}
          initialCategory={project.category}
          initialCoverImageUrl={project.coverImageUrl}
          initialBody={body}
          status={project.status}
          rejectionReason={project.rejectionReason}
          inModal={isModal}
        />
      </div>
    </div>
  );
}
