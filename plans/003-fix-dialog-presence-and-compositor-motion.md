# 003 — Fix dialog presence timing and compositor motion

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: MEDIUM
- **Category**: Interruptibility / Performance / Easing
- **Estimated scope**: 2 files, about 35 lines

## Problem

React removes dialogs before their longest CSS exit completes:

```tsx
/* app/components/ui/AnimatedDialog.tsx:14 — current */
const EXIT_DURATION_MS = 280;
```

```css
/* app/globals.css:457 — current */
.apple-dialog-surface {
  transition:
    opacity 190ms ease,
    filter 260ms ease,
    transform 360ms cubic-bezier(0.2, 0.88, 0.2, 1);
}
```

The 360ms transform is cut off at 280ms. The dialog also animates paint-bound
`filter` and `backdrop-filter`:

```css
/* app/globals.css:427 — current */
.apple-dialog-backdrop {
  -webkit-backdrop-filter: blur(0);
  backdrop-filter: blur(0);
  transition:
    opacity 220ms ease,
    backdrop-filter 280ms ease;
}

/* app/globals.css:451 — current */
.apple-dialog-surface {
  opacity: 0;
  filter: blur(0.4rem);
  transform: translate3d(0, 0.75rem, 0) scale(0.97);
}
```

## Target

Use transform and opacity as the only animated properties:

```css
.apple-dialog-backdrop {
  opacity: 0;
  -webkit-backdrop-filter: blur(0.35rem);
  backdrop-filter: blur(0.35rem);
  transition: opacity 200ms var(--ease-out);
}

.apple-dialog-surface {
  opacity: 0;
  transform: translate3d(0, 0.75rem, 0) scale(0.97);
  transition:
    opacity 200ms var(--ease-out),
    transform var(--duration-dialog) var(--ease-out);
}
```

`--duration-dialog` is `250ms` from plan 001. Set
`EXIT_DURATION_MS = 250` so the component unmounts exactly when the longest exit
finishes. The static blur remains below 20px and materializes through backdrop
opacity instead of blur interpolation.

## Repo conventions to follow

- Use the `--ease-out` and `--duration-dialog` tokens from plan 001.
- Continue using `data-state="open|closed"` as the single visual state.
- Keep the existing two-frame mount sequence so CSS transitions have a rendered
  closed state before opening.

## Steps

1. Execute plan 001 first.
2. In `app/components/ui/AnimatedDialog.tsx`, change
   `EXIT_DURATION_MS` from `280` to `250`.
3. In `.apple-dialog-backdrop`, make `blur(0.35rem)` static in both states.
4. Remove `backdrop-filter` from the backdrop transition list; transition only
   opacity for `200ms var(--ease-out)`.
5. Remove `filter: blur(0.4rem)` from `.apple-dialog-surface`.
6. Remove `filter` from the surface transition list and remove
   `filter: blur(0)` from the open state.
7. Set surface opacity to `200ms var(--ease-out)` and transform to
   `var(--duration-dialog) var(--ease-out)`.
8. Leave `transform-origin: 50% 52%` unchanged; centered origin is correct for a
   modal.

## Boundaries

- Do NOT change modal content, focus behavior, Escape behavior, body scroll lock,
  or backdrop click behavior.
- Do NOT animate width, height, padding, top, left, filter, or backdrop-filter.
- Do NOT add spring or bounce behavior.
- Do NOT migrate additional modals here; plan 005 owns that work.
- If plan 001 tokens do not exist, STOP instead of duplicating values.

## Verification

- **Mechanical**: run `npm.cmd run lint`, `npm.cmd test`, and
  `npm.cmd run build`; all must exit 0.
- **Feel check**:
  - Open and close confirmation, success, and scanner dialogs repeatedly.
  - At 10% playback, the surface must remain present through the final exit frame.
  - Reverse open/close quickly; CSS must retarget from the current transform and
    opacity without a jump.
  - In the Performance panel, confirm dialog animation changes transform and
    opacity only; no filter animation should appear.
  - Confirm the static backdrop blur is already present while its opacity changes.
- **Done when**: exits finish before unmount, and dialog animation is compositor
  friendly.
