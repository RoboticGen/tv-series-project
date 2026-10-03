import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LandingAuthButton } from "@/features/auth/components/landing-auth-button";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { SITE_NAME } from "@/lib/config/site";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 print:hidden border-b-2 border-edge bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "neutral", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
          <Link href="/" className="hidden items-center gap-2 md:flex" aria-label={`${SITE_NAME} home`}>
            <span className="flex size-9 items-center justify-center rounded-md border-2 border-edge bg-brand-teal font-black text-brand-navy shadow-hard-2">
              O
            </span>
            <span className="font-heading font-black tracking-tight text-foreground">
              {SITE_NAME}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LandingAuthButton />
        </div>
      </div>
    </header>
  );
}
