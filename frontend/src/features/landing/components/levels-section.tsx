import { LevelBoard } from "@/features/gamification/components/level-board";
import type { PointValues } from "@/features/gamification/services/queries";
import { BORDER } from "@/features/landing/components/landing-shared";
import { cn } from "@/shared/lib/utils";

export function LevelsSection({ pointValues }: { pointValues: PointValues }) {
  return (
    <section
      id="levels"
      aria-labelledby="levels-heading"
      className="scroll-mt-20 border-b-2 border-edge bg-brand-teal py-16 text-brand-navy sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className={cn(
              "inline-block rounded-sm bg-brand-yellow px-2 py-0.5 text-xs font-black tracking-wide text-brand-navy uppercase shadow-hard-2",
              BORDER,
            )}
          >
            Levels
          </span>
          <h2
            id="levels-heading"
            className="mt-3 font-heading text-3xl font-black tracking-tight text-balance sm:text-4xl"
          >
            Earn points. Climb the levels.
          </h2>
          <p className="mt-3 font-medium text-pretty text-brand-navy">
            Climb the ladders from Starter to Robot Master. Watch out for tangled wires!
          </p>
        </div>

        <div className="mt-12">
          <LevelBoard pointValues={pointValues} />
        </div>
      </div>
    </section>
  );
}
