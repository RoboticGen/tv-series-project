"use client";

import { useSession, signIn } from "next-auth/react";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewProjectButton } from "@/components/new-project-button";

const CTA_CLASS = "gap-2 bg-brand-coral text-white";

export function LandingHeroCta() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button size="lg" className={CTA_CLASS} disabled aria-busy="true">
        <Rocket className="size-4" aria-hidden />
        Start building
      </Button>
    );
  }

  if (session?.user) {
    return (
      <NewProjectButton size="lg" className={CTA_CLASS}>
        <Rocket className="size-4" aria-hidden />
        Start a project
      </NewProjectButton>
    );
  }

  return (
    <Button size="lg" className={CTA_CLASS} onClick={() => signIn("google")}>
      <Rocket className="size-4" aria-hidden />
      Start building with Google
    </Button>
  );
}
