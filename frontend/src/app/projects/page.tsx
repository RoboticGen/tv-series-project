import { Suspense } from "react";
import Link from "next/link";
import { Search, SearchX, X } from "lucide-react";
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

async function BrowseGrid({ query, category }: { query?: string; category?: string }) {
  const projects = await getPublishedProjects({ query, category });

  if (projects.length === 0) {
    const hasFilters = Boolean(query || category);
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
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
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-teal transition-colors hover:text-brand-teal/80"
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
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

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
            href={category ? `/projects?category=${category}` : "/projects"}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <nav aria-label="Filter by category" className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={q ? `/projects?q=${encodeURIComponent(q)}` : "/projects"}
          aria-current={!category ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 transition-colors",
            !category
              ? "border-brand-teal bg-brand-teal/10 font-medium text-brand-teal"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          All
        </Link>
        {projectCategory.enumValues.map((value) => (
          <Link
            key={value}
            href={`/projects?category=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            aria-current={category === value ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 transition-colors",
              category === value
                ? "border-brand-teal bg-brand-teal/10 font-medium text-brand-teal"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {CATEGORY_LABELS[value]}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Suspense fallback={<GridSkeleton />} key={`${category ?? "all"}-${q ?? ""}`}>
          <BrowseGrid query={q} category={category} />
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
