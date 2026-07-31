# 007 — Add semantic elevation and scrim tokens

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: HIGH
- **Category**: Dark mode / Materials & depth
- **Estimated scope**: 6 files, about 65 lines

## Problem

Elevation and dimming are derived from `--foreground`:

```css
/* app/globals.css:198 — current */
.apple-card {
  box-shadow:
    0 1px 0 color-mix(in oklch, white 72%, transparent) inset,
    0 1rem 2.8rem color-mix(in oklch, var(--foreground) 8%, transparent);
}
```

```css
/* app/globals.css:427 — current */
.apple-dialog-backdrop {
  background: color-mix(in oklch, var(--foreground) 42%, transparent);
}

/* app/globals.css:448 — current */
.apple-dialog-surface {
  box-shadow:
    0 0.0625rem 0 color-mix(in oklch, white 42%, transparent) inset,
    0 2rem 6rem color-mix(in oklch, var(--foreground) 24%, transparent);
}
```

In dark mode `--foreground` is near-white, so elevation becomes a pale glow and
scrims become white veils. Three raw dialogs and the mobile drawer repeat the same
problem through Tailwind:

```tsx
/* app/security/page.tsx:84 — current */
<div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
```

```tsx
/* app/admin/AdminNavigationShell.tsx:226 — current */
className="app-mobile-nav-backdrop absolute inset-0 bg-foreground/40"
```

## Target

Add explicit material tokens:

```css
:root {
  --material-highlight: oklch(1 0 0 / 70%);
  --shadow-low: oklch(0.1 0.01 165 / 8%);
  --shadow-mid: oklch(0.1 0.01 165 / 14%);
  --shadow-high: oklch(0.08 0.01 165 / 24%);
  --scrim: oklch(0.08 0.01 165 / 48%);
}

.dark {
  --material-highlight: oklch(1 0 0 / 8%);
  --shadow-low: oklch(0.04 0.006 165 / 28%);
  --shadow-mid: oklch(0.035 0.006 165 / 40%);
  --shadow-high: oklch(0.025 0.004 165 / 60%);
  --scrim: oklch(0.02 0.004 165 / 72%);
}
```

Expose `--color-scrim: var(--scrim)` in `@theme inline`. Use the highlight token
for one-pixel material edges, the three shadow levels for elevation, and
`var(--scrim)`/`bg-scrim` for every blocking backdrop.

## Repo conventions to follow

- Semantic colors are mapped into Tailwind through `@theme inline`.
- Shared materials live in `app/globals.css`.
- QR containers in `app/visitor-pass/page.tsx` and
  `app/residents/access-code/page.tsx` intentionally remain white for scanner
  reliability and are exempt.

## Steps

1. Execute plan 006 first.
2. Add the five exact material tokens above to `:root` and `.dark`.
3. Map `--color-scrim: var(--scrim)` in `@theme inline`.
4. Replace generic surface inset highlights in `.apple-card`, `.apple-input`,
   active navigation, dialog surface, and card hover with
   `var(--material-highlight)`. Brand-mark highlights may remain bespoke.
5. Replace card and input focus ambient shadows with `var(--shadow-low)`.
6. Replace sidebar, toolbar, bottom navigation, and hover elevation shadows with
   `var(--shadow-mid)`.
7. Replace the dialog surface shadow with `var(--shadow-high)`.
8. Change `.apple-dialog-backdrop` and `.app-mobile-nav-backdrop` background to
   `var(--scrim)`.
9. Remove `bg-foreground/40` from the mobile backdrop in
   `app/admin/AdminNavigationShell.tsx`.
10. Replace `bg-foreground/50` with `bg-scrim` in:
    - `app/admin/visitor-history/page.tsx`
    - `app/security/page.tsx`
    - `app/security/components/VisitorDetailsModal.tsx`
11. Search `app` for `bg-foreground/` on fixed overlays; no blocking backdrop may
    derive from foreground.

## Boundaries

- Do NOT change text `--foreground` or `--muted-foreground`.
- Do NOT change QR white backgrounds.
- Do NOT animate shadow tokens.
- Do NOT change non-blocking translucent panels into scrims.
- Do NOT change dialog state logic; plans 003 and 005 own motion/presence.
- If plan 005 has already removed a raw overlay, apply `bg-scrim` to its surviving
  shared backdrop only and do not recreate markup.

## Verification

- **Mechanical**: run
  `rg -n "fixed inset-0.*bg-foreground|var\\(--foreground\\).*(8%|24%|42%)" app`;
  expect no elevation/scrim matches. Run `npm.cmd run lint` and
  `npm.cmd run build`; both must exit 0.
- **Feel check**:
  - In dark mode, open every dialog and the mobile drawer.
  - Background content must recede under a dark neutral scrim, never wash out
    under white.
  - Cards and dialogs must cast dark occlusion shadows without halos.
  - Inspect one-pixel top edges at 200% zoom; they should be subtle in dark mode,
    not chalk-white.
  - Confirm light mode still has gentle elevation.
- **Done when**: elevation and dimming remain semantically dark in both themes.
