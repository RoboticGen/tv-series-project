import Link from "next/link";
import { Bot, Cog, Compass, Sparkles, Star, Zap } from "lucide-react";
import { CountUp } from "@/shared/components/reveal";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import type { PointValues } from "@/features/gamification/services/queries";
import { LandingHeroCta } from "@/features/landing/components/landing-hero-cta";
import { BORDER, SHADOW } from "@/features/landing/components/landing-shared";
import { cn } from "@/shared/lib/utils";

export interface CommunityCounts {
  publishedProjects: number;
  featuredProjects: number;
  makers: number;
}

function HeroIllustration({ pointValues }: { pointValues: PointValues }) {
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[16rem] sm:max-w-sm lg:max-w-md">
      <div className={cn("absolute inset-6 rotate-3 rounded-3xl bg-brand-yellow", BORDER, SHADOW)} />
      <div
        className={cn(
          "absolute inset-10 -rotate-2 flex items-center justify-center rounded-3xl bg-brand-teal",
          BORDER,
          SHADOW,
        )}
      >
        <Bot className="size-2/5 text-brand-navy motion-safe:animate-bounce motion-safe:[animation-duration:3s]" strokeWidth={1.5} />
      </div>
      <Cog className="absolute top-0 left-2 size-16 text-foreground motion-safe:animate-[spin_10s_linear_infinite]" />
      <Zap className="absolute right-4 bottom-10 size-12 fill-brand-yellow text-brand-navy" />

      <span
        className={cn(
          "absolute top-8 -right-2 -rotate-6 motion-safe:animate-float rounded-lg bg-white px-3 py-1.5 font-heading text-sm font-black tabular-nums lining-nums text-brand-navy sm:-right-6",
          BORDER,
          SHADOW,
        )}
      >
        <Sparkles className="mr-1 inline size-4 fill-brand-yellow text-brand-navy" />
        Featured! <span className="font-sans">+{pointValues.project_featured}</span>
      </span>
      <span
        className={cn(
          "absolute bottom-2 left-0 rotate-3 motion-safe:animate-float motion-safe:[animation-delay:1.3s] rounded-lg bg-brand-coral px-3 py-1.5 font-heading text-sm font-black tabular-nums lining-nums text-brand-navy sm:-left-4",
          BORDER,
          SHADOW,
        )}
      >
        <Star className="mr-1 inline size-4 fill-brand-yellow text-brand-navy" />
        New star <span className="font-sans">+{pointValues.star_received}</span>
      </span>
      <span
        className={cn(
          "absolute top-1/2 -left-2 -rotate-6 motion-safe:animate-float motion-safe:[animation-delay:2.6s] rounded-lg bg-brand-green px-3 py-1.5 font-heading text-sm font-black tabular-nums lining-nums text-brand-navy sm:-left-8",
          BORDER,
          SHADOW,
        )}
      >
        Level up!
      </span>
    </div>
  );
}

export function HeroSection({ counts, pointValues }: { counts: CommunityCounts; pointValues: PointValues }) {
  const headlineCounts = [
    { label: "projects shared", value: counts.publishedProjects, fill: "bg-brand-sky" },
    { label: "featured builds", value: counts.featuredProjects, fill: "bg-brand-yellow" },
    { label: "young makers", value: counts.makers, fill: "bg-brand-green" },
  ].filter((c) => c.value > 0);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b-2 border-edge bg-brand-sky/15"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(var(--brand-navy)_1px,transparent_1px)] [background-size:22px_22px] opacity-10 dark:bg-[radial-gradient(var(--foreground)_1px,transparent_1px)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm bg-white px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase shadow-hard-2",
              BORDER,
            )}
          >
            <Bot className="size-3.5" aria-hidden />
            For young makers
          </span>
          <h1
            id="hero-heading"
            className="mt-4 font-heading text-4xl leading-[1.05] font-black tracking-tight text-balance text-foreground sm:text-6xl"
          >
            Build cool stuff.{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Share it.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-0 h-4 -rotate-1 bg-brand-yellow sm:h-5"
              />
            </span>{" "}
            <span className="text-teal-ink">Level up!</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg font-medium text-pretty text-foreground/75">
            Robots, drones, gadgets and code. Try projects made by other kids, show off your
            own inventions and earn points on your way to Robot Master.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LandingHeroCta />
            <Link
              href="/projects"
              className={buttonVariants({ variant: "neutral", size: "lg", className: "gap-2" })}
            >
              <Compass className="size-4" aria-hidden />
              Explore projects
            </Link>
          </div>

          {headlineCounts.length > 0 ? (
            <dl className="mt-10 flex flex-wrap gap-3">
              {headlineCounts.map((count) => (
                <div
                  key={count.label}
                  className={cn("flex flex-col-reverse rounded-lg px-4 py-2", BORDER, SHADOW, count.fill)}
                >
                  <dt className="text-xs font-bold tracking-wide text-brand-navy uppercase">
                    {count.label}
                  </dt>
                  <dd className="font-heading text-3xl font-black tabular-nums lining-nums text-brand-navy">
                    <CountUp value={count.value} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <HeroIllustration pointValues={pointValues} />
      </div>
    </section>
  );
}
