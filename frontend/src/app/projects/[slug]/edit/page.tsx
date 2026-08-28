import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { getContentDoc } from "@/db/content";
import { ProjectEditorPanel } from "@/components/project-editor-panel";

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

  const body = (await getContentDoc(project.contentDocId)) ?? "";

  return <ProjectEditorPanel project={project} body={body} variant="page" />;
}
