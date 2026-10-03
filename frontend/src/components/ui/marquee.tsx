import { cn } from "@/lib/utils";

export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const track = items.map((item) => (
    <span key={item} className="mx-6 inline-flex items-center gap-6">
      {item}
      <span aria-hidden className="size-3 rotate-45 bg-brand-navy" />
    </span>
  ));

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex w-full overflow-x-hidden border-y-2 border-brand-navy bg-brand-yellow font-heading text-xl font-black tracking-wide text-brand-navy uppercase dark:border-edge",
        className,
      )}
    >
      <div className="py-3 whitespace-nowrap motion-safe:animate-marquee">{track}</div>
      <div className="absolute top-0 py-3 whitespace-nowrap motion-safe:animate-marquee2">{track}</div>
    </div>
  );
}
