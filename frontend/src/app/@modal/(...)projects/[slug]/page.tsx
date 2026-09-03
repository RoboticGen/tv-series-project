import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getPublicSubmissionsForProject } from "@/actions/submissions";
import { listComments } from "@/actions/comments";
import { getContentDoc } from "@/db/content";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { SlidePanel } from "@/components/slide-panel";

export default async function ProjectDetailModal({
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

  const [body, submissions, comments] = await Promise.all([
    getContentDoc(project.contentDocId),
    getPublicSubmissionsForProject(project.id),
    listComments(project.id),
  ]);

  const viewerCanModerate = session?.user?.role === "mentor" || session?.user?.role === "admin";

  return (
    <SlidePanel>
      <ProjectDetailPanel
        project={project}
        body={body ?? ""}
        viewerId={viewerId}
        viewerCanModerate={viewerCanModerate}
        variant="modal"
        submissions={submissions}
        comments={comments}
      />
    </SlidePanel>
  );
}
