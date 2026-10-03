import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectBySlug } from "@/features/projects/services/queries";
import { getPublicSubmissionsForProject } from "@/features/submissions/services/queries";
import { listComments } from "@/features/comments/actions";
import { getContentDoc } from "@/lib/db/content";
import { ProjectDetailPanel } from "@/features/projects/components/project-detail-panel";
import { SlidePanel } from "@/shared/components/slide-panel";

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

  const [steps, submissions, comments] = await Promise.all([
    getContentDoc(project.contentDocId),
    getPublicSubmissionsForProject(project.id),
    listComments(project.id),
  ]);

  const viewerCanModerate = session?.user?.role === "mentor" || session?.user?.role === "admin";

  return (
    <SlidePanel>
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
  );
}
