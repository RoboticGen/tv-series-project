import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectBySlug } from "@/features/projects/services/queries";
import { getPublicSubmissionsForProject } from "@/features/submissions/services/queries";
import { getContentDoc } from "@/lib/db/content";
import { ProjectDetailPanel } from "@/features/projects/components/project-detail-panel";
import { SubmissionCreatePanel } from "@/features/submissions/components/submission-create-panel";
import { SlidePanelStack } from "@/shared/components/slide-panel-stack";

export default async function NewSubmissionModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");
  const viewerId = session.user.id;

  const project = await getProjectBySlug(slug, viewerId);
  if (!project) notFound();

  const isAuthor = project.authorId === viewerId;
  if (!isAuthor && (project.status !== "published" || !project.isFeatured)) notFound();

  const [steps, submissions] = await Promise.all([
    getContentDoc(project.contentDocId),
    getPublicSubmissionsForProject(project.id),
  ]);

  return (
    <SlidePanelStack
      back={
        <ProjectDetailPanel
          project={project}
          steps={steps ?? []}
          viewerId={viewerId}
          variant="modal"
          submissions={submissions}
        />
      }
      front={<SubmissionCreatePanel project={project} isAuthor={isAuthor} variant="modal" />}
    />
  );
}
