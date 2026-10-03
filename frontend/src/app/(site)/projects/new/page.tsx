import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createDraftProject } from "@/features/projects/actions";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  await createDraftProject();
}
