# 009 — Replace light-only semantic surfaces

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: HIGH
- **Category**: Dark mode / Semantic color
- **Estimated scope**: 6 files, about 85 lines

## Problem

Warning and success surfaces are hard-coded to light Tailwind colors:

```tsx
/* app/admin/page.tsx:252 — current */
<Card className={watchItems.length > 0 ? "border-amber-300 bg-amber-50/70" : "border-emerald-300 bg-emerald-50/70"}>
```

```tsx
/* app/admin/super-admin/page.tsx:245 — current */
<Card className={riskItems.length > 0 ? "border-amber-300 bg-amber-50/70" : "border-emerald-300 bg-emerald-50/70"}>
```

```tsx
/* app/residents/page.tsx:248 — current */
<Card className={watchItems.length > 0 ? "border-amber-400 bg-amber-50" : "border-emerald-400 bg-emerald-50"}>
```

Resident warning rows add `bg-white`, and administrator badges remain
`bg-emerald-100 text-emerald-700`. These become bright islands in dark mode.
The intentionally white QR containers are unrelated and must remain white.

## Target

Add theme-aware semantic tokens:

```css
:root {
  --warning-surface: oklch(0.98 0.025 85);
  --warning-border: oklch(0.84 0.09 80);
  --warning-foreground: oklch(0.33 0.08 65);
  --success-surface: oklch(0.975 0.03 155);
  --success-border: oklch(0.82 0.08 155);
  --success-foreground: oklch(0.31 0.08 160);
}

.dark {
  --warning-surface: oklch(0.245 0.035 70);
  --warning-border: oklch(0.55 0.11 75);
  --warning-foreground: oklch(0.86 0.12 85);
  --success-surface: oklch(0.225 0.03 160);
  --success-border: oklch(0.5 0.08 160);
  --success-foreground: oklch(0.83 0.11 155);
}
```

Expose all six through `@theme inline` as:

```css
--color-warning-surface: var(--warning-surface);
--color-warning-border: var(--warning-border);
--color-warning-foreground: var(--warning-foreground);
--color-success-surface: var(--success-surface);
--color-success-border: var(--success-border);
--color-success-foreground: var(--success-foreground);
```

Consumers use semantic utilities such as
`border-warning-border bg-warning-surface text-warning-foreground` and
`border-success-border bg-success-surface text-success-foreground`.

## Repo conventions to follow

- Theme-aware colors are variables mapped through `@theme inline`.
- `StatusBadge` already demonstrates semantic status selection; keep status
  decisions near data while moving color values to tokens.
- `bg-white` in QR containers at `app/visitor-pass/page.tsx:62` and
  `app/residents/access-code/page.tsx:317` is required for QR contrast and is
  exempt.

## Steps

1. Execute plan 006 first.
2. Add the six exact semantic tokens to `:root` and `.dark`, then expose them
   through `@theme inline`.
3. In `app/admin/page.tsx`, replace amber/emerald card, icon, heading, description,
   and item colors with warning/success semantic utilities. Do not leave
   `text-foreground` or `text-muted-foreground` inside the colored card; use the
   selected semantic foreground with `/75` or `/80` opacity for secondary copy.
4. Repeat the same semantic replacement in
   `app/admin/super-admin/page.tsx`.
5. In `app/residents/page.tsx`, replace the opaque amber/emerald card classes and
   all nested amber/emerald/white row classes. Warning rows use
   `border-warning-border/50 bg-warning-foreground/5 text-warning-foreground`.
6. In `app/admin/administrators/page.tsx`, replace
   `bg-emerald-100 text-emerald-700` with
   `bg-success-surface text-success-foreground ring-1 ring-success-border/60`.
7. In `app/components/PasswordRequirements.tsx`, replace valid-state
   `text-emerald-600` with `text-success-foreground`.
8. Search for light-only amber/emerald semantic classes. Replace remaining account,
   warning, or success UI only; retain unrelated chart/illustration colors if any.
9. Verify both QR containers still use `bg-white`.

## Boundaries

- Do NOT remove the required white QR backgrounds.
- Do NOT use scattered `dark:` overrides; all semantic theme behavior must come
  from tokens.
- Do NOT change warning/success conditions or copy.
- Do NOT map danger/revoked states onto warning tokens.
- Do NOT alter chart colors.
- If a hard-coded color is decorative rather than semantic, leave it out and
  report it separately.

## Verification

- **Mechanical**: run
  `rg -n "bg-(amber|emerald)-(50|100)|text-(amber|emerald)-(600|700|800|900|950)|bg-white" app`.
  Only the two documented QR `bg-white` occurrences may remain from this scope.
  Run `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build`; all must exit 0.
- **Feel check**:
  - View admin operations watch, super-admin governance watch, resident watch, and
    administrator status badges in light and dark modes.
  - Colored surfaces must feel integrated with the surrounding material hierarchy,
    not like pasted light cards.
  - Headings, secondary copy, icons, borders, and nested rows must remain legible.
  - Scan both QR codes on a real device; their backgrounds must remain white.
- **Done when**: all semantic warning/success surfaces adapt through shared tokens,
  with QR contrast preserved.
