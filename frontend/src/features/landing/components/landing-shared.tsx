import { Reveal } from "@/shared/components/reveal";
import { cn } from "@/shared/lib/utils";

export const SHADOW = "shadow-hard-4";
export const BORDER = "border-2 border-edge";

export const NAV_LINKS = [
  { id: "how-it-works", label: "How it works" },
  { id: "featured", label: "Featured" },
  { id: "categories", label: "Categories" },
  { id: "levels", label: "Levels" },
];

export function SectionHeading({
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
    <Reveal className="mx-auto max-w-2xl text-center">
      <span
        className={cn(
          "inline-block rounded-sm px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase shadow-hard-2",
          BORDER,
          eyebrowFill,
        )}
      >
        {eyebrow}
      </span>
      <h2
        id={id}
        className="mt-3 font-heading text-3xl font-black tracking-tight text-balance text-foreground sm:text-4xl"
      >
        {title}
      </h2>
      {desc ? (
        <p className="mt-3 font-medium text-pretty text-foreground/75">{desc}</p>
      ) : null}
    </Reveal>
  );
}
