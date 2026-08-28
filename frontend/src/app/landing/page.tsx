import Link from "next/link";
import {
  LayoutGrid,
  ArrowRight,
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-brand-teal">{eyebrow}</p>
      <h2 className="mt-1 font-heading text-3xl font-bold text-brand-navy dark:text-white">
        {title}
      </h2>
      {desc ? <p className="mt-3 text-muted-foreground">{desc}</p> : null}
    </div>
  );
}

export default async function LandingPage() {
  const featured = await getFeaturedProjects({ page: 1 });
  const previewProjects = featured.slice(0, 6);

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur dark:bg-brand-navy/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand-teal text-sm font-bold text-white">
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
                className="text-muted-foreground hover:text-brand-teal"
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
        <section className="relative overflow-hidden border-b bg-linear-to-b from-brand-teal/10 via-background to-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-5">
                Build. Document. Share.
              </Badge>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-6xl">
                A home for every{" "}
                <span className="text-brand-teal">student build</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                Publish step-by-step project write-ups, get mentor-reviewed,
                and get featured — the Instructables-style hub built for
                RoboticGen learners.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <LandingHeroCta />
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full"
                  nativeButton={false}
                  render={<Link href="/projects" />}
                >
                  Browse projects
                </Button>
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
                    className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:border-brand-teal"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
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
                  {previewProjects.map((project) => (
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
            <SectionHeading
              eyebrow="Community"
              title="Like, get featured, submit privately"
              desc="Projects earn likes from the community. Featured projects get top billing. Submissions can be kept private — visible only to the person who submitted them."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-brand-coral/10 text-brand-coral">
                    <Heart className="size-5" />
                  </div>
                  <CardTitle>Likes</CardTitle>
                  <CardDescription>Community engagement signal</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Anyone can like a published project — likes surface the
                    most-loved builds across categories.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-brand-yellow/40">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-navy">
                    <Star className="size-5" />
                  </div>
                  <CardTitle>Featured projects</CardTitle>
                  <CardDescription>Mentor/admin approved</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Once approved, a project appears on the Featured wall for
                    every visitor to discover.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-brand-navy/10 text-brand-navy dark:bg-white/10 dark:text-white">
                    <Lock className="size-5" />
                  </div>
                  <CardTitle>Private submissions</CardTitle>
                  <CardDescription>Visible only to you</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Submit a project privately for practice or review — only
                    the submitter can see it, for now.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-brand-navy py-8 text-white/70">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs">
          © {new Date().getFullYear()} RoboticGen Projects. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
