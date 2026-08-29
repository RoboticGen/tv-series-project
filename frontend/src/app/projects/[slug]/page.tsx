import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getPublicSubmissionsForProject } from "@/actions/submissions";
import { getContentDoc } from "@/db/content";
import { ProjectDetailPanel } from "@/components/project-detail-panel";

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

  const [body, submissions] = await Promise.all([
    getContentDoc(project.contentDocId),
    getPublicSubmissionsForProject(project.id),
  ]);

  return (
    <ProjectDetailPanel
      project={project}
      body={body ?? ""}
      viewerId={viewerId}
      variant="page"
      submissions={submissions}
    />
  );
}
