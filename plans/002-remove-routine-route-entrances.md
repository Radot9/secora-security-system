# 002 — Remove routine dashboard route entrances

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: HIGH
- **Category**: Purpose & frequency / Interruptibility
- **Estimated scope**: 1 file, remove about 20 lines

## Problem

Every routed `<main>` replays a 420ms keyframe:

```css
/* app/globals.css:551 — current */
@keyframes secora-materialize {
  from {
    opacity: 0;
    transform: translate3d(0, 0.6rem, 0) scale(0.995);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@media (prefers-reduced-motion: no-preference) {
  body > main,
  .admin-content > main,
  .resident-content > main {
    animation: secora-materialize 420ms cubic-bezier(0.2, 0.82, 0.2, 1) both;
  }
}
```

`AppShell` renders each page as a new `<main>`:

```tsx
/* app/components/ui/AppShell.tsx:25 — current */
return (
  <main className={`${residentSidebar ? "resident-shell" : "min-h-screen bg-background px-4 py-10 text-foreground"} ${className}`}>
```

Routine dashboard navigation happens tens of times per day, so the long decorative
entry delays scanning. Keyframes also restart from their `from` state instead of
retargeting when navigation is repeated quickly.

## Target

Dashboard and authentication routes render immediately with no whole-page opacity,
translation, or scale animation. Remove the global `secora-materialize` keyframe
and its route selector completely.

Local overlays, drawers, loading indicators, and dialog transitions are unaffected.

## Repo conventions to follow

- Route content is already mounted through `AppShell`; no transition wrapper exists.
- Component-level feedback remains in shared classes in `app/globals.css`.
- Plan 001 supplies the motion tokens used by remaining interactions.

## Steps

1. Delete `@keyframes secora-materialize` from `app/globals.css`.
2. Delete the entire
   `@media (prefers-reduced-motion: no-preference)` block that assigns the
   animation to `body > main`, `.admin-content > main`, and
   `.resident-content > main`.
3. Search for `secora-materialize`; the result must be empty.
4. Do not replace the animation with a CSS transition, View Transition API, or
   JavaScript route listener.

## Boundaries

- Do NOT alter page markup or navigation logic.
- Do NOT add login choreography in this plan.
- Do NOT remove modal, drawer, spinner, or press feedback.
- Do NOT add a motion library.
- If `secora-materialize` has new consumers beyond the cited selectors, STOP and
  report drift before deleting it.

## Verification

- **Mechanical**: run `rg -n "secora-materialize" app`; expect no results. Then run
  `npm.cmd run lint` and `npm.cmd run build`; both must exit 0.
- **Feel check**:
  - Navigate rapidly among three admin pages and three resident pages.
  - Confirm headers and content are immediately readable and never fade from
    `opacity: 0`.
  - In DevTools at 10% playback, route navigation must not create a whole-page
    animation entry.
  - Confirm dialogs and the mobile drawer still animate independently.
- **Done when**: all routine routes render without a global entrance animation.
