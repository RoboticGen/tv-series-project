import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  Boxes,
  Brain,
  Camera,
  Code2,
  Cog,
  Compass,
  Cpu,
  GraduationCap,
  Hammer,
  Lock,
  Plane,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { getPointValues, type PointValues } from "@/actions/points";
import { getCommunityCounts } from "@/actions/projects";
import { FeaturedSpotlight } from "@/components/featured-spotlight";
import { LandingAuthButton } from "@/components/landing-auth-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingHeroCta } from "@/components/landing-hero-cta";
import { LevelBoard } from "@/components/level-board";
import { projectCategory } from "@/db/schema";
import { CATEGORY_LABELS, type ProjectCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

// Featured projects and counts change whenever a mentor features a
// project, so render per request. Also keeps `next build` from querying the
// database -- CI and the Docker build have none.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RoboticGen Projects · Build it. Share it. Level up!",
  description:
    "A place for young makers to share robotics, coding and electronics projects, try featured builds and earn builder points.",
};

const NAV_LINKS = [
  { id: "how-it-works", label: "How it works" },
  { id: "featured", label: "Featured" },
  { id: "categories", label: "Categories" },
  { id: "levels", label: "Levels" },
];

const CATEGORY_STYLES: Record<ProjectCategory, { icon: LucideIcon; fill: string }> = {
  robotics: { icon: Bot, fill: "bg-brand-teal text-white" },
  electronics: { icon: Cpu, fill: "bg-brand-yellow text-brand-navy" },
  iot: { icon: Radio, fill: "bg-brand-coral text-white" },
  coding_software: { icon: Code2, fill: "bg-brand-green text-white" },
  ai_ml: { icon: Brain, fill: "bg-brand-sky text-brand-navy" },
  drones: { icon: Plane, fill: "bg-brand-sky text-brand-navy" },
  threed_printing: { icon: Boxes, fill: "bg-brand-coral text-white" },
  sensors_automation: { icon: SlidersHorizontal, fill: "bg-brand-green text-white" },
  competitions: { icon: Trophy, fill: "bg-brand-yellow text-brand-navy" },
  other: { icon: Sparkles, fill: "bg-brand-teal text-white" },
};

const STEPS = [
  {
    icon: Compass,
    fill: "bg-brand-sky",
    title: "Pick a build",
    body: "Explore projects made by other kids. Featured ones come with steps you can follow.",
  },
  {
    icon: Hammer,
    fill: "bg-brand-yellow",
    title: "Make it yourself",
    body: "Build it at home, in class or at the lab. Mistakes are part of the fun!",
  },
  {
    icon: Camera,
    fill: "bg-brand-coral",
    title: "Show how you did it",
    body: "Add photos and steps. Share your own inventions too, so others can learn from you.",
  },
  {
    icon: Trophy,
    fill: "bg-brand-green",
    title: "Earn points & level up",
    body: "Get points for builds, stars and being featured. Can you reach Robot Master?",
  },
];

const SAFETY_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Mentors pick the featured builds",
    body: "RoboticGen mentors choose which projects get featured, and can take down anything that doesn't belong.",
  },
  {
    icon: Lock,
    title: "Builds you try stay private",
    body: "When a learner builds someone else's project, their write-up is only visible to them.",
  },
  {
    icon: GraduationCap,
    title: "Simple Google sign-in",
    body: "No new password to remember. We only ask Google for a name, email and profile picture.",
  },
];

const SHADOW = "shadow-[4px_4px_0_0_var(--brand-navy)] dark:shadow-[4px_4px_0_0_var(--edge)]";
const BORDER = "border-2 border-brand-navy dark:border-edge";

function SectionHeading({
  id,
  eyebrow,
  eyebrowFill,
  title,
  desc,
}: {
  id: string;
  eyebrow: string;
  eyebrowFill: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span
        className={cn(
          "inline-block rounded-sm px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase shadow-[2px_2px_0_0_var(--brand-navy)]",
          BORDER,
          eyebrowFill,
        )}
      >
        {eyebrow}
      </span>
      <h2
        id={id}
        className="mt-3 font-heading text-3xl font-black tracking-tight text-balance text-brand-navy sm:text-4xl dark:text-foreground"
      >
        {title}
      </h2>
      {desc ? (
        <p className="mt-3 font-medium text-pretty text-brand-navy/75 dark:text-foreground/75">{desc}</p>
      ) : null}
    </div>
  );
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
        <Bot className="size-2/5 text-white motion-safe:animate-bounce motion-safe:[animation-duration:3s]" strokeWidth={1.5} />
      </div>
      <Cog className="absolute top-0 left-2 size-16 text-brand-navy motion-safe:animate-[spin_10s_linear_infinite] dark:text-foreground" />
      <Zap className="absolute right-4 bottom-10 size-12 fill-brand-yellow text-brand-navy" />

      <span
        className={cn(
          "absolute top-8 -right-2 -rotate-6 rounded-lg bg-white px-3 py-1.5 font-heading text-sm font-black tabular-nums lining-nums text-brand-navy sm:-right-6",
          BORDER,
          SHADOW,
        )}
      >
        <Sparkles className="mr-1 inline size-4 text-brand-yellow" />
        Featured! <span className="font-sans">+{pointValues.project_featured}</span>
      </span>
      <span
        className={cn(
          "absolute bottom-2 left-0 rotate-3 rounded-lg bg-brand-coral px-3 py-1.5 font-heading text-sm font-black tabular-nums lining-nums text-white sm:-left-4",
          BORDER,
          SHADOW,
        )}
      >
        <Star className="mr-1 inline size-4 fill-brand-yellow text-brand-yellow" />
        New star <span className="font-sans">+{pointValues.star_received}</span>
      </span>
      <span
        className={cn(
          "absolute top-1/2 -left-2 -rotate-6 rounded-lg bg-brand-green px-3 py-1.5 font-heading text-sm font-black tabular-nums lining-nums text-white sm:-left-8",
          BORDER,
          SHADOW,
        )}
      >
        Level up!
      </span>
    </div>
  );
}

export default async function LandingPage() {
  const [counts, pointValues] = await Promise.all([getCommunityCounts(), getPointValues()]);
  const headlineCounts = [
    { label: "projects shared", value: counts.publishedProjects, fill: "bg-brand-sky" },
    { label: "featured builds", value: counts.featuredProjects, fill: "bg-brand-yellow" },
    { label: "young makers", value: counts.makers, fill: "bg-brand-green" },
  ].filter((c) => c.value > 0);

  return (
    <div className="min-h-full bg-background">
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-brand-yellow px-3 py-2 font-bold text-brand-navy focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-brand-navy bg-background/95 backdrop-blur dark:border-edge">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/landing" className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-md bg-brand-teal font-black text-white shadow-[2px_2px_0_0_var(--brand-navy)]",
                BORDER,
              )}
            >
              R
            </span>
            <span className="font-heading font-black tracking-tight text-brand-navy dark:text-foreground">
              RoboticGen Projects
            </span>
          </Link>
          <nav aria-label="Page sections" className="hidden gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="rounded-md border-2 border-transparent px-3 py-1.5 text-sm font-bold text-brand-navy transition-colors hover:border-brand-navy hover:bg-brand-yellow dark:text-foreground dark:hover:border-edge dark:hover:text-brand-navy"
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

      <main id="main">
        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden border-b-2 border-brand-navy bg-brand-sky/15 dark:border-edge"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(var(--brand-navy)_1px,transparent_1px)] [background-size:22px_22px] opacity-10 dark:bg-[radial-gradient(var(--edge)_1px,transparent_1px)]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm bg-white px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase shadow-[2px_2px_0_0_var(--brand-navy)]",
                  BORDER,
                )}
              >
                <Bot className="size-3.5" aria-hidden />
                For young makers
              </span>
              <h1
                id="hero-heading"
                className="mt-4 font-heading text-4xl leading-[1.05] font-black tracking-tight text-balance text-brand-navy sm:text-6xl dark:text-foreground"
              >
                Build cool stuff.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Share it.</span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-1 -z-0 h-4 -rotate-1 bg-brand-yellow sm:h-5"
                  />
                </span>{" "}
                <span className="text-brand-teal">Level up!</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg font-medium text-pretty text-brand-navy/75 dark:text-foreground/75">
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
                        {count.value.toLocaleString("en")}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            <HeroIllustration pointValues={pointValues} />
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          className="scroll-mt-20 border-b-2 border-brand-navy py-16 sm:py-20 dark:border-edge"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              id="how-heading"
              eyebrow="How it works"
              eyebrowFill="bg-brand-sky"
              title="Four steps to becoming a maker"
            />
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-xl bg-card p-5 pt-8 motion-safe:transition-transform hover:-translate-y-1",
                    BORDER,
                    SHADOW,
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -top-5 left-5 flex size-10 items-center justify-center rounded-full bg-brand-navy font-heading text-lg font-black text-white dark:bg-foreground dark:text-brand-navy",
                      BORDER,
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-lg text-brand-navy",
                      BORDER,
                      step.fill,
                    )}
                  >
                    <step.icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="font-heading text-xl font-black text-brand-navy dark:text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm font-medium text-pretty text-brand-navy/75 dark:text-foreground/75">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Featured projects -- same spotlight kids see on their dashboard */}
        <div className="border-b-2 border-brand-navy bg-brand-yellow/10 py-16 sm:py-20 dark:border-edge">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FeaturedSpotlight className="scroll-mt-24" />
          </div>
        </div>

        {/* Categories */}
        <section
          id="categories"
          aria-labelledby="categories-heading"
          className="scroll-mt-20 border-b-2 border-brand-navy py-16 sm:py-20 dark:border-edge"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              id="categories-heading"
              eyebrow="Categories"
              eyebrowFill="bg-brand-green"
              title="What do you want to build?"
              desc="Pick a topic to find projects you'll love."
            />
            <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {projectCategory.enumValues.map((value) => {
                const { icon: Icon, fill } = CATEGORY_STYLES[value];
                return (
                  <li key={value}>
                    <Link
                      href={`/projects?category=${value}`}
                      className={cn(
                        "group flex h-full flex-col items-center gap-3 rounded-xl bg-card p-5 text-center outline-none motion-safe:transition-transform hover:-translate-y-1 hover:rotate-1 focus-visible:ring-4 focus-visible:ring-ring/60",
                        BORDER,
                        SHADOW,
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-14 items-center justify-center rounded-full motion-safe:transition-transform group-hover:scale-110",
                          BORDER,
                          fill,
                        )}
                      >
                        <Icon className="size-7" aria-hidden />
                      </span>
                      <span className="font-heading text-sm font-black text-brand-navy dark:text-foreground">
                        {CATEGORY_LABELS[value]}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Levels & points */}
        <section
          id="levels"
          aria-labelledby="levels-heading"
          className="scroll-mt-20 border-b-2 border-brand-navy bg-brand-teal py-16 text-white sm:py-20 dark:border-edge"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span
                className={cn(
                  "inline-block rounded-sm bg-brand-yellow px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase shadow-[2px_2px_0_0_var(--brand-navy)]",
                  BORDER,
                )}
              >
                Levels
              </span>
              <h2
                id="levels-heading"
                className="mt-3 font-heading text-3xl font-black tracking-tight text-balance sm:text-4xl"
              >
                Earn points. Climb the levels.
              </h2>
              <p className="mt-3 font-medium text-pretty text-white/90">
                Climb the ladders from Starter to Robot Master. Watch out for tangled wires!
              </p>
            </div>

            <div className="mt-12">
              <LevelBoard pointValues={pointValues} />
            </div>
          </div>
        </section>

        {/* For parents & teachers */}
        <section
          aria-labelledby="safety-heading"
          className="border-b-2 border-brand-navy py-16 sm:py-20 dark:border-edge"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              id="safety-heading"
              eyebrow="For parents & teachers"
              eyebrowFill="bg-brand-coral"
              title="A safe place to learn by making"
            />
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {SAFETY_ITEMS.map((item) => (
                <li
                  key={item.title}
                  className={cn("flex flex-col gap-3 rounded-xl bg-card p-5", BORDER, SHADOW)}
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-lg bg-brand-sky/30 text-brand-navy dark:text-foreground",
                      BORDER,
                    )}
                  >
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="font-heading text-lg font-black text-brand-navy dark:text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm font-medium text-pretty text-brand-navy/75 dark:text-foreground/75">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final call to action */}
        <section aria-labelledby="cta-heading" className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl bg-brand-yellow p-8 text-center sm:p-12",
                BORDER,
                "shadow-[6px_6px_0_0_var(--brand-navy)] dark:shadow-[6px_6px_0_0_var(--edge)]",
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
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-brand-navy bg-brand-navy py-10 text-white/80 dark:border-edge">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md border-2 border-white bg-brand-teal text-xs font-black text-white">
              R
            </span>
            <span className="font-heading text-sm font-black text-white">RoboticGen Projects</span>
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
          <p className="text-xs">© {new Date().getFullYear()} RoboticGen Projects</p>
        </div>
      </footer>
    </div>
  );
}
