# UI/UX Rules

These are permanent. They describe how REY BD behaves, not how it might look on
a good day. `docs/design-system.md` holds the *values* — tokens, contrast
ratios, component specs. This file holds the *rules*. Where a mock-up and a rule
disagree, the rule wins; where a rule must change, change it here in the same
commit that breaks it.

---

## General

- **Keep the interface clean and modern.** The reference point is a well-set
  printed catalogue: hairlines, machine-set mono labels, generous margins, one
  accent — ink.
- **Prioritize usability over decoration.** A visual device earns its place by
  helping someone find, choose, read or act. If it does not, delete it.
- **Never introduce unnecessary visual elements.** No decorative icons, no
  badges that repeat what the row already says, no motion that is not feedback.
  Every extra mark competes with the books.
- **Preserve existing brand identity.** Monochrome, always: no hue anywhere —
  not in statuses, charts, illustrations, hover states or error states. Ink
  `#090909` on paper `#ffffff`. The monochrome lock in `@theme` remaps every
  Tailwind colour family to greys; that is a safety net, not permission.
- **Two typefaces, one job each.** Playfair Display for display headings, Inter
  for the interface, the system mono for labels and figures.
- **Money and dates go through the shared components** (`Money`, `formatDate`,
  `money`) — never a hand-written `৳` or a hand-rolled date string.

---

## Typography

- **Use a consistent type scale.** Roles, not sizes: `text-nano` 10 ·
  `text-micro` 11 · `text-meta` 12 · `text-body-sm` 14 · `text-body` 15 ·
  `text-display` 40, plus the `h1`–`h4` clamps. Arbitrary sizes
  (`text-[13px]`) are a defect.
- **Clear distinction between headings, labels and body text.** Headings are
  Playfair 700 · labels are uppercase mono 11px with `0.12em` tracking
  (`.label-mono`, `.eyebrow`) · body is Inter at the browser base size.
- **Labels are uppercase and tracked. Body copy never is.** Emphasis in prose
  comes from weight or a rule, never from capitals or italics.
- **Avoid excessive font weights.** Only 400/500/600/700 are in use. Never bold
  a paragraph to make it noticed — that is what headings are for.
- **Keep the measure readable.** Prose caps around 65 characters
  (`max-w-xl`); a text column beside an image caps at `max-w-[42rem]`.
- **Check headings at 390px.** A heading that wraps to one word per line, or a
  clause left stranded on its own line, is a bug — shorten it or step the size
  down.

---

## Spacing

- **Use consistent spacing throughout.** Section padding `py-16` (`py-20` for
  hero-scale bands, `py-12` for mastheads) · card padding `p-6` (`p-4`/`p-5` for
  stats and dense rows) · control padding from `.btn` · grids `gap-6`, chips
  `gap-2`. Nothing invents its own value.
- **Avoid cramped cards and forms.** A label sits `0.375rem` above its field;
  fields are full width; a row of controls wraps rather than shrinking. On a
  phone, stat rows go two-up and stat padding drops to `p-4` — but a card never
  becomes a squeeze.
- **Maintain generous whitespace around major sections.** Page gutter is
  `container-page` (max 76rem, 1.5rem inline). Two sections never touch without
  either a rule or at least 48px between them.
- **Vertical space separates; ink rules divide.** `line` separates things
  *inside* a component; `border-ink` marks structural divisions *between*
  sections. Never both for the same job.

---

## Components

- **Buttons must have consistent height, radius and states.** Only the `.btn`
  variants: primary, outline, ghost, invert, on-dark, `btn-sm`. Radius 4px,
  transitions 150ms, one press state (1px down), a disabled state, and a shadow
  on every button — including on hover. Never strip the shadow to look "flat".
- **Depth is a signal, not decoration.** Buttons carry shadows; cards stay flat
  with hairlines and `--shadow-card`.
- **Forms must have clear labels and validation feedback.** A real `<label>`
  (visible, or `sr-only` when the design truly needs it) — never a placeholder
  standing in for one. Rejected fields take `aria-invalid="true"`, which draws
  the ink border and mist fill, and the message explains the fix.
- **Cards should follow one consistent visual system.** White, 1px `line`,
  `rounded-card` (6px), `--shadow-card`; `.lift` when the whole card is a link.
- **Tables are `.table` inside `.table-wrap`.** Below `md` they become cards
  (see Responsive). Never squeeze a table into the viewport, and never leave its
  action column off-screen.
- **Status is carried by fill and contrast** (`.pill` tones), never by hue.
- **Every empty, loading and error state is designed.** `EmptyState`,
  `loading.tsx`, `error.tsx` — a blank panel is not an acceptable answer to "no
  data yet".

---

## Interaction

- **Every interactive element needs hover, focus, active and disabled states** —
  links included. Standalone targets are at least 24×24px at every width; links
  inside a sentence are the only exception.
- **Async actions need loading feedback.** A submit shows a spinner, a
  present-tense label ("Signing in…") and `aria-busy`; a row action shows a
  pending state; a route change runs the top progress bar. A control that looks
  idle while it works is a bug.
- **Successful actions need confirmation.** A live-region message or a visible
  state change — never silence. A row that simply vanishes is not confirmation.
- **Errors should explain what went wrong and how to fix it.** Sentence case,
  next to the thing that failed, `role="alert"`. Never a bare "Error", never a
  code without words.
- **Menus and overlays open with a 200ms pop and close on Escape, on an outside
  click and on selection.** They trap focus, return focus to what opened them,
  and lock the page behind them.
- **Motion is feedback, so it is short and one-shot.** Only the 150/200/500ms
  tokens; nothing travels more than 6px without a reason. Nothing repeats except
  spinner and skeleton pulses and the one carousel that advances on a timer —
  and that carousel pauses on hover and focus, has a visible pause control, and
  never starts under `prefers-reduced-motion`. When motion is reduced, all of it
  stops — a spinner holds still as a full ring so "working" is still legible.

---

## Responsive

- **Mobile is not an afterthought.** Design the 390px layout first; it is where
  the books are browsed.
- **Check 390, 768, 1024 and 1440.** All four, every time:
  `npm run audit:responsive`.
- **Avoid horizontal overflow — always.** A page must never scroll sideways. Any
  grid or flex child holding a scrolling rail carries `min-w-0`; without it the
  rail's min-content width becomes the page width.
- **Do not simply stack.** Breakpoints carry structure, not just order:
  below `lg` the header nav moves into the Menu; below `md` tables become
  labelled cards and stat rows go two-up. A table, nav or stat row that has
  merely been stacked is unfinished work.
- **Touch first.** Primary actions reach comfortable size; nothing that matters
  depends on hover; nothing depends on a tooltip.

---

## Accessibility

- **Maintain keyboard accessibility.** Everything reachable in order, everything
  operable by keyboard, focus never lost behind an overlay.
- **Provide visible focus states.** A 2px `currentColor` ring at 2px offset,
  legible on paper and on ink. Never `outline: none` without a replacement.
- **Maintain sufficient contrast.** `ink` 19.9:1, `ink-soft` 7.8:1, `ink-muted`
  5.0:1 on paper. `ink-muted` is the floor — placeholder text is decorative and
  never carries meaning on its own.
- **Use semantic HTML.** One `<main>`, one `<h1>` per page, real `<button>` and
  `<a>` elements, labelled `<nav>`s, `aria-current="page"` for the current page,
  breadcrumbs marked as such, tables with `<thead>`/`<th>`.
- **Announce change.** `role="alert"` for errors, `role="status"` for
  successes, `aria-busy` while working, `aria-expanded`/`aria-controls` for
  disclosures.
- **Images carry a purpose.** Real alt text, or `aria-hidden` when decorative.
  Book covers render through `BookCoverImage`, so a missing image shows the
  house mark rather than a gap.
- **Never rely on colour alone** (monochrome makes this structural) **or on
  hover alone** (touch has none).

---

## Enforcement

Before calling UI work done:

```bash
npm run lint && npm run build
node .claude/skills/design-system/scripts/validate-tokens.cjs --dir src
npm run audit:responsive          # add --shots to review the layout visually
```

The audit must report **0** page overflow, **0** clipped content, **0** elements
outside the viewport and **0** targets under 24px. Then load the page and
measure: no colour channel spread above 12, cards at 6px radius, labels at 11px.
Lighthouse accessibility stays at 1.0.
