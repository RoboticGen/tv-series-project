import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getPublicSubmission, getPublicSubmissionsForProject } from "@/actions/submissions";
import { getContentDoc } from "@/db/content";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { SubmissionViewPanel } from "@/components/submission-view-panel";
import { SlidePanelStack } from "@/components/slide-panel-stack";

export default async function SubmissionViewModal({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const session = await auth();
  const viewerId = session?.user?.id;

  const submission = await getPublicSubmission(id);
  if (!submission || submission.projectSlug !== slug) notFound();

  const project = await getProjectBySlug(slug, viewerId);
  if (!project) notFound();
  const isAuthor = viewerId === project.authorId;
  if (project.status !== "published" && !isAuthor) notFound();

  const [projectSteps, submissionSteps, submissions] = await Promise.all([
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
          submissions={submissions}
        />
      }
      front={<SubmissionViewPanel submission={submission} steps={submissionSteps ?? []} variant="modal" />}
    />
  );
}
