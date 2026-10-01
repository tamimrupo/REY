# REY BD — design system

> Extracted from the shipped UI, not invented for it. Every value below is in use
> somewhere in `src/`. If you need a new value, add it here first and then use it —
> that is what keeps the pages looking like one site.

---

## 1. Principles

1. **Monochrome, always.** No hue anywhere: not in tokens, not in charts, not in
   status. Meaning is carried by contrast and fill, never by colour. A
   "monochrome lock" in `@theme` remaps every Tailwind colour family to greys so a
   stray `text-rose-600` renders black.
2. **Printed-catalogue voice.** Hairline rules, machine-set mono labels, numbered
   sections. The site should read like a well-set index, not a landing page.
3. **Two typefaces, one job each.** Playfair Display for display headings; Inter for
   the interface. The system mono is used for labels and figures.
4. **Motion only with meaning**, and never for someone who asked for less.
5. **Every interactive element** has a ≥24px target, a visible focus ring, and hover
   *and* active states.

---

## 2. Colour

Measured with the WCAG formula against `paper` (white). Ratios in brackets are for
the tinted panels (`surface` / `cream`).

| Token | Value | Contrast | Use for |
|---|---|---|---|
| `ink` | `#090909` | 19.9:1 | Body text, headings, primary fills |
| `ink-soft` | `#525252` | 7.8:1 | Secondary copy, eyebrows |
| `ink-muted` | `#6f6f6f` | 5.0:1 (4.6:1) | Meta lines, hints, table heads |
| `paper` | `#ffffff` | — | Page background |
| `surface` | `#f5f5f5` | — | Quiet panels, table headers |
| `mist` / `frost` | `#fafafa` / `#ececec` | — | Placeholder gradients, skeletons |
| `line` | `#e5e5e5` | — | Borders *inside* components |
| `ink` (as border) | `#090909` | — | Section rules and dividers |
| `cream` | `#f5f5f5` | — | Alternating section bands |

**Rule of thumb:** `line` separates things *within* a component; `border-ink` marks
structural dividers between sections. Never lower `ink-muted` any further.

---

## 3. Radius

Three radii, plus circles. Nothing else.

| Token | Value | Applies to |
|---|---|---|
| `rounded-field` | 2px | Inputs, selects, chips |
| `rounded-btn` | 4px | Buttons |
| `rounded-card` | 6px | Cards, covers, panels, result rows |
| `rounded-full` | pill | Status pills, avatars, the back-to-top button |

Shadows are **not** a substitute for radius. A card is `rounded-card border
border-line`, not a rounded shadow box.

---

## 4. Type

Roles, not sizes. Body copy is 16px (browser base); headings use the clamps in
`@layer base` (`h1` up to 5rem, `h2` to 3rem), with Playfair at weight 700.

| Token | Value | Use for |
|---|---|---|
| `text-nano` | 10px | Cover flags, badges |
| `text-micro` | 11px | Mono labels, table heads, `.label-mono` |
| `text-meta` | 12px | Meta lines, field hints, `.label` |
| `text-body-sm` | 14px | UI text, buttons, table cells |
| `text-body` | 15px | Long-form paragraphs (`.field` too) |
| `text-display` | 40px | Hero headline on small screens |

Labels are uppercase with wide tracking; body copy never is. Never let a paragraph
run wider than `max-w-xl` (≈65 characters). Left text columns in a split layout are
capped at `max-w-[42rem]` so they cannot slide under an adjacent image.

---

## 5. Spacing rhythm

| Context | Value |
|---|---|
| Page gutter | `container-page` (max 76rem, 1.5rem inline) |
| Section padding | `py-16` standard, `py-20` for hero-scale sections, `py-12` for mastheads |
| Card padding | `p-6` (dense: `p-5`, wide: `p-7`) |
| Control padding | `.btn` 13px/24px, `.btn-sm` 8px/14px |
| Between cards | `gap-6`; between tight chips `gap-2` |
| Label → value | `mt-1` / `mt-2`; heading → body `mt-4` / `mt-5` |

Vertical space separates; do not add borders *and* big gaps for the same job.

---

## 6. Motion

| Token | Value | Use for |
|---|---|---|
| `--duration-fast` | 150ms | Hover colour / border / shadow |
| `--duration-base` | 200ms | Lifts, state changes, underlines |
| `--duration-slow` | 500ms | Scroll reveals, image zoom |

Easing is `cubic-bezier(0.16, 1, 0.3, 1)` for movement and `cubic-bezier(0, 0, 0.2, 1)`
for colour. Reveals are opacity + transform only — never animate width or height.
Everything is disabled under `prefers-reduced-motion: reduce`.

Utilities: `Reveal` (fade-up on scroll), `CountUp` (figures), `ScrollElevation`
(header shadow), `BackToTop`.

---

## 7. Shadows

| Token | Use |
|---|---|
| `--shadow-card` | Flat cards, barely there |
| `--shadow-paper` | Raised panels |
| `--shadow-lift` | Hover lift on cards |
| button shadows | `.btn-primary` / `.btn-outline` / `.btn-invert` — buttons always carry shadow |

---

## 8. Components

| Component | Default | Hover | Active | Disabled |
|---|---|---|---|---|
| `.btn-primary` | ink fill, white text, shadow | 1px lift, deeper shadow | lift removed | 45% opacity, no shadow |
| `.btn-outline` | white fill, `line` border | ink border, 1px lift | lift removed | 45% opacity |
| `.btn-ghost` | no fill, `ink-soft` text | `surface` fill, ink text | — | 45% opacity |
| `.btn-invert` / `.btn-on-dark` | for ink panels only | 1px lift / 8% white wash | lift removed | 45% opacity |
| `.field` | 1px `line`, `rounded-field` | — | — | — |
| `.field:focus` | ink border + 3px 8% ink ring | — | — | — |
| `.chip` | rectangle, `line` border | ink border | `data-active="true"` → ink fill | — |
| `.card` | white, `line` border, `rounded-card`, `--shadow-card` | `lift` adds `--shadow-lift` | — | — |
| `.pill` | full radius, inset 1px ring | tone fills: `good` (ink), `progress` (white), `problem` (frost), `neutral` (surface) | — | — |
| `.table` | `surface` header, `line` row rules | row hover → `mist` | — | — |
| `.label-mono` / `.eyebrow` | mono, uppercase, 0.12em tracking | — | — | — |
| `.section-rule` | ink top rule + mono label + flexible hairline | — | — | — |
| `EmptyState` | dashed card, title, description, optional action | — | — | — |
| `Alert` | info (surface), success (white + ink border), warning (surface + ink border), **error (ink fill, white text)** | — | — | — |
| `Money` | currency mark at 0.62em so the ৳ fallback matches the figures | — | — | — |

Cover images always render through `BookCoverImage`, which keeps a placeholder
underneath, so a missing *or* broken image shows the house mark rather than a gap.

---

## 9. Interaction rules

- Focus: `:focus-visible` draws a 2px `currentColor` ring, 2px offset — legible on
  white and on ink.
- Targets: ≥24×24 CSS px. Inline links inside a sentence are exempt; standalone
  links are not.
- Tap feedback: never rely on hover alone.
- Loading: route-level `loading.tsx` skeletons for the storefront and dashboard;
  buttons show a pending label via `SubmitButton`.
- Errors: route-level `error.tsx` boundaries with a retry and an error digest;
  field errors sit next to the field.
- Empty: `EmptyState` on every list that can be empty (20 surfaces), with the next
  action when one exists.

---

## 10. Verifying a change

```bash
npm run lint && npm run build          # types + lint
node .claude/skills/design-system/scripts/validate-tokens.cjs --dir src   # hardcoded values
```

Measured checks worth repeating after UI work:

1. **Class census** — radii, type sizes and durations should resolve to the tokens
   above and nothing else.
2. **Monochrome** — every element's background and text colour must have RGB channel
   spread ≤ 12 (excluding images).
3. **Accessibility** — run Lighthouse per page; target 1.0. `ink-muted` on `paper`
   is the tightest pair at 5.0:1.
4. **Screenshot** the page at desktop width before calling it done.

Known deliberate exceptions: `global-error.tsx` uses inline hex values because it
renders outside the root layout and cannot rely on this stylesheet.
