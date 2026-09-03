import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getPublishedProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import { projectCategory } from "@/db/schema";

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
    return (
      <p className="text-sm text-muted-foreground">
        No projects match your search yet.
      </p>
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
        <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
          Browse projects
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
      </form>

      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={q ? `/projects?q=${encodeURIComponent(q)}` : "/projects"}
          className={!category ? "font-medium text-brand-teal" : "text-muted-foreground"}
        >
          All
        </Link>
        {projectCategory.enumValues.map((value) => (
          <Link
            key={value}
            href={`/projects?category=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={
              category === value ? "font-medium text-brand-teal" : "text-muted-foreground"
            }
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
    <div className="grid animate-pulse gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-40 rounded-lg bg-muted" />
      ))}
    </div>
  );
}
