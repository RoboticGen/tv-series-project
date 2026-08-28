import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Eye, Pencil } from "lucide-react";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { LikeButton } from "@/components/like-button";
import { StarButton } from "@/components/star-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  robotics: "Robotics",
  electronics: "Electronics",
  iot: "IoT",
  coding_software: "Coding & Software",
  ai_ml: "AI / ML",
  drones: "Drones",
  threed_printing: "3D Printing",
  sensors_automation: "Sensors & Automation",
  competitions: "Competitions",
  other: "Other",
};

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
  body: string;
  viewerId?: string;
  variant?: "page" | "modal";
}

export function ProjectDetailPanel({
  project,
  body,
  viewerId,
  variant = "page",
}: ProjectDetailPanelProps) {
  const isModal = variant === "modal";
  const isAuthor = viewerId === project.authorId;
  const publishedDate = project.publishedAt ?? project.createdAt;

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
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarImage src={project.authorAvatarUrl ?? undefined} alt={project.authorName} />
              <AvatarFallback>{project.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{project.authorName}</span>
          </div>
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
          {isAuthor ? (
            <>
              <Separator orientation="vertical" className="h-5" />
              <Button
                size="sm"
                variant="outline"
                className="ml-auto gap-1.5"
                nativeButton={false}
                render={<Link href={`/projects/${project.slug}/edit`} />}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </>
          ) : null}
        </div>
      </header>

      <div className="mt-10 border-t pt-8">
        <MarkdownViewer body={body} />
      </div>
    </article>
  );
}
