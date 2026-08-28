"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function LandingAuthButton({ size = "sm" }: { size?: "sm" | "lg" }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button size={size} className="rounded-full" disabled>
        Loading…
      </Button>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Avatar size={size === "lg" ? "default" : "sm"}>
          <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "You"} />
          <AvatarFallback>
            {(session.user.name ?? session.user.email ?? "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Badge variant="secondary" className="capitalize">
          {session.user.role}
        </Badge>
        <Button
          size={size}
          variant="outline"
          className="rounded-full"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          Dashboard
        </Button>
        <Button size={size} variant="outline" className="rounded-full" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button size={size} className="rounded-full" onClick={() => signIn("google")}>
      Sign in with Google
    </Button>
  );
}
