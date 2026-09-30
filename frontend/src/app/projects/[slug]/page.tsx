import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getPublicSubmissionsForProject } from "@/actions/submissions";
import { listComments } from "@/actions/comments";
import { getContentDoc } from "@/db/content";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { SlidePanel } from "@/components/slide-panel";
import ProjectsPage from "@/app/projects/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} — RoboticGen Projects`,
    description: project.summary || `A RoboticGen project by ${project.authorName}.`,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const viewerId = session?.user?.id;

  const project = await getProjectBySlug(slug, viewerId);
  if (!project) notFound();

  const isAuthor = viewerId === project.authorId;
  if (project.status !== "published" && !isAuthor) notFound();

  const [steps, submissions, comments] = await Promise.all([
    getContentDoc(project.contentDocId),
    getPublicSubmissionsForProject(project.id),
    listComments(project.id),
  ]);

  const viewerCanModerate = session?.user?.role === "mentor" || session?.user?.role === "admin";

  // Reached only on a hard load (typed URL / refresh / shared link); client
  // navigations are intercepted by @modal. Render the same slide panel over
  // the browse page so both paths look alike.
  return (
    <>
      <ProjectsPage searchParams={Promise.resolve({})} />
      <SlidePanel closeHref="/projects">
        <ProjectDetailPanel
          project={project}
          steps={steps ?? []}
          viewerId={viewerId}
          viewerCanModerate={viewerCanModerate}
          variant="modal"
          submissions={submissions}
          comments={comments}
        />
      </SlidePanel>
    </>
  );
}
