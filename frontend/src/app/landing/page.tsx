"use client";

import * as React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  LayoutGrid,
  Search,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Lock,
  Bot,
  Boxes,
  Cpu,
  Radio,
  Hammer,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const NAV_LINKS = [
  { id: "categories", label: "Categories" },
  { id: "browse", label: "Browse" },
  { id: "community", label: "Community" },
];

const CATEGORIES = [
  { name: "Robotics", count: 128, icon: Bot },
  { name: "3D Printing", count: 94, icon: Boxes },
  { name: "Electronics", count: 76, icon: Cpu },
  { name: "IoT", count: 52, icon: Radio },
  { name: "Woodworking", count: 41, icon: Hammer },
  { name: "Sensors", count: 33, icon: SlidersHorizontal },
];

const PROJECTS = [
  { title: "Line-Following Rover", author: "Obo P.", cat: "Robotics", likes: 214 },
  { title: "3D-Printed Robotic Arm", author: "Kavindu S.", cat: "3D Printing", likes: 189 },
  { title: "Smart Plant Monitor", author: "Amara J.", cat: "IoT", likes: 152 },
  { title: "Obstacle-Avoiding Bot", author: "Nisal F.", cat: "Robotics", likes: 133 },
  { title: "Home Automation Hub", author: "Dinithi R.", cat: "Electronics", likes: 121 },
  { title: "Ultrasonic Distance Sensor Rig", author: "Sahan W.", cat: "Sensors", likes: 98 },
];

function AuthButton({ size = "sm" }: { size?: "sm" | "lg" }) {
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

function HeroCta() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button size="lg" className="rounded-full" disabled>
        Loading…
      </Button>
    );
  }

  if (session?.user) {
    return (
      <Button
        size="lg"
        className="rounded-full"
        onClick={() =>
          document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })
        }
      >
        Start a project
      </Button>
    );
  }

  return (
    <Button size="lg" className="rounded-full" onClick={() => signIn("google")}>
      Sign in with Google
    </Button>
  );
}

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

export default function LandingPage() {
  const [page, setPage] = React.useState(1);
  const totalPages = 5;

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
          <AuthButton />
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
                <HeroCta />
                <Button size="lg" variant="outline" className="rounded-full">
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
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:border-brand-teal"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
                    <c.icon className="size-5" />
                  </div>
                  <span className="text-sm font-medium text-brand-navy dark:text-white">
                    {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.count} projects
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <LayoutGrid className="size-3.5" />
              Managed from the admin panel — add, rename, or retire categories anytime.
            </p>
          </div>
        </section>

        {/* Search & browse pagination */}
        <section id="browse" className="scroll-mt-20 border-b bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="Search & browse"
              title="Find any project, fast"
              desc="Full-text search with category filtering, paginated results."
            />
            <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search projects…" className="pl-9" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.name} value={c.name.toLowerCase()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PROJECTS.map((p) => (
                <Card key={p.title}>
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">
                      {p.cat}
                    </Badge>
                    <CardTitle className="mt-1">{p.title}</CardTitle>
                    <CardDescription>by {p.author}</CardDescription>
                  </CardHeader>
                  <CardFooter className="justify-between">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Heart className="size-4 text-brand-coral" />
                      {p.likes}
                    </span>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={n === page ? "default" : "ghost"}
                  className="size-8 p-0"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="size-4" />
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
