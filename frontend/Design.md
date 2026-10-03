---
name: RoboticGen Projects
description: Student project showcase where young makers publish builds, try each other's projects and level up.
colors:
  brand-navy: "#022f49"
  brand-teal: "#29a1c1"
  brand-sky: "#54afe7"
  brand-coral: "#e87a55"
  brand-green: "#43b268"
  brand-yellow: "#fdb713"
  brand-grey: "#939598"
  brand-black: "#1f2022"
  teal-ink: "#07657d"
  background: "#ffffff"
  surface-tint: "#e4f5fb"
  hairline: "#d4e1e4"
  muted-text: "#536672"
  destructive: "#d01d21"
  dark-background: "#162e3c"
  dark-card: "#0e202b"
  dark-raised: "#253e4d"
  dark-edge: "#02080e"
  dark-control-edge: "#92a9b4"
  dark-text: "#e9f0f3"
  dark-muted-text: "#abbac2"
  dark-teal-ink: "#65c6e4"
  dark-destructive: "#ff645f"
typography:
  display:
    fontFamily: "Raleway, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3.75rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Raleway, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 2.25rem)"
    fontWeight: 900
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Raleway, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    letterSpacing: "0.025em"
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
  2xl: "0.9rem"
spacing:
  gutter: "1rem"
  gutter-wide: "1.5rem"
  card: "1rem"
  section: "4rem"
  section-wide: "5rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-teal}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "36px"
  button-neutral:
    backgroundColor: "{colors.background}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "36px"
  chip:
    backgroundColor: "{colors.brand-yellow}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: RoboticGen Projects

The values above are the source of truth for agents and tools. The code source
of truth is `src/app/globals.css`; `/ui` is the living component reference.
Motion lives in [`MOTION.md`](./MOTION.md).

## Overview

**Creative North Star: "The Workshop Bench"**

RoboticGen Projects is where students aged 8 to 15 show what they built:
robots, circuits, code, drones. The interface should feel like a workbench
covered in sticker sheets and labelled parts bins, not like a school portal.
Everything is a solid object with a thick outline that you can pick up, press
and stamp.

The style is neobrutalism, taken from [neobrutalism.dev](https://neobrutalism.dev)
and coloured with the RoboticGen Academy brand palette: flat saturated fills,
2px navy outlines, hard offset shadows with no blur, heavy Raleway headings.
The student's project is always the hero of a screen; chrome stays quiet and
colour is spent on things a student can act on or has earned.

**Key Characteristics:**

- Flat brand fills, never gradients or glass.
- Every solid object has a 2px outline and a hard offset shadow.
- One ink colour (navy) on every coloured fill.
- Loud, short, friendly copy written for kids; mentors and parents get the same UI.
- Light and dark themes share the same fills; only surfaces and edges change.

## Colors

Brand colours come from the Academy Branding Playbook (pp. 11-12). Everything
else is derived for screen use and checked against WCAG AA.

### Primary

- **Workshop Teal** (`brand-teal`): primary buttons in light mode, the logo
  tile, hero panels, the Levels band. The playbook value is `#219cbc`; it is
  lifted 2% on screen so navy ink reaches 4.6:1 on it.
- **Signal Yellow** (`brand-yellow`): achievements and attention: featured
  stamps, the marquee, points, the closing call-to-action block, text selection.

### Secondary

- **Sky** (`brand-sky`): primary buttons and active tabs in dark mode, info
  chips, AI/drone categories.
- **Coral** (`brand-coral`): the main call to action on marketing surfaces,
  likes, "tangled wire" hazards on the level board.
- **Green** (`brand-green`): success, "built it", completed levels.

### Neutral

- **Navy** (`brand-navy`): text, outlines and shadows in light mode; ink on
  every coloured fill in both themes.
- **Teal Ink** (`teal-ink` / `dark-teal-ink`): teal as *text*: links, step
  labels, focus rings. Plain teal is only 3.2:1 on white, so it is never used
  for text.
- **Muted Text** (`muted-text` / `dark-muted-text`): secondary copy, 6.0:1 on
  white and 7.0:1 on the dark page. Brand grey (`brand-grey`, 3.0:1) is a
  swatch only and must not carry text.
- **Surface Tint** (`surface-tint`) and **Hairline** (`hairline`): quiet
  secondary fills and 1px dividers.
- **Destructive** (`destructive` / `dark-destructive`): delete, unpublish,
  errors.

### Dark theme

Follows the neobrutalism.dev dark recipe.

| Role | Light | Dark |
|---|---|---|
| Page | `background` | `dark-background` |
| Card, popover, sidebar | `background` | `dark-card` (darker than the page) |
| Raised / hover / muted fill | `surface-tint` | `dark-raised` |
| Outline and shadow (`--edge`) | `brand-navy` | `dark-edge` |
| Form control outline (`--control-edge`) | `brand-navy` | `dark-control-edge` |
| Text | `brand-navy` | `dark-text` |
| Primary action | `brand-teal` | `brand-sky` |

Brand fills are identical in both themes.

### Measured contrast

| Pair | Ratio |
|---|---|
| Navy on white | 13.9 |
| Navy on yellow / sky / green / coral / teal | 7.9 / 5.8 / 5.2 / 4.9 / 4.6 |
| Muted text on white | 6.0 |
| Teal ink on white | 6.6 |
| Destructive on white | 5.3 |
| Dark text on dark page / card | 12.1 / 14.4 |
| Dark muted text on dark page / card | 7.0 / 8.3 |
| Sky on dark page | 5.8 |

### Named Rules

**The Navy Ink Rule.** Text and icons on a brand fill are always navy. White
on teal, coral, green or sky is 2.4 to 3.2:1 and is not allowed. White text is
only for navy and destructive fills.

**The Same Fills Rule.** Never dim or desaturate a brand fill for dark mode.
Dark mode changes surfaces and edges, not colours.

**The Light Control Rule.** In dark mode a black outline cannot reach 3:1
against the page, so inputs, selects, checkboxes and switches use
`--control-edge`. Cards, buttons and chips keep black edges because their fill
or label already identifies them.

## Typography

**Display Font:** Raleway (headings, `font-heading`)
**Body Font:** Inter (`font-sans`)
**Mono Font:** Geist Mono (code blocks and token names only)

**Character:** Raleway at weight 900 with tight tracking gives headings a
chunky, poster-like voice; Inter at 500 keeps body copy sturdy enough to sit
next to 2px outlines. The playbook's OnelySans is not shipped in this app.

### Hierarchy

- **Display** (900, 2.25rem to 3.75rem, line-height 1.05): one per page, the hero or page greeting.
- **Headline** (900, 1.875rem to 2.25rem): section titles.
- **Title** (900, 1.125rem): card and panel titles.
- **Body** (500, 0.875rem, 1.125rem for hero lead copy): descriptions, capped around 65ch.
- **Label** (900, 0.75rem, uppercase, tracking 0.025em): chips, stamps, stat captions.

### Named Rules

**The Balanced Heading Rule.** Headings use `text-balance`, paragraphs use
`text-pretty`. Numbers that change use `tabular-nums lining-nums`.

## Layout

- Content sits in a centred `max-w-6xl` column with `1rem` side padding, `1.5rem` from `sm` up.
- Marketing sections are full-width bands separated by a 2px edge, with `4rem` vertical padding (`5rem` from `sm`). Bands alternate page, tint and one full teal band.
- Card grids: one column on phones, two from `sm`, three or four from `lg`, gap `1rem` to `1.5rem`.
- The dashboard is a fixed sidebar plus content column; the sidebar becomes a drawer below `md`.
- Project detail, edit and submission views open as a right-hand slide panel over the list they came from.

## Elevation & Depth

Depth is the hard offset shadow, nothing else. No blur, no ambient shadow, no
tonal elevation.

### Shadow Vocabulary

Each step is `Npx Npx 0 0 var(--edge)`, exposed as a `shadow-hard-N` utility.

- **Chip** (`shadow-hard-2`): chips, stamps, the logo tile, board tokens.
- **Control** (`shadow-hard-3`): buttons, alerts, tooltips, focused inputs.
- **Card** (`shadow-hard-4`): cards, popovers, select menus.
- **Feature** (`shadow-hard-6`): hero panels, the spotlight card, the level board, hovered cards.
- **Moment** (`shadow-hard-8`): the celebration stamp and the hovered spotlight card.

### Named Rules

**The Press Rule.** A raised control travels into its own shadow when hovered
or pressed: it translates by the shadow offset and the shadow disappears.
Cards do the opposite on hover: they lift 2px and the shadow grows to Feature.

**The Edge Token Rule.** Outlines and shadows always resolve to `--edge`:
`border-edge`, `outline-edge`, `stroke-edge`, `shadow-hard-N`. Form controls
use `border-control`. These tokens switch with the theme, so they never need
a `dark:` twin. `brand-navy` as a class is only for ink on a brand fill
(`text-brand-navy`) and navy fills; text that flips with the theme is
`text-foreground`. Scrims behind panels and dialogs use `bg-overlay`.

## Shapes

- Outlines are 2px solid; 4px for the level board and the celebration stamp. 1px hairlines are only for dividers inside a surface.
- Radius scale from a `0.5rem` base: chips `sm`, small buttons `md`, buttons, inputs and cards `lg`, feature cards `xl`, hero panels `2xl`. Avatars, level medals and icon coins are full circles.
- Stamps and stickers are rotated 3 to 12 degrees. Structural surfaces are never rotated.
- Icons are Lucide outline icons at one stroke weight. Counters that show a state (likes, stars) are filled with their brand colour and outlined in the edge colour.

## Components

### Buttons

- **Shape:** `lg` radius, 2px outline, bold 0.875rem label, 36px tall (24, 32 and 40px sizes exist).
- **Primary:** primary fill, navy label, Control shadow.
- **Neutral / outline / secondary:** page or tint fill, same outline and shadow.
- **Ghost:** no outline until hover. **Link:** teal ink, underline on hover. **Destructive:** destructive outline and text.
- **Hover / active:** the Press Rule, 120ms. **Focus:** 3px solid ring in the ring colour (teal ink in light, sky in dark). **Disabled:** 50% opacity, no shadow, no travel.
- Marketing call to action: coral fill with navy label.

### Chips and stamps

- Uppercase Label type, `sm` radius, 2px outline, Chip shadow. Fill says what it is: yellow for featured or points, sky for info, green for done, coral for audience labels, white for neutral.
- Stamps (Featured, Top pick, 404) are chips rotated a few degrees that arrive with the stamp animation.

### Cards

- Card surface, `lg` radius, 2px outline, Card shadow, 1rem padding. Footers are separated by a 2px edge and a muted fill.
- Clickable cards lift and grow their shadow on hover; project cards also tilt 1 degree.
- Featured project cards use a pale yellow tint in light and the raised surface in dark.

### Inputs

- 36px tall, `lg` radius, 2px outline in the control edge colour, page fill.
- **Focus:** Control shadow appears; in dark the outline also switches to the ring colour.
- **Error:** destructive outline plus a soft destructive ring. **Disabled:** 50% opacity.
- Checkbox and switch follow the same outline; checked state uses the primary fill.

### Navigation

- Public header: sticky, page fill, 2px bottom edge, logo tile, text links that gain a yellow fill and outline on hover.
- Dashboard sidebar: the active item is a teal block with navy label, outline and Control shadow; others are muted text that gain an outline on hover.
- Category filters on `/projects` are the same pattern laid out as a wrap of pills.

### Signature components

- **Level board:** a snakes-and-ladders board that maps points to six levels. Ladders are yellow, tangled wires are coral and green, level squares take the level's fill.
- **Marquee:** a yellow band of category names between hero and content.
- **Celebration:** a yellow stamp with confetti for level-ups and publishing.
- **Empty state:** a bouncing teal icon coin, a title, one line of help and one action.

## Do's and Don'ts

### Do:

- **Do** put navy text on every brand fill, in both themes.
- **Do** give every solid object a 2px outline and a shadow from the vocabulary above.
- **Do** use `teal-ink` whenever teal is text, a link or a focus ring.
- **Do** use `text-muted-foreground` for secondary copy; it is tuned per theme.
- **Do** pair every colour signal with an icon or label (featured, liked, unread, error).
- **Do** build new screens from `src/components/ui` and check them on `/ui` in both themes.
- **Do** write for a ten-year-old: short, concrete, encouraging.

### Don't:

- **Don't** put white text on teal, coral, green, sky or yellow.
- **Don't** use blurred shadows, gradients, glass or glow.
- **Don't** dim brand fills in dark mode or draw light outlines on cards and buttons there.
- **Don't** use brand grey, plain teal, yellow or coral as a text or outline-icon colour on a light surface.
- **Don't** hard-code hex values or `bg-white` / `text-black` in components; use tokens.
- **Don't** introduce a new radius, border width or shadow offset.
- **Don't** rotate cards, forms or anything a student has to read or type into.
