import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid,
  ArrowRight,
  ArrowUpRight,
  Heart,
  Star,
  Lock,
  Bot,
  Boxes,
  Cpu,
  Radio,
  Code2,
  Brain,
  Plane,
  SlidersHorizontal,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFeaturedProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/project-card";
import { LandingAuthButton } from "@/components/landing-auth-button";
import { LandingHeroCta } from "@/components/landing-hero-cta";
import { projectCategory } from "@/db/schema";

// Featured projects change whenever a mentor approves a submission --
// revalidate periodically instead of freezing the list at build time.
export const revalidate = 60;

const NAV_LINKS = [
  { id: "categories", label: "Categories" },
  { id: "featured", label: "Featured" },
  { id: "community", label: "Community" },
];

const CATEGORY_LABELS: Record<string, string> = {
  robotics: "Robotics",
  electronics: "Electronics",
  iot: "IoT",
  coding_software: "Coding & Software",
  ai_ml: "AI / ML",
  drones: "Drones",
  threed_printing: "3D Printing",
  sensors_automation: "Sensors & Automation",
  competitions: "Competitions",
  other: "Other",
};

const CATEGORY_ICONS: Record<string, typeof Bot> = {
  robotics: Bot,
  electronics: Cpu,
  iot: Radio,
  coding_software: Code2,
  ai_ml: Brain,
  drones: Plane,
  threed_printing: Boxes,
  sensors_automation: SlidersHorizontal,
  competitions: Trophy,
  other: Sparkles,
};

const COMMUNITY_ITEMS = [
  {
    index: "01",
    icon: Heart,
    tint: "text-brand-coral",
    title: "Likes",
    lede: "Community engagement signal",
    body: "Anyone can like a published project — likes surface the most-loved builds across categories.",
  },
  {
    index: "02",
    icon: Star,
    tint: "text-brand-yellow",
    title: "Featured projects",
    lede: "Mentor/admin approved",
    body: "Once approved, a project appears on the Featured wall for every visitor to discover.",
  },
  {
    index: "03",
    icon: Lock,
    tint: "text-brand-navy dark:text-white",
    title: "Private submissions",
    lede: "Visible only to you",
    body: "Submit a project privately for practice or review — only the submitter can see it, for now.",
  },
];

const HERO_COLLAGE = [
  { seed: "roboticgen-arm", label: "Robotic arm build" },
  { seed: "roboticgen-drone", label: "Autonomous drone" },
  { seed: "roboticgen-iot", label: "IoT sensor rig" },
];

function SectionHeading({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
}) {
  const isLeft = align === "left";
  return (
    <div className={isLeft ? "max-w-xl" : "mx-auto max-w-2xl text-center"}>
      <p className="text-sm font-medium tracking-wide text-brand-teal">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-balance font-heading text-3xl font-bold tracking-tight text-brand-navy dark:text-white">
        {title}
      </h2>
      {desc ? (
        <p className="mt-3 text-pretty text-muted-foreground">{desc}</p>
      ) : null}
    </div>
  );
}

export default async function LandingPage() {
  const featured = await getFeaturedProjects({ page: 1 });
  const previewProjects = featured.slice(0, 6);
  const [leadProject, ...restProjects] = previewProjects;

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur dark:bg-brand-navy/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-teal text-sm font-bold text-white">
              R
            </div>
            <span className="font-heading text-sm font-bold text-brand-navy dark:text-white">
              RoboticGen Projects
            </span>
          </div>
          <nav className="hidden gap-6 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="text-muted-foreground transition-colors hover:text-brand-teal"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <LandingAuthButton />
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div
            className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_80%_60%_at_15%_-10%,color-mix(in_oklch,var(--brand-teal),transparent_78%),transparent)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
            aria-hidden
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-xl">
              <Badge variant="secondary" className="mb-5">
                Build. Document. Share.
              </Badge>
              <h1 className="text-balance font-heading text-4xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-6xl">
                A home for every{" "}
                <span className="text-brand-teal">student build</span>
              </h1>
              <p className="mt-5 max-w-md text-pretty text-lg text-muted-foreground">
                Publish step-by-step project write-ups, get mentor-reviewed,
                and get featured — the Instructables-style hub built for
                RoboticGen learners.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <LandingHeroCta />
                <Link
                  href="/projects"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-navy transition-colors hover:text-brand-teal dark:text-white"
                >
                  Browse projects
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Overlapping build collage */}
            <div className="relative hidden h-80 lg:block" aria-hidden>
              <div className="absolute right-4 top-0 w-56 -rotate-3 overflow-hidden rounded-2xl ring-1 ring-foreground/10 shadow-xl shadow-brand-navy/10 transition-transform hover:-translate-y-1 hover:rotate-0">
                <Image
                  src="https://picsum.photos/seed/roboticgen-arm/480/320"
                  alt=""
                  width={480}
                  height={320}
                  className="aspect-3/2 w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute left-0 top-16 w-48 rotate-2 overflow-hidden rounded-2xl ring-1 ring-foreground/10 shadow-xl shadow-brand-navy/10 transition-transform hover:-translate-y-1 hover:rotate-0">
                <Image
                  src="https://picsum.photos/seed/roboticgen-drone/420/300"
                  alt=""
                  width={420}
                  height={300}
                  className="aspect-7/5 w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-0 right-16 w-44 rotate-6 overflow-hidden rounded-2xl ring-1 ring-foreground/10 shadow-xl shadow-brand-navy/10 transition-transform hover:-translate-y-1 hover:rotate-0">
                <Image
                  src="https://picsum.photos/seed/roboticgen-iot/380/280"
                  alt=""
                  width={380}
                  height={280}
                  className="aspect-19/14 w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute -bottom-4 left-6 flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-brand-navy shadow-lg ring-1 ring-foreground/10 dark:text-white">
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                  <Trophy className="size-3" />
                </span>
                47 builds featured this term
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="scroll-mt-20 border-b py-20">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="Categories"
              title="Browse by category"
              desc="Admins curate the category list — projects are filed under one to keep discovery focused."
            />
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {projectCategory.enumValues.map((value) => {
                const Icon = CATEGORY_ICONS[value];
                return (
                  <Link
                    key={value}
                    href={`/projects?category=${value}`}
                    className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand-teal hover:shadow-lg hover:shadow-brand-teal/10"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal transition-colors group-hover:bg-brand-teal group-hover:text-white">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-sm font-medium text-brand-navy dark:text-white">
                      {CATEGORY_LABELS[value]}
                    </span>
                  </Link>
                );
              })}
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <LayoutGrid className="size-3.5" />
              Managed from the admin panel — add, rename, or retire categories anytime.
            </p>
          </div>
        </section>

        {/* Featured projects */}
        <section id="featured" className="scroll-mt-20 border-b bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="Featured"
              title="Approved builds from the community"
              desc="Every project here has been mentor-reviewed and approved — real write-ups, real learners."
            />

            <div className="mt-10">
              {previewProjects.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No featured projects yet — check back soon.
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {leadProject ? (
                    <div className="md:col-span-2 md:row-span-2">
                      <ProjectCard
                        key={leadProject.id}
                        slug={leadProject.slug}
                        title={leadProject.title}
                        summary={leadProject.summary}
                        category={leadProject.category}
                        authorName={leadProject.authorName}
                        likeCount={leadProject.likeCount}
                        starCount={leadProject.starCount}
                        coverImageUrl={leadProject.coverImageUrl}
                        isFeatured
                      />
                    </div>
                  ) : null}
                  {restProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      slug={project.slug}
                      title={project.title}
                      summary={project.summary}
                      category={project.category}
                      authorName={project.authorName}
                      likeCount={project.likeCount}
                      starCount={project.starCount}
                      coverImageUrl={project.coverImageUrl}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                className="gap-1.5 rounded-full"
                nativeButton={false}
                render={<Link href="/projects" />}
              >
                Search & browse all projects
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Community interaction */}
        <section id="community" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <SectionHeading
                align="left"
                eyebrow="Community"
                title="Like, get featured, submit privately"
                desc="Three ways the community shapes what rises to the top — and what stays just for you."
              />
              <div className="divide-y divide-border">
                {COMMUNITY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="group flex items-start gap-5 py-6 first:pt-0 last:pb-0"
                    >
                      <span
                        className="shrink-0 font-mono text-sm text-muted-foreground/60"
                        aria-hidden
                      >
                        {item.index}
                      </span>
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted transition-transform group-hover:-translate-y-0.5 ${item.tint}`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-heading text-base font-semibold text-brand-navy dark:text-white">
                            {item.title}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {item.lede}
                          </span>
                        </div>
                        <p className="mt-1.5 max-w-md text-sm text-pretty text-muted-foreground">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-brand-navy py-10 text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
              R
            </div>
            <span className="text-sm text-white">RoboticGen Projects</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <Link href="/projects" className="transition-colors hover:text-white">
              Browse projects
            </Link>
            <a href="#categories" className="transition-colors hover:text-white">
              Categories
            </a>
            <a
              href="#community"
              className="inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              Community
              <ArrowUpRight className="size-3" />
            </a>
          </nav>
          <p className="text-xs">
            © {new Date().getFullYear()} RoboticGen Projects. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
