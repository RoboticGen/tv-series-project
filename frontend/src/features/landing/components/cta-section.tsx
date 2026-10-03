import Link from "next/link";
import { ArrowRight, Bot, Cog } from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { LandingHeroCta } from "@/features/landing/components/landing-hero-cta";
import { BORDER } from "@/features/landing/components/landing-shared";
import { cn } from "@/shared/lib/utils";

export function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-brand-yellow p-8 text-center sm:p-12",
            BORDER,
            "shadow-hard-6",
          )}
        >
          <Cog
            aria-hidden
            className="absolute -top-6 -left-6 size-24 text-brand-navy/15 motion-safe:animate-[spin_14s_linear_infinite]"
          />
          <Bot aria-hidden className="absolute -right-4 -bottom-4 size-28 text-brand-navy/15" />
          <h2
            id="cta-heading"
            className="relative font-heading text-3xl font-black tracking-tight text-balance text-brand-navy sm:text-4xl"
          >
            Ready to build something awesome?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md font-medium text-pretty text-brand-navy/80">
            Join the RoboticGen makers and share your first project today.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <LandingHeroCta />
            <Link
              href="/projects"
              className={buttonVariants({ variant: "neutral", size: "lg", className: "gap-2" })}
            >
              Explore projects
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
