# 001 — Normalize motion tokens and high-frequency feedback

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: HIGH
- **Category**: Easing & duration / Physicality / Cohesion
- **Estimated scope**: 1 file, about 70 lines

## Problem

High-frequency controls use unrelated timings, and press recovery is substantially
slower than the press itself:

```css
/* app/globals.css:188 — current */
:where(button, a[href], [role="button"]):not(:disabled):active {
  transform: scale(0.975);
  transition: transform 90ms ease-out;
}
```

```css
/* app/globals.css:207 — current */
.apple-card {
  position: relative;
  transition:
    border-color 220ms ease,
    box-shadow 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

```css
/* app/globals.css:264 — current */
.apple-primary-button,
.apple-secondary-button,
.apple-icon-button {
  transition:
    color 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 260ms ease,
    transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

The active selector stops matching on release, so Apple controls compress in 90ms
but recover through the 320ms base transition. Interactive cards also animate
paint-bound shadows and lift on every hover:

```css
/* app/globals.css:528 — current */
@media (hover: hover) {
  .apple-card[data-interactive="true"]:hover,
  a.apple-card:hover {
    border-color: color-mix(in oklch, var(--primary) 35%, var(--border));
    box-shadow:
      0 1px 0 color-mix(in oklch, white 72%, transparent) inset,
      0 1.35rem 3.25rem color-mix(in oklch, var(--foreground) 11%, transparent);
    transform: translateY(-0.125rem);
  }
}
```

## Target

Create a single motion vocabulary in `:root`:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
--duration-press: 160ms;
--duration-release: 100ms;
--duration-fast: 150ms;
--duration-dialog: 250ms;
--duration-drawer: 300ms;
```

Use `scale(0.97)` with `160ms var(--ease-out)` while pressed and a faster
`100ms var(--ease-out)` recovery. Remove transform and box-shadow animation from
routine card/button hover. Keep only color, background, and border feedback at
`150ms ease`.

Gate hover-only styling with both capabilities:

```css
@media (hover: hover) and (pointer: fine) { /* hover feedback */ }
```

The mobile drawer must use `300ms var(--ease-drawer)` for movement and
`200ms var(--ease-out)` for backdrop opacity.

## Repo conventions to follow

- Shared visual tokens already live in `:root` and `.dark` in `app/globals.css`.
- Shared primitives use semantic classes such as `.apple-card`,
  `.apple-primary-button`, `.app-nav-link`, and `.app-mobile-nav-panel`.
- Continue animating only shared classes; do not add page-local duration values.

## Steps

1. In `app/globals.css`, add all seven motion tokens above to `:root`.
2. Change the global active rule to `scale(0.97)` and
   `transition: transform var(--duration-press) var(--ease-out)`.
3. Change `.apple-card[data-interactive="true"]:active` from `scale(0.985)` to
   `scale(0.97)`.
4. On `.apple-card`, remove `box-shadow` from the transition list. Use
   `border-color var(--duration-fast) ease` and
   `transform var(--duration-release) var(--ease-out)`.
5. On `.apple-primary-button`, `.apple-secondary-button`, and
   `.apple-icon-button`, remove `box-shadow` from the transition list. Use
   `var(--duration-fast) ease` for color/background/border and
   `var(--duration-release) var(--ease-out)` for transform.
6. On `.app-nav-link` and `.app-tab-link`, remove animated box-shadow and use the
   same fast color/background and release-transform timings.
7. Replace `@media (hover: hover)` with
   `@media (hover: hover) and (pointer: fine)`.
8. Remove hover `translateY(...)` and hover shadow changes from interactive cards
   and primary buttons. Preserve card border feedback and button background-color
   feedback only.
9. Change the drawer panel to
   `transition: transform var(--duration-drawer) var(--ease-drawer)`, its backdrop
   to `opacity 200ms var(--ease-out)`, and its delayed visibility to
   `var(--duration-drawer)`.

## Boundaries

- Do NOT introduce a motion dependency.
- Do NOT animate `box-shadow`, `filter`, layout properties, or CSS variables.
- Do NOT add bounce to buttons, navigation, or cards.
- Do NOT change drawer markup or state logic.
- Do NOT modify route entrances or dialogs; plans 002 and 003 own those areas.
- If the cited selectors no longer match commit `022634b`, STOP and report drift.

## Verification

- **Mechanical**: run `npm.cmd run lint`, `npm.cmd test`, and
  `npm.cmd run build`; all must exit 0.
- **Feel check**:
  - Press and hold primary, secondary, and icon buttons. Compression must be
    visible but restrained at `0.97`.
  - Release each control. Recovery must snap faster than the press.
  - Sweep repeatedly across dashboard cards. Borders may respond, but cards must
    not bob vertically or animate shadows.
  - Open and reverse the mobile drawer mid-transition. It must continue from its
    current on-screen position.
  - In DevTools at 10% playback, confirm no routine hover animates paint-bound
    shadows.
- **Done when**: all shared motion values reference tokens, press recovery no
  longer trails input, and frequent hover is visually quiet.
