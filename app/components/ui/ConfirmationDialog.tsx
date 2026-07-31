"use client";

import { AnimatedDialog } from "./AnimatedDialog";

type ConfirmationDialogProps = {
 open: boolean;
 title: string;
 description: string;
 confirmLabel: string;
 loading?: boolean;
 destructive?: boolean;
 onConfirm: () => void;
 onClose: () => void;
};

export function ConfirmationDialog({ open, title, description, confirmLabel, loading = false, destructive = false, onConfirm, onClose }: ConfirmationDialogProps) {
 return (
 <AnimatedDialog
 open={open}
 onClose={onClose}
 canDismiss={!loading}
 labelledBy="confirmation-title"
 surfaceClassName="max-w-md p-7"
 >
 <h2 id="confirmation-title" className="text-xl font-bold">{title}</h2>
 <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
 <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <button type="button" onClick={onClose} disabled={loading} className="apple-secondary-button rounded-xl border border-border px-5 py-3 font-semibold disabled:opacity-50">Cancel</button>
 <button type="button" onClick={onConfirm} disabled={loading} autoFocus className={`apple-primary-button rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50 ${destructive ? "bg-destructive" : "bg-primary"}`}>
 {loading ? "Working..." : confirmLabel}
 </button>
 </div>
 </AnimatedDialog>
 );
}
