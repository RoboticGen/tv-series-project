import type { LucideIcon } from "lucide-react";
import { Bolt, Cog, Rocket, Trophy, Wrench } from "lucide-react";
import type { PointValues } from "@/features/gamification/services/queries";
import { LevelProgress } from "@/features/gamification/components/level-progress";
import { CountUp } from "@/shared/components/reveal";
import { cn } from "@/shared/lib/utils";


type Level = { name: string; minPoints: number; icon: LucideIcon; fill: string };


export const LEVELS = [
  { name: "Starter", minPoints: 0, icon: Wrench, fill: "bg-brand-sky" },
  { name: "Tinkerer", minPoints: 20, icon: Cog, fill: "bg-brand-green" },
  { name: "Maker", minPoints: 60, icon: Bolt, fill: "bg-brand-yellow" },
  { name: "Inventor", minPoints: 150, icon: Rocket, fill: "bg-brand-coral" },
  { name: "Robot Master", minPoints: 300, icon: Trophy, fill: "bg-brand-teal" },
] as const satisfies readonly Level[];

export function BuilderLevel({ points, pointValues }: { points: number; pointValues: PointValues }) {
  const levelIndex = LEVELS.findLastIndex((level) => points >= level.minPoints);
  const level = LEVELS[levelIndex];
  const next = LEVELS[levelIndex + 1];
  const progress = next
    ? Math.round(((points - level.minPoints) / (next.minPoints - level.minPoints)) * 100)
    : 100;
  const Icon = level.icon;

  return (
    <section
      aria-labelledby="builder-level-heading"
      className="flex flex-col gap-4 rounded-xl border-2 border-edge bg-card p-5 shadow-hard-4"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-edge text-brand-navy shadow-hard-3",
            level.fill,
          )}
        >
          <Icon className="size-7" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2
            id="builder-level-heading"
            className="text-xs font-black tracking-wide text-muted-foreground uppercase"
          >
            Your builder level
          </h2>
          <p className="font-heading text-2xl font-black text-foreground">
            {level.name}
          </p>
        </div>
        <p className="ml-auto text-right">
          <CountUp
            value={points}
            className="block font-heading text-2xl font-black tabular-nums lining-nums text-foreground"
          />
          <span className="text-xs font-bold text-muted-foreground uppercase">points</span>
        </p>
      </div>

      <div>
        <LevelProgress
          points={points}
          progress={progress}
          levelName={level.name}
          levelMinPoints={level.minPoints}
          label={next ? `Progress to ${next.name}` : "Top level reached"}
        />
        <p className="mt-2 text-sm font-medium text-pretty text-muted-foreground">
          {next ? (
            <>
              <strong className="text-foreground">{next.minPoints - points} more points</strong>{" "}
              to become a <strong className="text-foreground">{next.name}</strong>!
            </>
          ) : (
            <>You reached the top level. Amazing work!</>
          )}
        </p>
      </div>

      <ol aria-label="All builder levels" className="grid grid-cols-5 gap-1">
        {LEVELS.map((step, i) => {
          const StepIcon = step.icon;
          const reached = i <= levelIndex;
          const current = i === levelIndex;
          return (
            <li
              key={step.name}
              aria-current={current ? "step" : undefined}
              className="flex flex-col items-center gap-1 text-center"
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 border-edge",
                  reached ? cn(step.fill, "text-brand-navy") : "bg-muted text-muted-foreground",
                  current && "ring-3 ring-edge ring-offset-2 ring-offset-card dark:ring-foreground",
                )}
              >
                <StepIcon className="size-4" aria-hidden />
              </div>
              <span
                className={cn(
                  "text-[0.7rem] leading-tight font-bold",
                  reached ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.name}
                <span className="block font-medium tabular-nums lining-nums text-muted-foreground">
                  {step.minPoints} pts
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <ul aria-label="How to earn points" className="grid border-t-2 border-dashed border-brand-navy/20 pt-3 dark:border-edge/60 grid-cols-2 gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground">
        <li>Try a build: +{pointValues.submission_created}</li>
        <li>Get featured: +{pointValues.project_featured}</li>
        <li>Each star you get: +{pointValues.star_received}</li>
      </ul>
    </section>
  );
}
