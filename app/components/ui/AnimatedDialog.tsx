"use client";

import { useEffect, useState, type ReactNode } from "react";

type AnimatedDialogProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  canDismiss?: boolean;
  surfaceClassName?: string;
};

const EXIT_DURATION_MS = 280;

export function AnimatedDialog({
  open,
  onClose,
  labelledBy,
  children,
  canDismiss = true,
  surfaceClassName = "",
}: AnimatedDialogProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mountFrame = 0;
    let visibilityFrame = 0;
    let unmountTimeout = 0;

    if (open) {
      mountFrame = window.requestAnimationFrame(() => {
        setMounted(true);
        visibilityFrame = window.requestAnimationFrame(() => setVisible(true));
      });
    } else {
      visibilityFrame = window.requestAnimationFrame(() => setVisible(false));
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      unmountTimeout = window.setTimeout(
        () => setMounted(false),
        reducedMotion ? 0 : EXIT_DURATION_MS,
      );
    }

    return () => {
      window.cancelAnimationFrame(mountFrame);
      window.cancelAnimationFrame(visibilityFrame);
      window.clearTimeout(unmountTimeout);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open && canDismiss) onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [canDismiss, mounted, onClose, open]);

  if (!mounted) return null;

  return (
    <div
      className="apple-dialog-layer"
      data-state={visible && open ? "open" : "closed"}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="apple-dialog-backdrop"
        aria-label="Close dialog"
        onClick={onClose}
        disabled={!canDismiss}
        tabIndex={open && canDismiss ? 0 : -1}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`apple-dialog-surface ${surfaceClassName}`}
      >
        {children}
      </section>
    </div>
  );
}
