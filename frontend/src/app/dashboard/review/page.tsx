import Link from "next/link";
import { CheckCircle2, SearchX, X } from "lucide-react";
import {
  listPublishedProjectsForModeration,
  type ModerationFeaturedFilter,
  type ModerationSort,
} from "@/actions/review";
import { ProjectCard } from "@/components/project-card";
import { CATEGORY_LABELS } from "@/lib/categories";
import { FeatureProjectButton } from "@/components/feature-project-button";
import { ReviewQueueFilters } from "@/components/review-queue-filters";

const FEATURED_FILTERS: ModerationFeaturedFilter[] = ["all", "featured", "not_featured"];
const SORTS: ModerationSort[] = ["newest", "oldest", "top_rated", "most_liked", "most_favorited"];

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; featured?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category && Object.hasOwn(CATEGORY_LABELS, params.category) ? params.category : "all";
  const featured = pick(params.featured, FEATURED_FILTERS, "all");
  const sort = pick(params.sort, SORTS, "newest");

  const { projects, counts } = await listPublishedProjectsForModeration({
    query: query || undefined,
    category: category === "all" ? undefined : category,
    featured,
    sort,
  });
  const hasFilters = Boolean(query) || category !== "all" || featured !== "all";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <div className="border-b-[3px] border-brand-navy pb-6 dark:border-white">
        <span className="inline-block rounded-sm border-2 border-brand-navy bg-brand-navy px-2 py-0.5 text-xs font-black tracking-wide text-white uppercase shadow-[2px_2px_0_0_var(--brand-navy)] dark:border-white dark:bg-white dark:text-brand-navy dark:shadow-[2px_2px_0_0_#fff]">
          Mentors &amp; admins
        </span>
        <h1 className="mt-2 text-balance font-heading text-3xl font-black tracking-tight text-brand-navy dark:text-white">
          Review queue
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Every published project. Sort by rating to find the best ones, feature
          them straight from the grid, or open one to unpublish it.
        </p>
      </div>

      <div className="mt-8">
        <ReviewQueueFilters
          featured={featured}
          sort={sort}
          category={category}
          query={query}
          counts={counts}
        />
      </div>

      <div className="mt-8">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-brand-navy py-16 text-center dark:border-white">
            <div className="flex size-12 items-center justify-center rounded-sm border-2 border-brand-navy bg-brand-teal text-white shadow-[3px_3px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[3px_3px_0_0_#fff]">
              {hasFilters ? <SearchX className="size-5" /> : <CheckCircle2 className="size-5" />}
            </div>
            <div>
              <p className="font-bold text-foreground">
                {hasFilters ? "No projects match these filters" : "Nothing to review"}
              </p>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">
                {hasFilters
                  ? "Try a different search, category or tab."
                  : "No published projects yet. Check back once students start publishing."}
              </p>
            </div>
            {hasFilters ? (
              <Link
                href="/dashboard/review"
                className="inline-flex items-center gap-1 text-sm font-bold text-brand-teal transition-colors hover:text-brand-teal/80"
              >
                <X className="size-3.5" />
                Clear filters
              </Link>
            ) : null}
          </div>
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
