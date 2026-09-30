import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getContentDoc } from "@/db/content";
import { ProjectEditorPanel } from "@/components/project-editor-panel";
import { SlidePanel } from "@/components/slide-panel";

export default async function EditProjectModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/landing");

  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  if (project.authorId !== session.user.id) notFound();

  const steps = (await getContentDoc(project.contentDocId)) ?? [];

  return (
    <SlidePanel>
      <ProjectEditorPanel project={project} steps={steps} variant="modal" />
    </SlidePanel>
  );
}
