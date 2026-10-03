import { Suspense } from "react";
import Link from "next/link";
import { Search, SearchX, Sparkles, X } from "lucide-react";
import { countPublishedProjectPages, getPublishedProjects } from "@/actions/projects";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProjectCard, ProjectCardSkeleton } from "@/components/project-card";
import { Stagger, StaggerItem } from "@/components/reveal";
import { Input } from "@/components/ui/input";
import { projectCategory } from "@/db/schema";
import { CATEGORY_LABELS } from "@/lib/categories";
import { cn } from "@/lib/utils";

function browseHref(params: { q?: string; category?: string; featured?: boolean; page?: number }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.featured) search.set("featured", "1");
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/projects?${qs}` : "/projects";
}

// First, last and the pages around the current one, with "gap" for the rest.
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const wanted = [1, page - 1, page, page + 1, totalPages].filter((n) => n >= 1 && n <= totalPages);
  const pages = [...new Set(wanted)].sort((a, b) => a - b);
  return pages.flatMap((n, i) => (i > 0 && n - pages[i - 1] > 1 ? ["gap" as const, n] : [n]));
}

async function BrowseGrid({
  query,
  category,
  featured,
  page,
}: {
  query?: string;
  category?: string;
  featured?: boolean;
  page: number;
}) {
  const [projects, totalPages] = await Promise.all([
    getPublishedProjects({ query, category, featured, page }),
    countPublishedProjectPages({ query, category, featured }),
  ]);
  const pageHref = (target: number) => browseHref({ q: query, category, featured, page: target });

  if (projects.length === 0) {
    const hasFilters = Boolean(query || category || featured);
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-edge py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-sm border-2 border-edge bg-brand-teal text-brand-navy shadow-hard-3">
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
            className="inline-flex items-center gap-1 text-sm font-bold text-teal-ink transition-colors hover:text-teal-ink/80"
          >
            <X className="size-3.5" />
            Clear search and filters
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <StaggerItem key={project.id}>
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
            />
          </StaggerItem>
        ))}
      </Stagger>
      {totalPages > 1 ? (
        <Pagination className="mt-10">
          <PaginationContent className="flex-wrap justify-center">
            {page > 1 ? (
              <PaginationItem>
                <PaginationPrevious href={pageHref(page - 1)} />
              </PaginationItem>
            ) : null}
            {pageWindow(page, totalPages).map((entry, i) => (
              <PaginationItem key={entry === "gap" ? `gap-${i}` : entry}>
                {entry === "gap" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink href={pageHref(entry)} isActive={entry === page}>
                    {entry}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            {page < totalPages ? (
              <PaginationItem>
                <PaginationNext href={pageHref(page + 1)} />
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; featured?: string; page?: string }>;
}) {
  const { q, category, featured: featuredParam, page: pageParam } = await searchParams;
  const featured = featuredParam === "1";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div>
        <h1 className="text-balance font-heading text-2xl font-bold text-foreground">
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
              ? "border-edge bg-brand-yellow text-brand-navy shadow-hard-3"
              : "border-edge text-foreground hover:bg-brand-yellow/30",
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
              ? "border-edge bg-brand-teal text-brand-navy shadow-hard-3"
              : "border-transparent text-muted-foreground hover:border-edge hover:text-foreground",
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
                ? "border-edge bg-brand-teal text-brand-navy shadow-hard-3"
                : "border-transparent text-muted-foreground hover:border-edge hover:text-foreground",
            )}
          >
            {CATEGORY_LABELS[value]}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Suspense fallback={<GridSkeleton />} key={`${category ?? "all"}-${q ?? ""}-${featured}-${page}`}>
          <BrowseGrid query={q} category={category} featured={featured} page={page} />
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
