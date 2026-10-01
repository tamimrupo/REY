<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design system

Read `docs/design-system.md` before any UI work. It is extracted from the shipped
interface — it is not aspirational, and it is not a suggestion.

Non-negotiables:

- **Monochrome.** No hue anywhere, ever — not for status, not for charts, not for
  emphasis. The `@theme` block remaps every Tailwind colour family to greys so a
  stray `text-rose-600` renders black, but do not rely on that: use the tokens.
- **Buttons carry shadows.** Every button variant has one, including on hover.
- **Use the tokens, not ad-hoc values.** Radius is `rounded-field` (2px) /
  `rounded-btn` (4px) / `rounded-card` (6px) plus `rounded-full` for pills and
  avatars — nothing else. Type takes a role (`text-nano`, `text-micro`,
  `text-meta`, `text-body-sm`, `text-body`, `text-display`) — no `text-[13px]`.
  Motion is 150 / 200 / 500ms via `--duration-fast|base|slow`. Uppercase labels
  always use `.label-mono` or `tracking-[0.12em]`.
- **Section rules are black.** `line` separates things inside a component; ink
  borders mark structural divisions between sections.
- **Every action answers.** Controls take a press state, pending submits spin,
  results are announced (`role="alert"` / `role="status"`), navigation shows the
  route bar, and the current page is marked with `aria-current="page"`. Use the
  `--animate-*` tokens — never hand-roll a keyframe or a raw duration.

Verification before calling UI work done:

```bash
npm run lint && npm run build
node .claude/skills/design-system/scripts/validate-tokens.cjs --dir src
```

Then load the page and measure: no element may have a colour channel spread above
12, cards must measure 6px radius, labels 11px. Screenshot it before you claim it
looks right.
