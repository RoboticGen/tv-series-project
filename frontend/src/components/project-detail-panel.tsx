import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Download, Eye, Hammer } from "lucide-react";
import { StepsViewer } from "@/components/steps-viewer";
import type { Step } from "@/lib/steps";
import { LikeButton } from "@/components/like-button";
import { StarButton } from "@/components/star-button";
import { AddToCollectionButton } from "@/components/add-to-collection-button";
import { CommentSection } from "@/components/comment-section";
import { ProjectModeSwitch } from "@/components/project-mode-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORY_LABELS } from "@/lib/categories";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

interface ProjectDetailPanelProps {
  project: {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    category: string;
    title: string;
    slug: string;
    summary: string;
    coverImageUrl: string | null;
    status: string;
    isFeatured: boolean;
    likeCount: number;
    starCount: number;
    viewCount: number;
    publishedAt: Date | null;
    createdAt: Date;
    viewerHasLiked: boolean;
    viewerHasStarred: boolean;
  };
  steps: Step[];
  viewerId?: string;
  viewerCanModerate?: boolean;
  variant?: "page" | "modal";
  submissions?: {
    id: string;
    createdAt: Date;
    authorName: string;
    authorAvatarUrl: string | null;
  }[];
  comments?: {
    id: string;
    body: string;
    createdAt: Date;
    userId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    replies: {
      id: string;
      body: string;
      createdAt: Date;
      userId: string;
      authorName: string;
      authorAvatarUrl: string | null;
    }[];
  }[];
}

export function ProjectDetailPanel({
  project,
  steps,
  viewerId,
  viewerCanModerate = false,
  variant = "page",
  submissions = [],
  comments = [],
}: ProjectDetailPanelProps) {
  const isModal = variant === "modal";
  const isAuthor = viewerId === project.authorId;
  const publishedDate = project.publishedAt ?? project.createdAt;
  const canSubmitBuild = Boolean(viewerId) && (isAuthor || project.isFeatured);

  return (
    <article
      className={cn(
        "px-6 py-8 sm:py-10",
        !isModal && "mx-auto max-w-3xl py-12",
        isModal && "pr-10",
      )}
    >
      {!isModal ? (
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to projects
        </Link>
      ) : null}

      {project.coverImageUrl ? (
        <div
          className={cn(
            "relative aspect-video w-full overflow-hidden rounded-xl border bg-muted",
            !isModal && "mt-6",
            isModal && "mt-4",
          )}
        >
          <Image
            src={project.coverImageUrl}
            alt={project.title}
            fill
            sizes={isModal ? "100vw" : "(min-width: 1024px) 768px, 100vw"}
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      ) : null}

      <header className={cn(project.coverImageUrl ? "mt-6" : !isModal && "mt-6")}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-wide">
            {CATEGORY_LABELS[project.category] ?? project.category}
          </Badge>
          {project.status !== "published" ? (
            <Badge variant="outline" className="capitalize">
              {project.status.replace("_", " ")}
            </Badge>
          ) : null}
          {project.isFeatured ? (
            <Badge className="bg-brand-yellow text-brand-navy">Featured</Badge>
          ) : null}
        </div>

        <h1 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl dark:text-white">
          {project.title}
        </h1>

        {project.summary ? (
          <p className="mt-3 text-pretty text-lg leading-relaxed text-muted-foreground">
            {project.summary}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={`/authors/${project.authorId}`} className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarImage src={project.authorAvatarUrl ?? undefined} alt={project.authorName} />
              <AvatarFallback>{project.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground transition-colors hover:text-brand-teal hover:underline">
              {project.authorName}
            </span>
          </Link>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-3.5" />
            {dateFormatter.format(publishedDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="size-3.5" />
            {project.viewCount.toLocaleString()} views
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border bg-card/50 p-2">
          <LikeButton
            projectId={project.id}
            initialLiked={project.viewerHasLiked}
            initialCount={project.likeCount}
            signedIn={Boolean(viewerId)}
          />
          <StarButton
            projectId={project.id}
            initialStarred={project.viewerHasStarred}
            initialCount={project.starCount}
            signedIn={Boolean(viewerId)}
          />
          <AddToCollectionButton projectId={project.id} signedIn={Boolean(viewerId)} />
          {project.status === "published" ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              nativeButton={false}
              render={<a href={`/api/projects/${project.slug}/pdf`} download />}
            >
              <Download className="size-3.5" />
              Download PDF
            </Button>
          ) : null}
          {canSubmitBuild ? (
            <Button
              size="sm"
              variant="outline"
              className={cn("gap-1.5", !isAuthor && "ml-auto")}
              nativeButton={false}
              render={<Link href={`/projects/${project.slug}/submissions/new`} />}
            >
              <Hammer className="size-3.5" />
              I built this
            </Button>
          ) : null}
          {isAuthor ? (
            <>
              <Separator orientation="vertical" className="h-5" />
              <ProjectModeSwitch slug={project.slug} mode="preview" className="ml-auto" />
            </>
          ) : null}
        </div>
      </header>

      <div className="mt-10 border-t pt-8">
        <StepsViewer steps={steps} />
      </div>

      {submissions.length > 0 ? (
        <div className="mt-10 border-t pt-8">
          <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white">
            Community builds
          </h2>
          <ul className="mt-4 space-y-2">
            {submissions.map((submission) => (
              <li key={submission.id}>
                <Link
                  href={`/projects/${project.slug}/submissions/${submission.id}`}
                  className="flex items-center gap-2 rounded-xl border bg-card/50 p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-brand-teal hover:shadow-md hover:shadow-brand-teal/10"
                >
                  <Avatar size="sm">
                    <AvatarImage
                      src={submission.authorAvatarUrl ?? undefined}
                      alt={submission.authorName}
                    />
                    <AvatarFallback>
                      {submission.authorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">
                    {submission.authorName}
                  </span>
                  <span className="text-muted-foreground">built this</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {dateFormatter.format(submission.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {project.status === "published" ? (
        <CommentSection
          projectId={project.id}
          comments={comments}
          viewerId={viewerId}
          viewerCanModerate={viewerCanModerate}
        />
      ) : null}
    </article>
  );
}
