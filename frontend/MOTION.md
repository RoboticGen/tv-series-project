# Motion

Motion for the neobrutalist UI described in [`Design.md`](./Design.md). The
branding playbook says nothing about motion; these are implementation choices.

## Principles

- **Fast and hard-edged.** Things snap, stamp and pop. No slow fades.
- **Overshoot, don't ease.** Entrances use a spring or `--ease-pop`.
- **Motion means something.** Presses confirm a click, pops confirm a change,
  stamps and confetti mark an achievement. Decoration stays small.
- **Rare is special.** Confetti and the celebration stamp are only for things
  a student earned: publishing, levelling up, being featured.
- **Always optional.** Everything is off or instant under the OS "reduce
  motion" setting, and nothing is ever hidden because an animation did not run.

## Tokens

| Token | CSS (`globals.css`) | Motion (`src/lib/motion.ts`) | Use |
|---|---|---|---|
| Press | `--duration-press` 120ms | `DURATION.press` | Button presses, icon swaps |
| Enter | `--duration-enter` 260ms | `DURATION.enter` | Panels, toasts, image zoom |
| Exit | 180ms | n/a | Panels and backdrops leaving (about 70% of enter) |
| Reveal | n/a | `DURATION.reveal` 400ms | Scroll reveals |
| Snap | `--ease-snap` `cubic-bezier(0.2, 0.8, 0.2, 1)` | `EASE_SNAP`, `SPRING_SNAP` | Slides and reveals |
| Pop | `--ease-pop` `cubic-bezier(0.34, 1.56, 0.64, 1)` | `SPRING_POP` | Badges, stamps, cards popping in |

Use the tokens: `duration-(--duration-press)`, `ease-(--ease-snap)`, or the
constants from `src/lib/motion.ts`. Don't write raw millisecond or
cubic-bezier values in components.

## Patterns

| Pattern | Behaviour |
|---|---|
| Button press | Travels into its shadow on hover and active (3px), shadow disappears, 120ms |
| Card hover | Lifts 2px up and left, shadow grows from 4px to 6px; project cards tilt 1 degree |
| Like / star | Icon scales up and back (stars also spin) when toggled on |
| Theme toggle | Sun and moon swap with a quarter turn, 120ms |
| Slide panel | Slides in from the right in 260ms with snap easing, leaves in 180ms; backdrop fades |
| Dialog, select, tooltip | Fade plus slight zoom, 150 to 200ms |
| Toast | Slides up from the bottom right and stacks, stays 5 seconds; stack movement is 500ms from the neobrutalism.dev registry component |
| Scroll reveal | Section slides up 28px once; grids pop in one by one, 60ms apart |
| Count up | Numbers tick from 0 to their value, at most 1.2s, once |
| Stamp | Chip scales down from 2.4x with overshoot, 420ms |
| Celebration | Yellow stamp plus confetti in brand colours, clears itself after 2.8s, click to dismiss |
| Shake | 360ms horizontal shake for a rejected action |
| Loops | Marquee 28s, float 4s, wobble 1.6s, slow spinning cogs 12 to 14s |

## Building blocks

| Piece | File | Use for |
|---|---|---|
| `toast()` / `<Toaster />` | `components/toast.tsx` | Small confirmations and "+N points" |
| `celebrate()` / `<Celebration />` | `components/celebration.tsx` | Level up, publish: stamp plus confetti |
| `<Reveal>` | `components/reveal.tsx` | Sections sliding up on scroll |
| `<Stagger>` / `<StaggerItem>` | `components/reveal.tsx` | Grids popping in one by one |
| `<CountUp>` | `components/reveal.tsx` | Numbers ticking up |
| `<Marquee>` | `components/ui/marquee.tsx` | Scrolling band (from neobrutalism.dev) |
| `animate-float`, `-stamp`, `-wobble`, `-shake` | `globals.css` | CSS-only loops and one-shots |
| Slide panel view transitions | `globals.css` | `.panel-in`, `.panel-out`, `.backdrop-in`, `.backdrop-out` |

## Reduced motion and accessibility

- Motion components: `<MotionConfig reducedMotion="user">` in `providers.tsx`
  turns transforms off and keeps opacity changes.
- CSS loops and one-shots: always prefixed `motion-safe:` (marquee, float,
  wobble, stamp, bounce, skeleton pulse, hover tilt and zoom).
- Radix enter and exit animations and view transitions are cut to instant in
  the `prefers-reduced-motion` block of `globals.css`.
- Loading spinners keep spinning; they are the only sign that work is happening.
- `CountUp` renders the final number immediately.
- Anything that moves for more than five seconds is decorative, hidden from
  assistive tech, and can be paused: the marquee stops while hovered.
- Nothing flashes more than three times a second.
- Animate `transform`, `translate`, `scale`, `rotate` and `opacity` only.
  Don't animate layout properties such as width, height, top or margin; the
  toast stack's height change is the one inherited exception.

## Libraries

- **Motion** (`motion/react`) for anything interactive or sequenced.
- **canvas-confetti**, loaded on demand, for celebrations.
- **tw-animate-css** for Radix enter and exit states.
- Plain CSS keyframes for loops, so server components can use them.
