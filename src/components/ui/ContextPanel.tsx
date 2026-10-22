"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./ContextPanel.module.css";

type Props = {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function ContextPanel({
  title = "¿Qué decide esto?",
  children,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <aside className={styles.panel}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown
          className={cn(styles.chevron, open && styles.open)}
          aria-hidden
        />
      </button>
      {open ? <div className={styles.body}>{children}</div> : null}
    </aside>
  );
}
