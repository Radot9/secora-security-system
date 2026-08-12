# 004 — Repair reduced-motion feedback

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 2 files, about 55 lines

## Problem

Reduced-motion mode disables every animation and transition indiscriminately:

```css
/* app/globals.css:570 — current */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Transform endpoints still apply to press and hover selectors, so users receive
instantaneous scale/translation jumps while useful opacity and color feedback is
also removed. Dialog JavaScript unmounts immediately:

```tsx
/* app/components/ui/AnimatedDialog.tsx:39 — current */
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
unmountTimeout = window.setTimeout(
  () => setMounted(false),
  reducedMotion ? 0 : EXIT_DURATION_MS,
);
```

## Target

Remove the universal `0.01ms` rule. Reduced motion must remove position and scale
changes while preserving a `200ms` opacity crossfade for dialogs and drawer
backdrops and `150ms ease` color/background/border feedback for controls.

The target media query must explicitly:

- set active and hover transforms to `none`;
- set dialog and drawer panel transforms to `none`;
- retain dialog/backdrop opacity transitions at `200ms var(--ease-out)`;
- retain control color/background/border transitions at
  `var(--duration-fast) ease`;
- stop the small spinner rotation without hiding its visible ring;
- preserve `scroll-behavior: auto`.

Dialog reduced-motion unmount delay must be `200ms`, matching the crossfade.

## Repo conventions to follow

- Use motion tokens from plan 001.
- Use the compositor-only dialog structure from plan 003.
- Keep reduced-motion rules in the existing media block at the end of
  `app/globals.css`.

## Steps

1. Execute plans 001 and 003 first.
2. Remove the universal `*`, `*::before`, `*::after` duration override.
3. Inside `@media (prefers-reduced-motion: reduce)`, set these transform endpoints
   to `none`: global active controls, interactive active cards, hover cards,
   hover primary buttons, `.apple-dialog-surface`, and
   `.app-mobile-nav-panel`.
4. Set `.apple-dialog-surface` and `.apple-dialog-backdrop` to
   `transition: opacity 200ms var(--ease-out)`.
5. Set `.app-mobile-nav-panel` to `transition: none`; set
   `.app-mobile-nav-backdrop` to `transition: opacity 200ms var(--ease-out)`.
6. For Apple buttons, Apple cards, app navigation links, and app tabs, retain only
   color/background/border transitions at `var(--duration-fast) ease`.
7. Add `.animate-spin { animation: none; }` within the media query. Do not hide the
   spinner; its static incomplete ring plus adjacent loading copy remains status
   feedback.
8. Keep `html { scroll-behavior: auto; }` and the zero drawer visibility delay.
9. In `AnimatedDialog.tsx`, introduce
   `const REDUCED_MOTION_EXIT_DURATION_MS = 200` and use it instead of `0` for the
   reduced-motion unmount timeout.

## Boundaries

- Do NOT globally disable all animation or transition.
- Do NOT remove color, opacity, focus, loading, or status feedback.
- Do NOT add a dependency or media-query hook.
- Do NOT reintroduce page route motion removed by plan 002.
- If dialog timings differ from plan 003, STOP and reconcile before editing.

## Verification

- **Mechanical**: run `npm.cmd run lint`, `npm.cmd test`, and
  `npm.cmd run build`; all must exit 0.
- **Feel check**:
  - Emulate `prefers-reduced-motion: reduce` in DevTools.
  - Press buttons and cards: color may change, but no scale or translation may
    occur.
  - Open and close dialogs: they must crossfade for 200ms without scale, slide, or
    blur animation.
  - Open the mobile drawer: the panel may appear without travel, while the
    backdrop crossfades.
  - Confirm focus rings and loading text remain visible.
  - Disable reduced motion and confirm standard interactions still use plan 001
    and plan 003 motion.
- **Done when**: reduced-motion users retain clear state feedback with no moving
  surfaces or instantaneous transform jumps.
