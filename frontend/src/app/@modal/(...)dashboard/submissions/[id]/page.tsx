import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubmissionById } from "@/features/submissions/services/queries";
import { getProjectBySlug } from "@/features/projects/services/queries";
import { getPublicSubmissionsForProject } from "@/features/submissions/services/queries";
import { getContentDoc } from "@/lib/db/content";
import { ProjectDetailPanel } from "@/features/projects/components/project-detail-panel";
import { SubmissionViewPanel } from "@/features/submissions/components/submission-view-panel";
import { SlidePanelStack } from "@/shared/components/slide-panel-stack";

export default async function MySubmissionModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");
  const viewerId = session.user.id;

  const submission = await getSubmissionById(id, viewerId);
  if (!submission) notFound();

  const project = await getProjectBySlug(submission.projectSlug, viewerId);
  if (!project) notFound();
  const isProjectAuthor = viewerId === project.authorId;
  if (project.status !== "published" && !isProjectAuthor) notFound();

  const [projectSteps, submissionSteps, publicSubmissions] = await Promise.all([
    getContentDoc(project.contentDocId),
    getContentDoc(submission.contentDocId),
    getPublicSubmissionsForProject(project.id),
  ]);

  return (
    <SlidePanelStack
      back={
        <ProjectDetailPanel
          project={project}
          steps={projectSteps ?? []}
          viewerId={viewerId}
          variant="modal"
          submissions={publicSubmissions}
        />
      }
      front={
        <SubmissionViewPanel
          submission={{
            createdAt: submission.createdAt,
            projectTitle: submission.projectTitle,
            projectSlug: submission.projectSlug,
            authorName: session.user.name ?? "You",
            authorAvatarUrl: session.user.image ?? null,
          }}
          steps={submissionSteps ?? []}
          isPrivate={submission.isPrivate}
          variant="modal"
        />
      }
    />
  );
}
