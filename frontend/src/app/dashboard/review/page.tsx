import { listPendingReviewProjects } from "@/actions/review";
import { ProjectCard } from "@/components/project-card";

export default async function ReviewQueuePage() {
  const queue = await listPendingReviewProjects();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
          Review queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Projects waiting for approval, oldest first.
        </p>
      </div>

      <div className="mt-8">
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing pending review right now.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {queue.map((project) => (
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
                statusBadge="pending review"
                href={`/dashboard/review/${project.slug}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
