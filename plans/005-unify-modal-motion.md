# 005 — Unify modal motion across workflows

- **Status**: TODO
- **Commit**: 022634b
- **Severity**: MEDIUM
- **Category**: Cohesion / Missed opportunities
- **Estimated scope**: 5 files, about 140 lines

## Problem

The QR scanner uses the shared animated dialog:

```tsx
/* app/security/components/ScannerModal.tsx:19 — current */
<AnimatedDialog
  open={open}
  onClose={onClose}
  labelledBy="scanner-dialog-title"
  surfaceClassName="max-w-lg p-6"
>
```

Adjacent modal workflows mount and unmount raw overlays:

```tsx
/* app/security/page.tsx:82 — current */
if (!visitorName) return null;
return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={close}>
```

```tsx
/* app/security/components/VisitorDetailsModal.tsx:20 — current */
if (!visitor) return null;
return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
    onClick={onClose}
  >
```

```tsx
/* app/admin/visitor-history/page.tsx:148 — current */
{selectedVisitor && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
    role="presentation"
    onClick={() => setSelectedVisitor(null)}
  >
```

These surfaces teleport while scanner, confirmation, and success dialogs animate.
Data is currently cleared immediately on close, so it must remain available until
an exit finishes.

## Target

All three raw modal flows use `AnimatedDialog`. Extend `AnimatedDialogProps` with:

```tsx
onExitComplete?: () => void;
```

Store the callback in a ref that is updated in an effect, then call that ref in
the unmount timeout after `setMounted(false)`. This prevents changing inline
callbacks from cancelling and rescheduling the presence timeout. Consumers must
separate visual openness from displayed data:

```tsx
const [detailsOpen, setDetailsOpen] = useState(false);
const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

function openDetails(visitor: Visitor) {
  setSelectedVisitor(visitor);
  setDetailsOpen(true);
}

function closeDetails() {
  setDetailsOpen(false);
}
```

Render the dialog while selected data exists, close visually first, and clear data
only through `onExitComplete`. All surfaces use centered origin, shared
`max-w-lg` sizing, and the motion/reduced-motion behavior from plans 003 and 004.

## Repo conventions to follow

- `ConfirmationDialog`, `SuccessDialog`, and `ScannerModal` are the exemplars for
  `AnimatedDialog`.
- Preserve each existing `aria-labelledby` id.
- Preserve existing content, button labels, state mutations, and API actions.
- Use explicit `open` booleans; do not cache render data through refs.

## Steps

1. Execute plans 003 and 004 first.
2. In `app/components/ui/AnimatedDialog.tsx`, import `useRef`, then add optional
   `onExitComplete?: () => void` to props and destructuring.
3. Create `const onExitCompleteRef = useRef(onExitComplete)`. Add a separate
   effect that assigns `onExitCompleteRef.current = onExitComplete` whenever the
   prop changes. Do not read the ref during render.
4. In the close timeout, call `setMounted(false)` and then
   `onExitCompleteRef.current?.()`. Keep the presence effect dependent only on
   `open`; reopening must cancel the timeout through the existing cleanup.
5. In `app/admin/visitor-history/page.tsx`, add `detailsOpen`. Replace direct
   `setSelectedVisitor(visitor)` with `openDetails(visitor)`. Replace the raw
   overlay/surface with `AnimatedDialog`, using `detailsOpen`,
   `setDetailsOpen(false)`, `labelledBy="visitor-history-details-title"`,
   `surfaceClassName="max-w-lg p-6"`, and
   `onExitComplete={() => setSelectedVisitor(null)}`.
6. Keep the admin dialog render guarded by `selectedVisitor` so its fields remain
   non-null through exit. Change both close paths to `setDetailsOpen(false)`.
7. In `app/security/page.tsx`, add `visitorDetailsOpen`; pass a wrapper to
   `ActivityTable` that sets the selected visitor and opens the dialog.
8. Extend `VisitorDetailsModalProps` with `open` and `onExitComplete`. Replace its
   raw overlay with `AnimatedDialog`; keep rendering guarded by the still-cached
   `visitor`. The parent closes visually first and clears `selectedVisitor` in
   `onExitComplete`.
9. Convert `VerificationResultCard` to accept `open` and `onExitComplete`. Add a
   `verificationResultOpen` boolean in the parent. When verification succeeds,
   populate the existing visitor state first, then set the boolean true.
10. Replace `VerificationResultCard`'s raw overlay with `AnimatedDialog`. Its close
   callback sets `verificationResultOpen(false)`; its `onExitComplete` clears
   visitor name/id/status/expiry state exactly as the current inline close
   callback does.
11. Preserve loading locks by passing `canDismiss={!loading}` wherever an action
    is in flight.

## Boundaries

- Do NOT change verification, check-in, check-out, visitor-status, or Supabase
  logic.
- Do NOT use refs to render stale data; React 19 lint rejects reading refs during
  render.
- Do NOT clear selected content before `onExitComplete`.
- Do NOT change modal copy or information architecture.
- Do NOT create a second dialog component.
- If the parent state flow has changed since commit `022634b`, STOP and report
  drift.

## Verification

- **Mechanical**: run `npm.cmd run lint`, `npm.cmd test`, and
  `npm.cmd run build`; all must exit 0.
- **Feel check**:
  - Open/close admin visitor history, security visitor details, QR scanner, and
    verification result.
  - Every surface must enter and exit on the same centered path.
  - At 10% playback, content must remain populated until the final exit frame.
  - Rapidly reopen a closing dialog; it must reverse from its current position and
    the pending content-clear callback must be cancelled.
  - Test Escape and backdrop click; loading dialogs must remain locked.
  - Toggle reduced motion; every migrated dialog must crossfade without movement.
- **Done when**: all modal workflows share one presence system and no dialog
  teleports or blanks during exit.
