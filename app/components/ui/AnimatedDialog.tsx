"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

type AnimatedDialogProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  canDismiss?: boolean;
  surfaceClassName?: string;
};

const EXIT_DURATION_MS = 280;

type ViewportBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type DialogLayerStyle = CSSProperties & {
  "--dialog-viewport-height": string;
};

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
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);

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

    if (open && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

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

  useEffect(() => {
    if (!mounted) return;

    const visualViewport = window.visualViewport;

    function syncViewport() {
      setViewportBounds({
        top: visualViewport?.offsetTop ?? 0,
        left: visualViewport?.offsetLeft ?? 0,
        width: visualViewport?.width ?? window.innerWidth,
        height: visualViewport?.height ?? window.innerHeight,
      });
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);
    visualViewport?.addEventListener("resize", syncViewport);
    visualViewport?.addEventListener("scroll", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
      visualViewport?.removeEventListener("resize", syncViewport);
      visualViewport?.removeEventListener("scroll", syncViewport);
    };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") return null;

  const layerStyle: DialogLayerStyle | undefined = viewportBounds
    ? {
        top: viewportBounds.top,
        left: viewportBounds.left,
        width: viewportBounds.width,
        height: viewportBounds.height,
        "--dialog-viewport-height": `${viewportBounds.height}px`,
      }
    : undefined;

  return createPortal(
    <div
      className="apple-dialog-layer"
      data-state={visible && open ? "open" : "closed"}
      aria-hidden={!open}
      style={layerStyle}
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
    </div>,
    document.body,
  );
}
