import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Bot, Boxes, Brain, Code2, Cpu, Plane, Radio, SlidersHorizontal, Sparkles, Trophy } from "lucide-react";
import { Stagger, StaggerItem } from "@/shared/components/reveal";
import { projectCategory } from "@/lib/db/schema";
import { BORDER, SectionHeading, SHADOW } from "@/features/landing/components/landing-shared";
import { CATEGORY_LABELS, type ProjectCategory } from "@/features/projects/categories";
import { cn } from "@/shared/lib/utils";

const CATEGORY_STYLES: Record<ProjectCategory, { icon: LucideIcon; fill: string }> = {
  robotics: { icon: Bot, fill: "bg-brand-teal text-brand-navy" },
  electronics: { icon: Cpu, fill: "bg-brand-yellow text-brand-navy" },
  iot: { icon: Radio, fill: "bg-brand-coral text-brand-navy" },
  coding_software: { icon: Code2, fill: "bg-brand-green text-brand-navy" },
  ai_ml: { icon: Brain, fill: "bg-brand-sky text-brand-navy" },
  drones: { icon: Plane, fill: "bg-brand-sky text-brand-navy" },
  threed_printing: { icon: Boxes, fill: "bg-brand-coral text-brand-navy" },
  sensors_automation: { icon: SlidersHorizontal, fill: "bg-brand-green text-brand-navy" },
  competitions: { icon: Trophy, fill: "bg-brand-yellow text-brand-navy" },
  other: { icon: Sparkles, fill: "bg-brand-teal text-brand-navy" },
};

export function CategoriesSection() {
  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="scroll-mt-20 border-b-2 border-edge py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="categories-heading"
          eyebrow="Categories"
          eyebrowFill="bg-brand-green"
          title="What do you want to build?"
          desc="Pick a topic to find projects you'll love."
        />
        <Stagger as="ul" className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {projectCategory.enumValues.map((value) => {
            const { icon: Icon, fill } = CATEGORY_STYLES[value];
            return (
              <StaggerItem as="li" key={value}>
                <Link
                  href={`/projects?category=${value}`}
                  className={cn(
                    "group flex h-full flex-col items-center gap-3 rounded-xl bg-card p-5 text-center outline-none motion-safe:transition-transform hover:-translate-y-1 hover:rotate-1 focus-visible:ring-4 focus-visible:ring-ring",
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
                  <span className="font-heading text-sm font-black text-foreground">
                    {CATEGORY_LABELS[value]}
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
