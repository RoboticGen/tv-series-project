import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectBySlug } from "@/features/projects/services/queries";
import { SubmissionCreatePanel } from "@/features/submissions/components/submission-create-panel";

export default async function NewSubmissionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");

  const project = await getProjectBySlug(slug, session.user.id);
  if (!project) notFound();

  const isAuthor = project.authorId === session.user.id;
  if (!isAuthor && (project.status !== "published" || !project.isFeatured)) notFound();

  return <SubmissionCreatePanel project={project} isAuthor={isAuthor} variant="page" />;
}
