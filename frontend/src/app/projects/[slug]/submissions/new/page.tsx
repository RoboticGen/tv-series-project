import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectBySlug } from "@/actions/projects";
import { SubmissionCreatePanel } from "@/components/submission-create-panel";

export default async function NewSubmissionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/landing");

  const project = await getProjectBySlug(slug, session.user.id);
  if (!project) notFound();

  const isAuthor = project.authorId === session.user.id;
  if (!isAuthor && (project.status !== "published" || !project.isFeatured)) notFound();

  return <SubmissionCreatePanel project={project} isAuthor={isAuthor} variant="page" />;
}
