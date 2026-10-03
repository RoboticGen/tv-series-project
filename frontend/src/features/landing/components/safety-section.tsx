import { GraduationCap, Lock, ShieldCheck } from "lucide-react";
import { BORDER, SectionHeading, SHADOW } from "@/features/landing/components/landing-shared";
import { cn } from "@/shared/lib/utils";

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

export function SafetySection() {
  return (
    <section
      aria-labelledby="safety-heading"
      className="border-b-2 border-edge py-16 sm:py-20"
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
                  "flex size-11 items-center justify-center rounded-lg bg-brand-sky/30 text-foreground",
                  BORDER,
                )}
              >
                <item.icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-heading text-lg font-black text-foreground">
                {item.title}
              </h3>
              <p className="text-sm font-medium text-pretty text-foreground/75">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
