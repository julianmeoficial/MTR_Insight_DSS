"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Drawer.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Drawer({ open, onClose, title, children, className }: Props) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.root} data-open="true">
      <button
        type="button"
        className={styles.backdrop}
        aria-label={title}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className={cn(styles.panel, className)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {children}
      </aside>
    </div>
  );
}
