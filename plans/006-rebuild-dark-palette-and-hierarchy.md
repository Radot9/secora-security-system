# 006 — Rebuild the dark palette and material hierarchy

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: MEDIUM
- **Category**: Dark mode / Cohesion
- **Estimated scope**: 2 files, about 65 lines

## Problem

Dark mode uses strongly green-tinted, partially transparent base surfaces:

```css
/* app/globals.css:88 — current */
.dark {
  --background: oklch(0.15 0.014 165);
  --foreground: oklch(0.97 0.007 163);
  --card: oklch(0.215 0.018 165 / 86%);
  --popover: oklch(0.225 0.018 165 / 96%);
  --primary: oklch(0.72 0.15 159);
  --secondary: oklch(0.27 0.022 165);
  --muted: oklch(0.26 0.018 165);
  --accent: oklch(0.285 0.028 163);
  --sidebar: oklch(0.19 0.018 165 / 84%);
}
```

Those translucent tokens are mixed with transparency again:

```css
/* app/globals.css:281 — current */
.apple-secondary-button,
.apple-icon-button {
  background-color: color-mix(in oklch, var(--card) 72%, transparent);
}

/* app/globals.css:328 — current */
.app-sidebar {
  background: color-mix(in oklch, var(--sidebar) 92%, transparent);
}

/* app/globals.css:335 — current */
.app-toolbar {
  background: color-mix(in oklch, var(--card) 84%, transparent);
}
```

The repeated green tint and compounded transparency flatten the background, chrome,
cards, and controls. Toasts also remain light because Sonner defaults to `light`
when `theme` is omitted:

```tsx
/* app/layout.tsx:41 — current */
<Toaster position="bottom-right" richColors closeButton />
```

## Target

Use a neutral graphite foundation with green reserved for actions and status:

```css
.dark {
  --background: oklch(0.145 0.006 165);
  --foreground: oklch(0.94 0.008 160);
  --card: oklch(0.205 0.008 165 / 96%);
  --card-foreground: oklch(0.94 0.008 160);
  --popover: oklch(0.225 0.01 165 / 98%);
  --popover-foreground: oklch(0.94 0.008 160);
  --primary: oklch(0.68 0.13 159);
  --primary-foreground: oklch(0.12 0.02 165);
  --secondary: oklch(0.245 0.01 165);
  --secondary-foreground: oklch(0.94 0.008 160);
  --muted: oklch(0.235 0.008 165);
  --muted-foreground: oklch(0.68 0.018 163);
  --accent: oklch(0.265 0.016 163);
  --accent-foreground: oklch(0.94 0.008 160);
  --border: oklch(0.84 0.01 163 / 14%);
  --input: oklch(0.84 0.01 163 / 18%);
  --ring: oklch(0.68 0.13 159);
  --sidebar: oklch(0.175 0.007 165 / 98%);
  --sidebar-foreground: oklch(0.94 0.008 160);
  --sidebar-primary: oklch(0.68 0.13 159);
  --sidebar-primary-foreground: oklch(0.12 0.02 165);
  --sidebar-accent: oklch(0.245 0.014 163);
  --sidebar-accent-foreground: oklch(0.94 0.008 160);
  --sidebar-border: oklch(0.84 0.01 163 / 12%);
  --sidebar-ring: oklch(0.68 0.13 159);
  --chrome: oklch(0.185 0.008 165 / 96%);
  --control-surface: oklch(0.255 0.01 165 / 92%);
}
```

Add light equivalents:

```css
--chrome: oklch(0.995 0.004 163 / 82%);
--control-surface: oklch(1 0 0 / 72%);
```

Use `var(--chrome)` directly for toolbar and bottom navigation,
`var(--sidebar)` directly for the sidebar, and `var(--control-surface)` directly
for secondary/icon buttons and login feature tiles. Do not mix an already
translucent surface with `transparent` again.

Set Sonner to `theme="system"`.

## Repo conventions to follow

- Theme tokens live in `:root` and `.dark` in `app/globals.css`.
- The root script already mirrors `prefers-color-scheme` into the `.dark` class and
  `color-scheme`.
- Existing `bg-card`, `bg-background`, and semantic Tailwind utilities must keep
  working through the current token mapping.

## Steps

1. Replace the dark neutral, primary, border, and sidebar values with the exact
   target block above. Leave chart and destructive values unchanged; plans 008
   and 009 own semantic foregrounds.
2. Add `--chrome` and `--control-surface` to both `:root` and `.dark`.
3. Change `.app-sidebar` background to `var(--sidebar)`.
4. Change `.app-toolbar` and `.app-bottom-bar` backgrounds to `var(--chrome)`.
5. Change `.apple-secondary-button` and `.apple-icon-button` backgrounds to
   `var(--control-surface)`.
6. Change `.login-feature` background to `var(--control-surface)`.
7. Add a `.dark body` background-image override that reduces both primary radial
   gradients to 4% color mixing, preventing green fog over the graphite base.
8. In `app/layout.tsx`, change the Toaster to:

   ```tsx
   <Toaster theme="system" position="bottom-right" richColors closeButton />
   ```

9. Search for additional cases where `var(--card)` or `var(--sidebar)` is mixed
   with `transparent`; retain only cases that represent a deliberate overlay
   rather than a base surface.

## Boundaries

- Do NOT add a manual theme switcher or persistence setting.
- Do NOT change the light palette beyond the two new material tokens.
- Do NOT change status colors, QR white backgrounds, shadows, or scrims; plans 007
  and 009 own them.
- Do NOT remove backdrop blur.
- If root theme switching no longer follows system appearance, STOP and report
  drift.

## Verification

- **Mechanical**: run `npm.cmd run lint` and `npm.cmd run build`; both must exit 0.
- **Feel check**:
  - Inspect sign-in, admin, resident, and security pages in system dark mode at
    390px and 1440px widths.
  - Background, chrome, cards, and controls must be distinguishable without
    obvious green fog.
  - Green must read as an action/status color, not the neutral surface color.
  - Switch the operating-system appearance while a toast is visible; Sonner must
    follow the system theme.
  - Verify light mode is visually unchanged except for equivalent material
    semantics.
- **Done when**: dark mode has a neutral graphite hierarchy and all notifications
  follow system appearance.
