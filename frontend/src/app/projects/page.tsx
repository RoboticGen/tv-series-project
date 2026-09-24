import { Suspense } from "react";
import Link from "next/link";
import { Search, SearchX, Sparkles, X } from "lucide-react";
import { getPublishedProjects } from "@/actions/projects";
import { ProjectCard, ProjectCardSkeleton } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import { projectCategory } from "@/db/schema";
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

function browseHref(params: { q?: string; category?: string; featured?: boolean }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.featured) search.set("featured", "1");
  const qs = search.toString();
  return qs ? `/projects?${qs}` : "/projects";
}

async function BrowseGrid({
  query,
  category,
  featured,
}: {
  query?: string;
  category?: string;
  featured?: boolean;
}) {
  const projects = await getPublishedProjects({ query, category, featured });

  if (projects.length === 0) {
    const hasFilters = Boolean(query || category || featured);
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-brand-navy py-16 text-center dark:border-white">
        <div className="flex size-12 items-center justify-center rounded-sm border-2 border-brand-navy bg-brand-teal text-white shadow-[3px_3px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[3px_3px_0_0_#fff]">
          <SearchX className="size-5" aria-hidden="true" />
        </div>
        <p className="font-bold text-foreground">
          {hasFilters ? "No projects match your search." : "No projects have been published yet."}
        </p>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground">
          {hasFilters
            ? "Try a different keyword or category."
            : "Check back soon — new builds are added regularly."}
        </p>
        {hasFilters ? (
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-teal transition-colors hover:text-brand-teal/80"
          >
            <X className="size-3.5" />
            Clear search and filters
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          slug={project.slug}
          title={project.title}
          summary={project.summary}
          category={project.category}
          authorName={project.authorName}
          likeCount={project.likeCount}
          starCount={project.starCount}
          isFeatured={project.isFeatured}
          coverImageUrl={project.coverImageUrl}
        />
      ))}
    </div>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; featured?: string }>;
}) {
  const { q, category, featured: featuredParam } = await searchParams;
  const featured = featuredParam === "1";

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div>
        <h1 className="text-balance font-heading text-2xl font-bold text-brand-navy dark:text-white">
          Browse projects
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Published builds from the RoboticGen community — featured picks first.
        </p>
      </div>

      <form className="mt-6 flex items-center gap-2" action="/projects">
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {featured ? <input type="hidden" name="featured" value="1" /> : null}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search projects…"
            className="h-9 pl-8"
          />
        </div>
        {q ? (
          <Link
            href={browseHref({ category, featured })}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <nav aria-label="Filter by category" className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={browseHref({ q, category, featured: !featured })}
          aria-pressed={featured}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm border-2 px-3 py-1 font-bold transition-all",
            featured
              ? "border-brand-navy bg-brand-yellow text-brand-navy shadow-[3px_3px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[3px_3px_0_0_#fff]"
              : "border-brand-navy text-foreground hover:bg-brand-yellow/30 dark:border-white",
          )}
        >
          <Sparkles className="size-3.5" />
          Featured only
        </Link>
        <Link
          href={browseHref({ q, featured })}
          aria-current={!category ? "page" : undefined}
          className={cn(
            "rounded-sm border-2 px-3 py-1 font-bold transition-all",
            !category
              ? "border-brand-navy bg-brand-teal text-white shadow-[3px_3px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[3px_3px_0_0_#fff]"
              : "border-transparent text-muted-foreground hover:border-brand-navy hover:text-foreground dark:hover:border-white",
          )}
        >
          All
        </Link>
        {projectCategory.enumValues.map((value) => (
          <Link
            key={value}
            href={browseHref({ q, category: value, featured })}
            aria-current={category === value ? "page" : undefined}
            className={cn(
              "rounded-sm border-2 px-3 py-1 font-bold transition-all",
              category === value
                ? "border-brand-navy bg-brand-teal text-white shadow-[3px_3px_0_0_var(--brand-navy)] dark:border-white dark:shadow-[3px_3px_0_0_#fff]"
                : "border-transparent text-muted-foreground hover:border-brand-navy hover:text-foreground dark:hover:border-white",
            )}
          >
            {CATEGORY_LABELS[value]}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Suspense fallback={<GridSkeleton />} key={`${category ?? "all"}-${q ?? ""}-${featured}`}>
          <BrowseGrid query={q} category={category} featured={featured} />
        </Suspense>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
