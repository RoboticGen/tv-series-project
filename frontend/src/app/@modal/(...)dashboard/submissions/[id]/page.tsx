import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSubmissionById } from "@/actions/submissions";
import { getProjectBySlug } from "@/actions/projects";
import { getPublicSubmissionsForProject } from "@/actions/submissions";
import { getContentDoc } from "@/db/content";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { SubmissionViewPanel } from "@/components/submission-view-panel";
import { SlidePanelStack } from "@/components/slide-panel-stack";

export default async function MySubmissionModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/landing");
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
