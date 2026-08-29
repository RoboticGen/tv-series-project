import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubmissionViewPanelProps {
  submission: {
    createdAt: Date;
    projectTitle: string;
    projectSlug: string;
    authorName: string;
    authorAvatarUrl: string | null;
  };
  body: string;
  variant?: "page" | "modal";
  /** Pass when the viewer is this submission's own author, to show its visibility. */
  isPrivate?: boolean;
}

export function SubmissionViewPanel({
  submission,
  body,
  variant = "page",
  isPrivate,
}: SubmissionViewPanelProps) {
  const isModal = variant === "modal";

  return (
    <div className={cn("px-6 py-8 sm:py-10", !isModal && "mx-auto max-w-3xl py-12", isModal && "pr-10")}>
      {!isModal ? (
        <Link
          href={`/projects/${submission.projectSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to project
        </Link>
      ) : null}

      <div className={cn("flex flex-wrap items-center gap-2 text-sm text-muted-foreground", !isModal && "mt-6")}>
        <span>
          {isPrivate !== undefined ? "Your build of" : "A build of"}{" "}
          <Link
            href={`/projects/${submission.projectSlug}`}
            className="text-brand-teal hover:underline"
          >
            {submission.projectTitle}
          </Link>
        </span>
        {isPrivate !== undefined ? (
          <Badge variant={isPrivate ? "outline" : "secondary"}>
            {isPrivate ? "Private" : "Public"}
          </Badge>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src={submission.authorAvatarUrl ?? undefined} alt={submission.authorName} />
          <AvatarFallback>{submission.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground">{submission.authorName}</span>
      </div>
      <h1 className="mt-3 font-heading text-2xl font-bold text-brand-navy dark:text-white">
        Submitted {submission.createdAt.toLocaleDateString()}
      </h1>
      <div className="mt-8 border-t pt-8">
        <MarkdownViewer body={body} />
      </div>
    </div>
  );
}
