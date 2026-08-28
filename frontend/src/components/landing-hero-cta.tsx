"use client";

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { NewProjectButton } from "@/components/new-project-button";

export function LandingHeroCta() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button size="lg" className="rounded-full" disabled>
        Loading…
      </Button>
    );
  }

  if (session?.user) {
    return <NewProjectButton size="lg" className="rounded-full">Start a project</NewProjectButton>;
  }

  return (
    <Button size="lg" className="rounded-full" onClick={() => signIn("google")}>
      Sign in with Google
    </Button>
  );
}
