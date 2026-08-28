import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { listPublishedProjects } from "@/actions/projects";
import { FeaturedRail } from "@/components/featured-rail";
import { ProjectCard } from "@/components/project-card";
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

async function PublishedGrid({ category }: { category?: string }) {
  const [session, projects] = await Promise.all([
    auth(),
    listPublishedProjects({ category }),
  ]);
  const viewerId = session?.user?.id;

  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No published projects yet in this category.
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
          href={
            project.authorId === viewerId
              ? `/projects/${project.slug}/edit`
              : undefined
          }
        />
      ))}
    </div>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section>
        <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
          Featured projects
        </h1>
        <div className="mt-6">
          <Suspense fallback={<GridSkeleton />}>
            <FeaturedRail />
          </Suspense>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
            Browse projects
          </h2>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/projects"
              className={!category ? "font-medium text-brand-teal" : "text-muted-foreground"}
            >
              All
            </Link>
            {projectCategory.enumValues.map((value) => (
              <Link
                key={value}
                href={`/projects?category=${value}`}
                className={
                  category === value ? "font-medium text-brand-teal" : "text-muted-foreground"
                }
              >
                {CATEGORY_LABELS[value]}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6">
          <Suspense fallback={<GridSkeleton />} key={category ?? "all"}>
            <PublishedGrid category={category} />
          </Suspense>
        </div>
      </section>
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
