import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) return <>{children}</>;

  return <AppShell>{children}</AppShell>;
}
