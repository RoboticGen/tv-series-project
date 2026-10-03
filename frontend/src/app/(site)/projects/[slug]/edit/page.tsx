import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectBySlug } from "@/features/projects/services/queries";
import { getContentDoc } from "@/lib/db/content";
import { ProjectEditorPanel } from "@/features/projects/components/project-editor-panel";
import { SlidePanel } from "@/shared/components/slide-panel";
import DashboardPage from "@/app/(workspace)/dashboard/page";

export default async function EditProjectPage({
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
    <>
      <DashboardPage />
      <SlidePanel closeHref="/dashboard">
        <ProjectEditorPanel project={project} steps={steps} variant="panel" />
      </SlidePanel>
    </>
  );
}
