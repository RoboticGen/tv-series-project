import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { PublicHeader } from "@/components/public-header";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <>
        <PublicHeader />
        {children}
      </>
    );
  }

  return <AppShell>{children}</AppShell>;
}
