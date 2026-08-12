# 008 — Fix confirmation action contrast

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: HIGH
- **Category**: Dark mode / Accessibility
- **Estimated scope**: 2 files, about 20 lines

## Problem

Confirmation actions force white text for both primary and destructive variants:

```tsx
/* app/components/ui/ConfirmationDialog.tsx:29 — current */
<button
  type="button"
  onClick={onConfirm}
  disabled={loading}
  autoFocus
  className={`apple-primary-button rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50 ${destructive ? "bg-destructive" : "bg-primary"}`}
>
```

Dark primary is intentionally bright and already has a near-black foreground:

```css
/* app/globals.css:95 — current */
--primary: oklch(0.72 0.15 159);
--primary-foreground: oklch(0.14 0.026 165);
```

White on the current dark primary is approximately 2.32:1, below the 4.5:1 WCAG
threshold for normal text. The defined primary foreground is approximately 8.53:1
but is bypassed.

## Target

Add a destructive foreground token and map it to Tailwind:

```css
/* @theme inline */
--color-destructive-foreground: var(--destructive-foreground);

/* :root */
--destructive-foreground: oklch(0.985 0.005 20);

/* .dark */
--destructive-foreground: oklch(0.15 0.03 22);
```

Use variant-complete classes:

```tsx
className={`apple-primary-button rounded-xl px-5 py-3 font-semibold disabled:opacity-50 ${
  destructive
    ? "bg-destructive text-destructive-foreground"
    : "bg-primary text-primary-foreground"
}`}
```

## Repo conventions to follow

- Other primary controls already use `text-primary-foreground`.
- Theme variables are declared in `:root` and `.dark`, then exposed in
  `@theme inline`.
- Keep the existing `destructive` boolean API.

## Steps

1. In `app/globals.css`, add the destructive foreground values above to `:root`
   and `.dark`.
2. Add the Tailwind color mapping in `@theme inline`.
3. In `app/components/ui/ConfirmationDialog.tsx`, remove unconditional
   `text-white`.
4. Apply the exact conditional background/foreground classes in the target.
5. Search for other controls combining `bg-primary` or `bg-destructive` with
   `text-white`. If found, include only direct action buttons using the same token
   semantics; do not alter white QR surfaces or marketing copy.

## Boundaries

- Do NOT darken the primary or destructive backgrounds in this plan.
- Do NOT change dialog copy, action order, autoFocus, disabled state, or loading
  behavior.
- Do NOT use `dark:` foreground overrides; use semantic tokens.
- Do NOT change status badges.

## Verification

- **Mechanical**: run `npm.cmd run lint` and `npm.cmd run build`; both must exit 0.
  Use a contrast tool against rendered computed colors; primary and destructive
  action text must each be at least 4.5:1 in light and dark modes.
- **Feel check**:
  - Open normal and destructive confirmation dialogs in both themes.
  - Text must remain clearly legible without looking disconnected from the button.
  - Disabled actions must remain recognizable at reduced opacity.
  - Confirm other primary buttons remain visually consistent.
- **Done when**: confirmation action contrast meets 4.5:1 in both themes and no
  hard-coded white foreground bypasses semantic action tokens.
