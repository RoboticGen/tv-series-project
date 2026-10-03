import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import Link from "next/link";
import { Search, SearchX, Sparkles } from "lucide-react";
import { countPublishedProjectPages, getPublishedProjects } from "@/features/projects/services/queries";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";
import { ProjectCard, ProjectCardSkeleton } from "@/features/projects/components/project-card";
import { Stagger, StaggerItem } from "@/shared/components/reveal";
import { Input } from "@/shared/components/ui/input";
import { projectCategory } from "@/lib/db/schema";
import { CATEGORY_LABELS } from "@/features/projects/categories";
import { loadBrowseSearchParams, serializeBrowseSearchParams } from "@/features/projects/search-params";
import { cn } from "@/shared/lib/utils";
import { NoResults } from "@/shared/components/no-results";

function browseHref(params: { q?: string; category?: string | null; featured?: boolean; page?: number }) {
  return serializeBrowseSearchParams("/projects", {
    q: params.q ?? null,
    category: params.category ?? null,
    featured: params.featured ?? null,
    page: params.page ?? null,
  });
}

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
  query: string;
  category: string | null;
  featured: boolean;
  page: number;
}) {
  const filters = { query: query || undefined, category: category ?? undefined, featured };
  const [projects, totalPages] = await Promise.all([
    getPublishedProjects({ ...filters, page }),
    countPublishedProjectPages(filters),
  ]);
  const pageHref = (target: number) => browseHref({ q: query, category, featured, page: target });

  if (projects.length === 0) {
    const hasFilters = Boolean(query || category || featured);
    return (
      <NoResults
        icon={SearchX}
        title={hasFilters ? "No projects match your search." : "No projects have been published yet."}
        description={
          hasFilters ? "Try a different keyword or category." : "Check back soon — new builds are added regularly."
        }
        clearHref={hasFilters ? "/projects" : undefined}
        clearLabel="Clear search and filters"
      />
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
  searchParams: Promise<SearchParams>;
}) {
  const { q, category, featured, page: rawPage } = await loadBrowseSearchParams(searchParams);
  const page = Math.max(1, rawPage);

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
