import { Bug, Cable, Flag } from "lucide-react";
import type { PointValues } from "@/actions/points";
import { LEVELS } from "@/components/builder-level";
import { LevelBoardToken } from "@/components/level-board-token";
import { cn } from "@/lib/utils";

// "Snakes and ladders" for makers: ladders are the actions that earn
// points, and the snakes are tangled wires -- bugs every maker hits. The
// board is decorative (aria-hidden); the level list is also given as a
// visually hidden <ol> for screen readers.

const COLS = 6;
const ROWS = 5;
const CELL = 100; // SVG units per square
const W = COLS * CELL;
const H = ROWS * CELL;

// Squares where each level sits, bottom-left (1) to top-right (30). Typed
// as a tuple mapped over LEVELS, so adding or removing a level is a type
// error here until its square is added too.
type OnePerLevel<T extends readonly unknown[]> = { readonly [K in keyof T]: number };
const LEVEL_SQUARES: OnePerLevel<typeof LEVELS> = [1, 7, 14, 24, 30];

function ladders(pointValues: PointValues): { from: number; to: number; label: string }[] {
  return [
    { from: 2, to: 13, label: `Try a build +${pointValues.submission_created}` },
    { from: 9, to: 21, label: `Get featured +${pointValues.project_featured}` },
    { from: 18, to: 29, label: `Get a star +${pointValues.star_received}` },
  ];
}

const WIRES: { from: number; to: number; color: string; sway: number }[] = [
  { from: 27, to: 15, color: "var(--brand-coral)", sway: 70 },
  { from: 19, to: 5, color: "var(--brand-green)", sway: -80 },
];

// Squares zig-zag like a real board: left-to-right on even rows,
// right-to-left on odd rows, counting from the bottom.
function squarePosition(n: number) {
  const row = Math.floor((n - 1) / COLS);
  const offset = (n - 1) % COLS;
  const col = row % 2 === 0 ? offset : COLS - 1 - offset;
  return { row, col, x: col * CELL + CELL / 2, y: (ROWS - 1 - row) * CELL + CELL / 2 };
}

// The robot's route. TODO: This needs to be properly updated
const TOKEN_PATH = [1, 2, 13, 14, 15, 16, 17, 18, 29, 30];
const TOKEN_STOPS = TOKEN_PATH.map((n) => {
  const { row, col } = squarePosition(n);
  return { left: (col / COLS) * 100, top: ((ROWS - 1 - row) / ROWS) * 100 };
});

function Ladder({ from, to }: { from: number; to: number }) {
  const a = squarePosition(from);
  const b = squarePosition(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  // Unit perpendicular, for the two rails.
  const px = (-dy / len) * 15;
  const py = (dx / len) * 15;
  const rungCount = Math.max(3, Math.round(len / 32));
  const rungs = Array.from({ length: rungCount }, (_, i) => (i + 0.5) / rungCount);

  return (
    <g strokeLinecap="round">
      {[-1, 1].map((side) => (
        <line
          key={side}
          x1={a.x + px * side}
          y1={a.y + py * side}
          x2={b.x + px * side}
          y2={b.y + py * side}
          className="stroke-edge"
          strokeWidth={9}
        />
      ))}
      {rungs.map((t) => (
        <line
          key={t}
          x1={a.x + dx * t - px}
          y1={a.y + dy * t - py}
          x2={a.x + dx * t + px}
          y2={a.y + dy * t + py}
          className="stroke-edge dark:stroke-brand-yellow"
          strokeWidth={6}
        />
      ))}
      {[-1, 1].map((side) => (
        <line
          key={side}
          x1={a.x + px * side}
          y1={a.y + py * side}
          x2={b.x + px * side}
          y2={b.y + py * side}
          stroke="var(--brand-yellow)"
          strokeWidth={4}
        />
      ))}
    </g>
  );
}

function Wire({ from, to, color, sway }: { from: number; to: number; color: string; sway: number }) {
  const head = squarePosition(from);
  const tail = squarePosition(to);
  const dx = tail.x - head.x;
  const dy = tail.y - head.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  // An S-curve: the two control points swing to opposite sides.
  const c1 = { x: head.x + dx / 3 + nx * sway, y: head.y + dy / 3 + ny * sway };
  const c2 = { x: head.x + (2 * dx) / 3 - nx * sway, y: head.y + (2 * dy) / 3 - ny * sway };
  const d = `M ${head.x} ${head.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tail.x} ${tail.y}`;

  // Plug points back along the curve's starting direction.
  const plugAngle = (Math.atan2(head.y - c1.y, head.x - c1.x) * 180) / Math.PI;
  // Frayed copper fans out along the curve's end direction.
  const endAngle = Math.atan2(tail.y - c2.y, tail.x - c2.x);

  return (
    <g strokeLinecap="round" fill="none">
      <path d={d} className="stroke-edge" strokeWidth={16} />
      <path d={d} stroke={color} strokeWidth={10} />
      <path d={d} stroke="white" strokeOpacity={0.45} strokeWidth={2.5} strokeDasharray="2 14" />

      {/* Plug on the "head" end */}
      <g transform={`translate(${head.x} ${head.y}) rotate(${plugAngle})`}>
        <line x1={14} y1={-6} x2={30} y2={-6} className="stroke-edge" strokeWidth={4} />
        <line x1={14} y1={6} x2={30} y2={6} className="stroke-edge" strokeWidth={4} />
        <rect
          x={-14}
          y={-14}
          width={30}
          height={28}
          rx={6}
          fill={color}
          className="stroke-edge"
          strokeWidth={4}
        />
      </g>

      {/* Stripped copper strands on the "tail" end */}
      {[-0.55, 0, 0.55].map((spread) => (
        <line
          key={spread}
          x1={tail.x}
          y1={tail.y}
          x2={tail.x + Math.cos(endAngle + spread) * 18}
          y2={tail.y + Math.sin(endAngle + spread) * 18}
          stroke="#c97a2b"
          strokeWidth={4}
        />
      ))}
    </g>
  );
}

export function LevelBoard({ pointValues }: { pointValues: PointValues }) {
  const ladderList = ladders(pointValues);
  const squares = Array.from({ length: COLS * ROWS }, (_, i) => i + 1);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Screen-reader version of the board */}
      <ol className="sr-only">
        {LEVELS.map((level) => (
          <li key={level.name}>
            {level.name}: {level.minPoints === 0 ? "where everyone starts" : `${level.minPoints} points`}
          </li>
        ))}
      </ol>

      <div
        aria-hidden
        className="relative aspect-[6/5] w-full overflow-hidden rounded-2xl border-4 border-edge bg-card shadow-hard-6"
      >
        {/* Layer 1: numbered squares */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-5">
          {squares.map((n) => {
            const { row, col } = squarePosition(n);
            const levelIndex = LEVEL_SQUARES.indexOf(n);
            const level = levelIndex >= 0 ? LEVELS[levelIndex] : null;
            return (
              <div
                key={n}
                style={{ gridRow: ROWS - row, gridColumn: col + 1 }}
                className={cn(
                  "relative border border-brand-navy/25 dark:border-edge/50",
                  level ? cn(level.fill, "opacity-90") : (row + col) % 2 === 0 ? "bg-brand-sky/15" : "bg-card",
                )}
              >
                <span className="absolute top-0.5 left-1 font-sans text-[0.6rem] font-black text-foreground/60 tabular-nums sm:top-1 sm:left-1.5 sm:text-xs">
                  {n}
                </span>
              </div>
            );
          })}
        </div>

        {/* Layer 2: ladders and wires */}
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full">
          {ladderList.map((l) => (
            <Ladder key={`${l.from}-${l.to}`} from={l.from} to={l.to} />
          ))}
          {WIRES.map((w) => (
            <Wire key={`${w.from}-${w.to}`} {...w} />
          ))}
        </svg>

        {/* Layer 3: level badges sit on top of everything */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-6 grid-rows-5">
          {LEVELS.map((level, i) => {
            const { row, col } = squarePosition(LEVEL_SQUARES[i]);
            const isTop = i === LEVELS.length - 1;
            return (
              <div
                key={level.name}
                style={{ gridRow: ROWS - row, gridColumn: col + 1 }}
                className="flex flex-col items-center justify-center gap-0.5 p-1"
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border-2 border-edge bg-white text-brand-navy shadow-hard-2 sm:size-11",
                    isTop && "bg-brand-yellow",
                  )}
                >
                  <level.icon className="size-4 sm:size-6" />
                </span>
                <span className="hidden rounded-sm bg-white/90 px-1 text-center font-heading text-[0.7rem] leading-tight font-black text-brand-navy sm:block">
                  {level.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Robot piece and finish flag */}
        <LevelBoardToken stops={TOKEN_STOPS} cols={COLS} rows={ROWS} />
        <Flag className="absolute top-[1%] right-[1%] size-5 fill-brand-coral text-brand-navy sm:size-8" />
      </div>

      {/* Legend */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-edge bg-card p-4 text-foreground shadow-hard-4">
          <p className="flex items-center gap-2 font-heading font-black">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <path d="M7 2v20M17 2v20M7 6h10M7 12h10M7 18h10" stroke="currentColor" strokeWidth={2.5} fill="none" strokeLinecap="round" />
            </svg>
            Ladders boost you up
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm font-bold">
            {ladderList.map((l) => (
              <li key={l.label} className="font-sans">{l.label}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border-2 border-edge bg-card p-4 text-foreground shadow-hard-4">
          <p className="flex items-center gap-2 font-heading font-black">
            <Cable className="size-6" aria-hidden />
            Tangled wires are bugs
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm font-medium text-pretty">
            <Bug className="mt-0.5 size-4 shrink-0" aria-hidden />
            Every maker hits a loose wire or a bug. Debug it, fix it and keep climbing. You never
            lose points you&apos;ve earned!
          </p>
        </div>
      </div>
    </div>
  );
}
