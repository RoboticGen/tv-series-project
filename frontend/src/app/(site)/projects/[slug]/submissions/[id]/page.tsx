import { notFound } from "next/navigation";
import { getPublicSubmission } from "@/features/submissions/services/queries";
import { getContentDoc } from "@/lib/db/content";
import { SubmissionViewPanel } from "@/features/submissions/components/submission-view-panel";

export default async function PublicSubmissionPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const submission = await getPublicSubmission(id);
  if (!submission || submission.projectSlug !== slug) notFound();

  const steps = (await getContentDoc(submission.contentDocId)) ?? [];

  return <SubmissionViewPanel submission={submission} steps={steps} variant="page" />;
}
