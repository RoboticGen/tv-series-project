import Link from "next/link";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { LandingAuthButton } from "@/features/auth/components/landing-auth-button";
import { BORDER, NAV_LINKS } from "@/features/landing/components/landing-shared";
import { SITE_NAME } from "@/lib/config/site";
import { cn } from "@/shared/lib/utils";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-edge bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/landing" className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-md bg-brand-teal font-black text-brand-navy shadow-hard-2",
              BORDER,
            )}
          >
            O
          </span>
          <span className="font-heading font-black tracking-tight text-foreground">
            {SITE_NAME}
          </span>
        </Link>
        <nav aria-label="Page sections" className="hidden gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="rounded-md border-2 border-transparent px-3 py-1.5 text-sm font-bold text-foreground transition-colors hover:border-edge hover:bg-brand-yellow dark:hover:text-brand-navy"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LandingAuthButton />
        </div>
      </div>
    </header>
  );
}
