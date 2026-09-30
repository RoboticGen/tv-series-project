import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getContentDoc } from "@/db/content";
import { ProjectEditorPanel } from "@/components/project-editor-panel";
import { SlidePanel } from "@/components/slide-panel";
import DashboardPage from "@/app/dashboard/page";

export default async function EditProjectPage({
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

  // Reached only on a hard load (typed URL / refresh); client navigations
  // are intercepted by @modal. Render the same slide panel over the
  // dashboard so both paths look alike.
  return (
    <>
      <DashboardPage />
      <SlidePanel closeHref="/dashboard">
        <ProjectEditorPanel project={project} steps={steps} variant="panel" />
      </SlidePanel>
    </>
  );
}
