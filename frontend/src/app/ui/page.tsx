"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
const brandColors = [
  { name: "Navy", token: "--brand-navy", hex: "#022f49", fg: "text-white" },
  { name: "Teal", token: "--brand-teal", hex: "#219cbc", fg: "text-white" },
  { name: "Sky", token: "--brand-sky", hex: "#54afe7", fg: "text-white" },
  { name: "Coral", token: "--brand-coral", hex: "#e87a55", fg: "text-white" },
  { name: "Green", token: "--brand-green", hex: "#43b268", fg: "text-white" },
  { name: "Yellow", token: "--brand-yellow", hex: "#fdb713", fg: "text-brand-navy" },
  { name: "Grey", token: "--brand-grey", hex: "#939598", fg: "text-white" },
  { name: "Black", token: "--brand-black", hex: "#1f2022", fg: "text-white" },
];

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b py-12 first:pt-0 last:border-b-0">
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold text-brand-navy dark:text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Demo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

const NAV_LINKS = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "badges", label: "Badges" },
  { id: "cards", label: "Cards" },
  { id: "forms", label: "Forms" },
  { id: "tabs", label: "Tabs" },
  { id: "avatars", label: "Avatars" },
  { id: "feedback", label: "Feedback" },
  { id: "overlays", label: "Overlays" },
];

export default function UiPage() {
  const [switchOn, setSwitchOn] = React.useState(true);
  const [checked, setChecked] = React.useState(false);
  const [progress, setProgress] = React.useState(42);
  const [clicks, setClicks] = React.useState(0);

  return (
    <div className="min-h-full bg-background">
      {/* Brand-style header, mirrors roboticgenacademy.com's nav */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur dark:bg-brand-navy/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand-teal text-sm font-bold text-white">
              R
            </div>
            <span className="font-heading text-sm font-bold text-brand-navy dark:text-foreground">
              RoboticGen Academy
            </span>
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              UI Components
            </Badge>
          </div>
          <Button
            size="sm"
            className="rounded-full bg-[#075E54] text-white hover:bg-[#075E54]/90"
          >
            Chat with us on WhatsApp
          </Button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-6 pb-3 text-sm">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="whitespace-nowrap text-muted-foreground hover:text-brand-teal"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-12">
          <p className="text-sm font-medium text-brand-teal">Design system</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-brand-navy dark:text-foreground sm:text-4xl">
            UI components
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A living reference of the primitives available to build RoboticGen
            Academy product screens — themed with the brand&apos;s navy,
            teal, coral, green and yellow palette. Every control below is
            live: click it, type in it, toggle it.
          </p>
        </div>

        <Section id="colors" title="Colors" description="Core brand tokens, pulled from the live site's stylesheet.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {brandColors.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-xl border">
                <div
                  className={`flex h-20 items-end p-3 ${c.fg}`}
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="text-xs font-semibold">{c.name}</span>
                </div>
                <div className="bg-card px-3 py-2">
                  <p className="font-mono text-xs text-muted-foreground">{c.hex}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/70">
                    {c.token}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="typography"
          title="Typography"
          description="Raleway for headings (the brand's real display face), Inter for body text."
        >
          <div className="space-y-4 rounded-xl border bg-card p-6">
            <h1 className="font-heading text-4xl font-bold text-brand-navy dark:text-foreground">
              Find Your Child&apos;s Superpower
            </h1>
            <h2 className="font-heading text-2xl font-semibold text-brand-navy dark:text-foreground">
              Heading 2 — section title
            </h2>
            <h3 className="font-heading text-lg font-semibold text-brand-navy dark:text-foreground">
              Heading 3 — card title
            </h3>
            <p className="text-base text-foreground">
              Body text in Inter. Every child has a superpower — we help them
              find it through personalised mentoring in robotics and code.
            </p>
            <p className="text-sm text-muted-foreground">
              Muted / caption text, used for helper copy under form fields.
            </p>
          </div>
        </Section>

        <Section id="buttons" title="Buttons" description="Variants, sizes and the brand's pill-shaped WhatsApp CTA.">
          <div className="grid gap-4 md:grid-cols-2">
            <Demo label="Variants">
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </Demo>
            <Demo label="Sizes">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </Demo>
            <Demo label="States">
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button className="rounded-full bg-brand-coral text-white hover:bg-brand-coral/90">
                  Accent (coral)
                </Button>
                <Button className="rounded-full bg-[#075E54] text-white hover:bg-[#075E54]/90">
                  WhatsApp CTA
                </Button>
              </div>
            </Demo>
            <Demo label="Interactive — click count">
              <div className="flex items-center gap-3">
                <Button onClick={() => setClicks((n) => n + 1)}>
                  Click me
                </Button>
                <span className="text-sm text-muted-foreground">
                  Clicked <strong className="text-foreground">{clicks}</strong> time
                  {clicks === 1 ? "" : "s"}
                </span>
              </div>
            </Demo>
          </div>
        </Section>

        <Section id="badges" title="Badges">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-brand-green text-white">Enrolled</Badge>
            <Badge className="bg-brand-yellow text-brand-navy">New batch</Badge>
          </div>
        </Section>

        <Section id="cards" title="Cards" description="Content container used for pathways, pricing and pupil profiles.">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Robotics Pathway</CardTitle>
                <CardDescription>Ages 8–11 · Foundations</CardDescription>
                <CardAction>
                  <Badge variant="secondary">Popular</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Build, code and control real robots in small mentor-led
                  groups.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="w-full">
                  View pathway
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Code Pathway</CardTitle>
                <CardDescription>Ages 11–15 · Intermediate</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From block-based logic to real Python projects, with a
                  capstone build.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline" className="w-full">
                  View pathway
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-brand-teal/40 bg-brand-teal/5">
              <CardHeader>
                <CardTitle>Mentor session</CardTitle>
                <CardDescription>1:1 · 30 min</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Avatar className="size-9">
                    <AvatarFallback>OB</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Obo&apos;s next check-in</p>
                    <p className="text-xs text-muted-foreground">Tomorrow, 4:00 PM</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="w-full bg-brand-teal hover:bg-brand-teal/90">
                  Reschedule
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        <Section id="forms" title="Form controls">
          <div className="grid gap-6 md:grid-cols-2">
            <Demo label="Text inputs">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="parent-name">Parent name</Label>
                  <Input id="parent-name" placeholder="e.g. Amara Perera" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes for the mentor</Label>
                  <Textarea id="notes" placeholder="Tell us about your child's interests…" />
                </div>
              </div>
            </Demo>
            <Demo label="Select, checkbox & switch">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Age group</Label>
                  <Select defaultValue="8-11">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8-11">Ages 8–11</SelectItem>
                      <SelectItem value="12-15">Ages 12–15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
                  I agree to the enrolment terms
                </label>
                <p className="text-xs text-muted-foreground">
                  {checked ? "Terms accepted." : "Terms not yet accepted."}
                </p>
                <div className="flex items-center gap-3">
                  <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
                  <span className="text-sm">
                    Email updates: <strong>{switchOn ? "On" : "Off"}</strong>
                  </span>
                </div>
              </div>
            </Demo>
          </div>
        </Section>

        <Section id="tabs" title="Tabs">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="mentors">Mentors</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-4 text-sm text-muted-foreground">
              A 21st-century skills incubator where children (ages 8–15) become
              innovators, problem-solvers, and leaders through personalised
              mentoring.
            </TabsContent>
            <TabsContent value="curriculum" className="pt-4 text-sm text-muted-foreground">
              Structured pathways move from guided robotics kits to
              independent, portfolio-worthy builds.
            </TabsContent>
            <TabsContent value="mentors" className="pt-4 text-sm text-muted-foreground">
              Every learner is paired with a mentor for regular 1:1 check-ins.
            </TabsContent>
          </Tabs>
        </Section>

        <Section id="avatars" title="Avatars">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>OB</AvatarFallback>
              </Avatar>
              <Avatar className="bg-brand-coral text-white">
                <AvatarFallback>AP</AvatarFallback>
              </Avatar>
              <Avatar className="bg-brand-green text-white">
                <AvatarFallback>KS</AvatarFallback>
              </Avatar>
            </div>
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>OB</AvatarFallback>
              </Avatar>
              <Avatar className="bg-brand-coral text-white">
                <AvatarFallback>AP</AvatarFallback>
              </Avatar>
              <Avatar className="bg-brand-green text-white">
                <AvatarFallback>KS</AvatarFallback>
              </Avatar>
              <Avatar className="bg-brand-yellow text-brand-navy">
                <AvatarFallback>+4</AvatarFallback>
              </Avatar>
            </AvatarGroup>
          </div>
        </Section>

        <Section id="feedback" title="Feedback" description="Alerts and progress, for enrolment and course-completion states.">
          <div className="grid gap-6 md:grid-cols-2">
            <Demo label="Alerts">
              <div className="space-y-3">
                <Alert>
                  <AlertTitle>Batch starting soon</AlertTitle>
                  <AlertDescription>
                    New batches open every two weeks — enrol to reserve a spot.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>Enrolment closed</AlertTitle>
                  <AlertDescription>
                    This pathway is full. Join the waitlist to be notified.
                  </AlertDescription>
                </Alert>
              </div>
            </Demo>
            <Demo label="Progress">
              <div className="space-y-4">
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
                    -10
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
                    +10
                  </Button>
                  <span className="ml-auto self-center text-sm text-muted-foreground">
                    {progress}% of pathway complete
                  </span>
                </div>
              </div>
            </Demo>
          </div>
        </Section>

        <Section id="overlays" title="Overlays" description="Tooltip, dialog and accordion.">
          <div className="grid gap-6 md:grid-cols-2">
            <Demo label="Tooltip & dialog">
              <div className="flex flex-wrap items-center gap-4">
                <Tooltip>
                  <TooltipTrigger render={<Button variant="outline" size="sm" />}>
                    Hover me
                  </TooltipTrigger>
                  <TooltipContent>Mentors reply within one business day.</TooltipContent>
                </Tooltip>

                <Dialog>
                  <DialogTrigger render={<Button size="sm" />}>
                    Open enrolment dialog
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm enrolment</DialogTitle>
                      <DialogDescription>
                        You&apos;re about to reserve a spot in the Robotics
                        Pathway for ages 8–11. A mentor will reach out on
                        WhatsApp to confirm.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" />}>
                        Cancel
                      </DialogClose>
                      <DialogClose
                        render={<Button className="bg-brand-teal hover:bg-brand-teal/90" />}
                      >
                        Confirm
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Demo>
            <Demo label="Accordion">
              <Accordion type="multiple" defaultValue={["item-1"]} className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I enrol my child?</AccordionTrigger>
                  <AccordionContent>
                    Send us a message on WhatsApp and our team will guide you
                    through the pathway that fits best.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What ages do you teach?</AccordionTrigger>
                  <AccordionContent>
                    Learners aged 8 to 15, split across foundation and
                    intermediate pathways.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Demo>
          </div>
        </Section>

        <Separator className="my-4" />
        <p className="pb-8 text-center text-xs text-muted-foreground">
          Component reference for the RoboticGen Academy design system.
        </p>
      </main>
    </div>
  );
}
