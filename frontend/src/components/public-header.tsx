import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LandingAuthButton } from "@/components/landing-auth-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

// Header for signed-out visitors on public pages (browse, project detail).
// Signed-in users get AppShell's sidebar instead; without this, a visitor
// who clicked "Explore projects" on the landing page had no way back.
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 print:hidden border-b-2 border-brand-navy bg-background/95 backdrop-blur dark:border-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/landing"
            className={cn(buttonVariants({ variant: "neutral", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
          <Link href="/landing" className="hidden items-center gap-2 md:flex" aria-label="RoboticGen Projects home">
            <span className="flex size-9 items-center justify-center rounded-md border-2 border-brand-navy bg-brand-teal font-black text-white shadow-[2px_2px_0_0_var(--brand-navy)] dark:border-white">
              R
            </span>
            <span className="font-heading font-black tracking-tight text-brand-navy dark:text-white">
              RoboticGen Projects
            </span>
          </Link>
        </div>
        <LandingAuthButton />
      </div>
    </header>
  );
}
