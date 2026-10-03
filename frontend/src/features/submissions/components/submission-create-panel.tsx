import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmissionForm } from "@/features/submissions/components/submission-form";
import { cn } from "@/shared/lib/utils";

interface SubmissionCreatePanelProps {
  project: {
    id: string;
    slug: string;
    title: string;
  };
  isAuthor: boolean;
  variant?: "page" | "modal";
}

export function SubmissionCreatePanel({
  project,
  isAuthor,
  variant = "page",
}: SubmissionCreatePanelProps) {
  const isModal = variant === "modal";

  return (
    <div className={cn("px-6 py-8 sm:py-10", !isModal && "mx-auto max-w-4xl py-12", isModal && "pr-10")}>
      {!isModal ? (
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to project
        </Link>
      ) : null}

      <h1 className={cn("font-heading text-2xl font-bold text-foreground", !isModal && "mt-6")}>
        I built this: {project.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAuthor
          ? "Write up how your build went. You can choose to keep it private or publish it on the project page."
          : "Write up how your build went. Only you can see this submission."}
      </p>
      <div className="mt-8">
        <SubmissionForm projectId={project.id} isAuthor={isAuthor} />
      </div>
    </div>
  );
}
