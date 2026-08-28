import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getContentDoc } from "@/db/content";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { LikeButton } from "@/components/like-button";
import { StarButton } from "@/components/star-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} — RoboticGen Projects`,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const viewerId = session?.user?.id;

  const project = await getProjectBySlug(slug, viewerId);
  if (!project) notFound();

  const isAuthor = viewerId === project.authorId;
  if (project.status !== "published" && !isAuthor) notFound();

  const body = (await getContentDoc(project.contentDocId)) ?? "";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{CATEGORY_LABELS[project.category]}</Badge>
        {project.status !== "published" ? (
          <Badge variant="outline" className="capitalize">
            {project.status.replace("_", " ")}
          </Badge>
        ) : null}
        {project.isFeatured ? <Badge className="bg-brand-yellow text-brand-navy">Featured</Badge> : null}
      </div>

      <h1 className="mt-3 font-heading text-3xl font-bold text-brand-navy dark:text-white">
        {project.title}
      </h1>
      <p className="mt-2 text-muted-foreground">{project.summary}</p>

      <div className="mt-4 flex items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src={project.authorAvatarUrl ?? undefined} alt={project.authorName} />
          <AvatarFallback>{project.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground">by {project.authorName}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
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
        {project.status === "published" || isAuthor ? (
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/projects/${project.slug}/submissions/new`} />}
          >
            I built this
          </Button>
        ) : null}
        {isAuthor ? (
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href={`/projects/${project.slug}/edit`} />}
          >
            Edit
          </Button>
        ) : null}
      </div>

      <div className="mt-10 border-t pt-8">
        <MarkdownViewer body={body} />
      </div>
    </div>
  );
}
