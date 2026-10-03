import { Camera, Compass, Hammer, Trophy } from "lucide-react";
import { BORDER, SectionHeading, SHADOW } from "@/features/landing/components/landing-shared";
import { cn } from "@/shared/lib/utils";

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

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-20 border-b-2 border-edge py-16 sm:py-20"
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
              <h3 className="font-heading text-xl font-black text-foreground">
                {step.title}
              </h3>
              <p className="text-sm font-medium text-pretty text-foreground/75">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
