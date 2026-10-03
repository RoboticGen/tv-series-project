import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectBySlug } from "@/features/projects/services/queries";
import { getContentDoc } from "@/lib/db/content";
import { ProjectEditorPanel } from "@/features/projects/components/project-editor-panel";
import { SlidePanel } from "@/shared/components/slide-panel";

export default async function EditProjectModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");

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
