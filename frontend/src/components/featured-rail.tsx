import { auth } from "@/auth";
import { getFeaturedProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/project-card";

export async function FeaturedRail() {
  const [session, featured] = await Promise.all([auth(), getFeaturedProjects()]);
  const viewerId = session?.user?.id;

  if (featured.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No featured projects yet — check back soon.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {featured.map((project) => (
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
