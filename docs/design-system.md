# REY BD — design system

> Extracted from the shipped UI, not invented for it. Every value below is in use
> somewhere in `src/`. If you need a new value, add it here first and then use it —
> that is what keeps the pages looking like one site.
>
> The rules of engagement live in [`UI_UX_RULES.md`](../UI_UX_RULES.md); this file
> is the reference the rules point at.

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

No legacy palette survives in the markup: the `gold`, `rose`, `amber` and
`emerald` utilities were removed from source (`text-gold` ×37, `text-rose` ×13,
`amber` ×10, `emerald` ×2 became ink, surface and hairlines). The monochrome lock
stays as a safety net, not as the mechanism.

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
`@layer base`, with Playfair at weight 700. A page never sets a heading size
utility — it inherits the clamp, which is what keeps 48 pages consistent.

| Level | Clamp | At 390 / 1440 |
|---|---|---|
| `h1` | `clamp(2.25rem, 4.6vw, 3.5rem)` | 36 → 56px |
| `h2` | `clamp(1.75rem, 3vw, 2.375rem)` | 28 → 38px |
| `h3` | 1.3125rem | 21px |
| `h4` | 1.125rem | 18px |

| Token | Value | Use for |
|---|---|---|
| `text-nano` | 10px | Cover flags, badges |
| `text-micro` | 11px | Mono labels, table heads, `.label-mono` |
| `text-meta` | 12px | Meta lines, field hints, `.label` |
| `text-body-sm` | 14px | UI text, buttons, table cells |
| `text-body` | 15px | Long-form paragraphs (`.field` too) |
| `text-display` | 40px | The home hero on small screens |

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
| `--duration-fast` | 150ms | Hover colour / border / shadow, press |
| `--duration-base` | 200ms | Lifts, state changes, underlines, panels opening |
| `--duration-slow` | 500ms | Scroll reveals, image zoom, the route bar |
| `--ease-soft` | `cubic-bezier(0.16, 1, 0.3, 1)` | Things that move |
| `--ease-quick` | `cubic-bezier(0, 0, 0.2, 1)` | Things that change |

Feedback animations are tokens too — `--animate-fade-in`, `--animate-fade-up`
and `--animate-pop` (all 200ms, `both`) — so a component never hand-rolls a
keyframe. Reveals are opacity + transform only; never animate width or height.
Everything is disabled under `prefers-reduced-motion: reduce`.

Utilities: `Reveal` (fade-up on scroll), `CountUp` (figures), `ScrollElevation`
(header shadow), `BackToTop`.

---

## 7. Feedback: what answers a click

Every action answers within a frame or two. A person should never have to wonder
whether the site noticed.

| Moment | What answers it | Where |
|---|---|---|
| Hovering a control | 1px lift + deeper shadow (buttons); border darkens (fields, chips) | `.btn`, `.chip`, `.field` |
| Pressing a button | 1px push *past* zero + reduced shadow — it moves under the finger before anything else happens | `.btn:not(:disabled):active` |
| A link is clicked and the route is loading | A 2px ink hairline sweeps the top of the viewport. Delayed 120ms, so instant prefetched routes never flash a bar; gives up after 8s; never intercepts a pointer | `components/route-progress.tsx` |
| Being on a page | The link for the current page stays underlined, set in ink, and carries `aria-current="page"` | `components/nav-link.tsx`, `.nav-link[aria-current="page"]` |
| A panel opens | 200ms pop — opacity + 2% scale, from the corner it belongs to | `--animate-pop` |
| A menu or the search closes | Escape from anywhere, a click outside, or choosing an item; focus returns to the button that opened it; the page behind stops scrolling while search is open | `mobile-menu.tsx`, `search-overlay.tsx` |
| A form is submitted | The button shows a spinner and a present-tense label ("Signing in…"), disables itself, and sets `aria-busy` | `SubmitButton` |
| A form answers | The message fades up next to the form and is announced: `role="alert"` for errors, `role="status"` otherwise | `Alert` |
| Any `<details>` opens | Its content fades up, 200ms. One rule covers every disclosure in the app | `details[open] > summary ~ *` |
| A field is rejected | Ink border, mist fill, and the message beside it (`aria-invalid="true"`) — contrast carries it, never colour | `.field[aria-invalid="true"]` |
| A page is loading | A skeleton in the shape of the content that is coming, breathing at 1.6s | `.skeleton`, `app/**/loading.tsx` |
| The search is thinking | The magnifier becomes a spinner in place, results dim to 60%, and the list is marked `aria-busy` | `search-overlay.tsx` |

Rules: nothing loops except the spinner and the skeleton; nothing travels more
than 6px; each one is a one-shot `animation` with `both`, so the last frame
sticks rather than snapping back. Under `prefers-reduced-motion: reduce` all of
it stops — the spinner becomes a still ring, so "working" is still legible.

---

## 8. Depth

The interface is **hairline-first**: a surface is defined by its border, not by a
shadow. Shadow has three jobs only — the button you are about to press, the card
that lifts under the pointer, and the panel that floats above the page.

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | 1px, 3% ink | Static cards and panels — all but invisible |
| `--shadow-paper` | 2px + 36px soft | Overlays, drop-downs, the elevated header |
| `--shadow-lift` | 4px + 56px soft | Hover lift only |
| button shadows | — | Buttons always carry a shadow, and a deeper one on hover |

---

## 9. Components

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
| `.pill` | Square flag (`rounded-field`), uppercase mono, inset 1px ring | tone fills: `good` (ink), `progress` (white), `problem` (frost), `neutral` (surface) | — | — |
| `.table` | Hairline rows under an ink rule, mono uppercase heads | row hover → `mist` | — | — |
| `.label-mono` / `.eyebrow` | mono, uppercase, 0.12em tracking | — | — | — |
| `.section-rule` | ink top rule + mono label + flexible hairline | — | — | — |
| `EmptyState` | a ruled statement: hairline, display title, description, optional action — never dashed | — | — | — |
| `Stat` | a figure under an ink rule — mono label, display number, meta hint — never a boxed card | — | — | — |
| Side navigation | hairline index at `lg`, underline tabs below it; the current page carries an ink rule and `aria-current="page"` | — | — | — |
| `Alert` | info (surface), success (white + ink border), warning (surface + ink border), **error (ink fill, white text)** | — | — | — |
| `Money` | currency mark at 0.62em so the ৳ fallback matches the figures | — | — | — |

Cover images always render through `BookCoverImage`, which keeps a placeholder
underneath, so a missing *or* broken image shows the house mark rather than a gap.

### Responsive behaviour

Two breakpoints do the structural work: `md` (768px) and `lg` (1024px).

| Below | What changes | Why |
|---|---|---|
| `lg` | The header's nav links move into the Menu disclosure, which already carries the account links and the CTA — so the bar is logo + search + Menu. | Six links plus three buttons do not fit beside a logo at 768px; they pushed 41px of the page off-screen. |
| `md` | **Tables become cards.** Each row becomes a card, the first cell is its heading, and `TableLabels` copies each column heading onto its cells as `data-label`, which the card prints in mono beside the value. Controls move to their own full-width row at the bottom. | A data table at 390px either wraps to one word per line or hides its action column off-screen. Neither is usable one-handed. |
| `md` | Stat rows go two-up instead of one tall card per row. | Keeps the numbers on screen without scrolling past four cards. |
| always | Any grid or flex child holding a horizontally scrolling rail carries `min-w-0`. | Without it the rail's min-content width — 691px for the account nav — silently becomes the width of the page. This is the most common mobile overflow in the app. |

The `.table` card rules live in `globals.css` under "Tables on a phone";
`src/components/table-labels.tsx` supplies the labels and degrades to unlabelled
but readable cards without JavaScript.

---

## 10. Interaction rules

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

## 11. Verifying a change

```bash
npm run lint && npm run build          # types + lint
node .claude/skills/design-system/scripts/validate-tokens.cjs --dir src   # hardcoded values
npm run audit:responsive               # every page at 1440 / 1024 / 768 / 390
npm run audit:responsive -- --shots    # …and a full-page screenshot of each
```

The responsive audit starts a headless Edge/Chrome (set `AUDIT_BROWSER` to point
at another), signs in when `AUDIT_EMAIL`/`AUDIT_PASSWORD` are set, and writes
`.audit/report.json`. It fails loudly on page-level horizontal overflow, content
clipped beyond reach, elements past the viewport edge, targets under 24px, and
tables that only work sideways. All four must be zero.

Measured checks worth repeating after UI work:

1. **Class census** — radii, type sizes and durations should resolve to the tokens
   above and nothing else.
2. **Monochrome** — every element's background and text colour must have RGB channel
   spread ≤ 12 (excluding images).
3. **Accessibility** — run Lighthouse per page; target 1.0. `ink-muted` on `paper`
   is the tightest pair at 5.0:1.
4. **Screenshot** the page at desktop width before calling it done.
5. **Feedback** — click a link (the bar runs), submit a form (the button spins and
   the answer is announced), open a menu (it pops, closes on Escape, and returns
   focus to where it came from). None of it should be noticeable until you look
   for it.

Known deliberate exceptions: `global-error.tsx` uses inline hex values because it
renders outside the root layout and cannot rely on this stylesheet.
