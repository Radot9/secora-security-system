"use client";

import { useEffect } from "react";

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
 useEffect(() => {
 if (!open) return;
 const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && !loading && onClose();
 window.addEventListener("keydown", closeOnEscape);
 return () => window.removeEventListener("keydown", closeOnEscape);
 }, [loading, onClose, open]);

 if (!open) return null;
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" role="presentation">
 <div role="dialog" aria-modal="true" aria-labelledby="confirmation-title" className="w-full max-w-md rounded-3xl bg-card p-7 shadow-2xl">
 <h2 id="confirmation-title" className="text-xl font-bold">{title}</h2>
 <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
 <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-border px-5 py-3 font-semibold hover:bg-muted disabled:opacity-50">Cancel</button>
 <button type="button" onClick={onConfirm} disabled={loading} autoFocus className={`rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50 ${destructive ? "bg-destructive" : "bg-primary"}`}>
 {loading ? "Working..." : confirmLabel}
 </button>
 </div>
 </div>
 </div>
 );
}
