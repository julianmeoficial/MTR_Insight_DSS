"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import styles from "./Tooltip.module.css";

const SHOW_DELAY_MS = 400;

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function Tooltip({ label, children, className }: Props) {
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
  }, [clearTimer]);

  const hide = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  return (
    <span
      className={cn(styles.anchor, className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span id={id} role="tooltip" className={styles.tip}>
          {label}
        </span>
      ) : null}
    </span>
  );
}
