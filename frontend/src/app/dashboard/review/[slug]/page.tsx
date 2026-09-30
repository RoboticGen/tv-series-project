import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedProjectForModeration } from "@/actions/review";
import { getContentDoc } from "@/db/content";
import { StepsViewer } from "@/components/steps-viewer";
import { FeatureProjectButton } from "@/components/feature-project-button";
import { UnpublishProjectButton } from "@/components/unpublish-project-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/categories";

export default async function ModerateProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublishedProjectForModeration(slug);
  if (!project) notFound();

  const steps = (await getContentDoc(project.contentDocId)) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {project.coverImageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
          <Image
            src={project.coverImageUrl}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <div className={cn("flex flex-wrap items-center gap-2", project.coverImageUrl && "mt-6")}>
        <Badge variant="secondary">{CATEGORY_LABELS[project.category]}</Badge>
        {project.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
      </div>

      <h1 className="mt-3 text-balance font-heading text-3xl font-bold text-brand-navy dark:text-foreground">
        {project.title}
      </h1>
      <p className="mt-2 text-pretty text-muted-foreground">
        {project.summary ? project.summary : <em>This project has no description</em>}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src={project.authorAvatarUrl ?? undefined} alt={project.authorName} />
          <AvatarFallback>{project.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground">by {project.authorName}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <FeatureProjectButton projectId={project.id} isFeatured={project.isFeatured} />
        <UnpublishProjectButton projectId={project.id} title={project.title} />
      </div>

      <div className="mt-10 border-t pt-8">
        <StepsViewer steps={steps} />
      </div>
    </div>
  );
}
