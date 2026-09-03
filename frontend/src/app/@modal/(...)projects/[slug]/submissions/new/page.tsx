import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getPublicSubmissionsForProject } from "@/actions/submissions";
import { getContentDoc } from "@/db/content";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { SubmissionCreatePanel } from "@/components/submission-create-panel";
import { SlidePanelStack } from "@/components/slide-panel-stack";

export default async function NewSubmissionModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/landing");
  const viewerId = session.user.id;

  const project = await getProjectBySlug(slug, viewerId);
  if (!project) notFound();

  const isAuthor = project.authorId === viewerId;
  if (!isAuthor && (project.status !== "published" || !project.isFeatured)) notFound();

  const [body, submissions] = await Promise.all([
    getContentDoc(project.contentDocId),
    getPublicSubmissionsForProject(project.id),
  ]);

  return (
    <SlidePanelStack
      back={
        <ProjectDetailPanel
          project={project}
          body={body ?? ""}
          viewerId={viewerId}
          variant="modal"
          submissions={submissions}
        />
      }
      front={<SubmissionCreatePanel project={project} isAuthor={isAuthor} variant="modal" />}
    />
  );
}
