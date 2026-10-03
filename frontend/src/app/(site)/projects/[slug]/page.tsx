import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectBySlug } from "@/features/projects/services/queries";
import { getPublicSubmissionsForProject } from "@/features/submissions/services/queries";
import { listComments } from "@/features/comments/actions";
import { getContentDoc } from "@/lib/db/content";
import { ProjectDetailPanel } from "@/features/projects/components/project-detail-panel";
import { SlidePanel } from "@/shared/components/slide-panel";
import ProjectsPage from "@/app/(site)/projects/page";
import { SITE_NAME } from "@/lib/config/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  const title = `${project.title} — ${SITE_NAME}`;
  const description = project.summary || `A RoboticGen project by ${project.authorName}.`;
  if (project.status !== "published") return { title, description };
  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { type: "article", title: project.title, description, siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title: project.title, description },
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
