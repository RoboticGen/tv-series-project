import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "Page not found — RoboticGen Projects" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <div className="relative">
        <div className="flex size-32 origin-bottom items-center justify-center rounded-3xl border-2 border-edge bg-brand-teal text-brand-navy shadow-hard-6 motion-safe:animate-wobble">
          <Bot className="size-16" strokeWidth={1.5} aria-hidden />
        </div>
        <span className="absolute -top-3 -right-8 rotate-12 rounded-lg border-2 border-edge bg-brand-yellow px-3 py-1 font-heading text-xl font-black text-brand-navy shadow-hard-3 motion-safe:animate-stamp">
          404
        </span>
      </div>
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          This page ran away!
        </h1>
        <p className="mx-auto mt-2 max-w-sm font-medium text-pretty text-muted-foreground">
          Our robot looked everywhere and couldn&apos;t find it. Let&apos;s get you back to the builds.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Go home
        </Link>
        <Link href="/projects" className={buttonVariants({ variant: "neutral", size: "lg", className: "gap-2" })}>
          <Compass className="size-4" aria-hidden />
          Explore projects
        </Link>
      </div>
    </main>
  );
}
