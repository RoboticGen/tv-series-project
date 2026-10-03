import { CheckCircle2, SearchX } from "lucide-react";
import type { SearchParams } from "nuqs/server";
import { listPublishedProjectsForModeration } from "@/features/review/services/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { FeatureProjectButton } from "@/features/projects/components/feature-project-button";
import { ReviewQueueFilters } from "@/features/review/components/review-queue-filters";
import { loadReviewSearchParams } from "@/features/review/search-params";
import { NoResults } from "@/shared/components/no-results";

export default async function ModerationPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await loadReviewSearchParams(searchParams);
  const query = params.q.trim();
  const { category, featured, sort } = params;

  const { projects, counts } = await listPublishedProjectsForModeration({
    query: query || undefined,
    category: category === "all" ? undefined : category,
    featured,
    sort,
  });
  const hasFilters = Boolean(query) || category !== "all" || featured !== "all";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <div className="border-b-[3px] border-edge pb-6">
        <span className="inline-block rounded-sm border-2 border-edge bg-brand-navy px-2 py-0.5 text-xs font-black tracking-wide text-white uppercase shadow-hard-2 dark:bg-foreground dark:text-brand-navy">
          Mentors &amp; admins
        </span>
        <h1 className="mt-2 text-balance font-heading text-3xl font-black tracking-tight text-foreground">
          Review queue
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Every published project. Sort by rating to find the best ones, feature
          them straight from the grid, or open one to unpublish it.
        </p>
      </div>

      <div className="mt-8">
        <ReviewQueueFilters counts={counts} />
      </div>

      <div className="mt-8">
        {projects.length === 0 ? (
          <NoResults
            icon={hasFilters ? SearchX : CheckCircle2}
            title={hasFilters ? "No projects match these filters" : "Nothing to review"}
            description={
              hasFilters
                ? "Try a different search, category or tab."
                : "No published projects yet. Check back once students start publishing."
            }
            clearHref={hasFilters ? "/dashboard/review" : undefined}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="flex flex-col gap-3">
                <div className="flex-1">
                  <ProjectCard
                    slug={project.slug}
                    title={project.title}
                    summary={project.summary}
                    category={project.category}
                    authorName={project.authorName}
                    likeCount={project.likeCount}
                    starCount={project.starCount}
                    isFeatured={project.isFeatured}
                    coverImageUrl={project.coverImageUrl}
                    href={`/dashboard/review/${project.slug}`}
                  />
                </div>
                <FeatureProjectButton projectId={project.id} isFeatured={project.isFeatured} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
