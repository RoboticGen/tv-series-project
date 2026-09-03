import { listPublishedProjectsForModeration } from "@/actions/review";
import { ProjectCard } from "@/components/project-card";

export default async function ModerationPage() {
  const feed = await listPublishedProjectsForModeration();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
          Moderation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Published projects, newest first. Feature the ones worth highlighting
          or unpublish anything that shouldn&apos;t be live.
        </p>
      </div>

      <div className="mt-8">
        {feed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published projects yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {feed.map((project) => (
              <ProjectCard
                key={project.id}
                slug={project.slug!}
                title={project.title!}
                summary=""
                category={project.category!}
                authorName={project.authorName!}
                likeCount={0}
                starCount={0}
                coverImageUrl={project.coverImageUrl}
                statusBadge={project.isFeatured ? "featured" : undefined}
                href={`/dashboard/review/${project.slug}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
