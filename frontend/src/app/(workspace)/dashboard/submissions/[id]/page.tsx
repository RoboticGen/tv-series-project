import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubmissionById } from "@/features/submissions/services/queries";
import { getContentDoc } from "@/lib/db/content";
import { SubmissionViewPanel } from "@/features/submissions/components/submission-view-panel";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");

  const submission = await getSubmissionById(id, session.user.id);
  if (!submission) notFound();

  const steps = (await getContentDoc(submission.contentDocId)) ?? [];

  return (
    <SubmissionViewPanel
      submission={{
        createdAt: submission.createdAt,
        projectTitle: submission.projectTitle,
        projectSlug: submission.projectSlug,
        authorName: session.user.name ?? "You",
        authorAvatarUrl: session.user.image ?? null,
      }}
      steps={steps}
      isPrivate={submission.isPrivate}
      variant="page"
    />
  );
}
