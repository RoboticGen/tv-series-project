import Link from "next/link";
import { NAV_LINKS } from "@/features/landing/components/landing-shared";
import { SITE_NAME } from "@/lib/config/site";

export function LandingFooter() {
  return (
    <footer className="border-t-2 border-edge bg-brand-navy py-10 text-white/80 dark:bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md border-2 border-white bg-brand-teal text-xs font-black text-brand-navy">
            O
          </span>
          <span className="font-heading text-sm font-black text-white">{SITE_NAME}</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold">
          <Link href="/projects" className="hover:text-brand-yellow">
            Explore projects
          </Link>
          {NAV_LINKS.map((link) => (
            <a key={link.id} href={`#${link.id}`} className="hover:text-brand-yellow">
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-xs">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
    </footer>
  );
}
