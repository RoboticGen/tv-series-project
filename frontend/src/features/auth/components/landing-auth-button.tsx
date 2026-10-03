"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/components/ui/avatar";
import { GoogleOneTap } from "@/features/auth/components/google-sign-in";

// Header auth control.
export function LandingAuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button size="sm" variant="neutral" disabled aria-busy="true">
        Loading…
      </Button>
    );
  }

  if (session?.user) {
    return (
      <Button
        size="sm"
        variant="neutral"
        nativeButton={false}
        className="gap-2 pl-1"
        render={<Link href="/dashboard" />}
      >
        <Avatar size="sm" className="size-6">
          <AvatarImage src={session.user.image ?? undefined} alt="" />
          <AvatarFallback>
            {(session.user.name ?? session.user.email ?? "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        My workshop
      </Button>
    );
  }

  return (
    <>
      <GoogleOneTap />
      <Button size="sm" className="gap-2" onClick={() => signIn("google")}>
        <LogIn className="size-4" aria-hidden />
        Sign in
      </Button>
    </>
  );
}
