import { auth } from "@/lib/auth";
import { AppShell } from "@/core/layout/app-shell";
import { PublicHeader } from "@/core/layout/public-header";

export default async function SiteLayout({
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
