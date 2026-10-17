"use client";

import { cn } from "@/lib/cn";
import styles from "./IconButton.module.css";

type Props = {
  /** Accessible name (required). */
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function IconButton({
  label,
  onClick,
  children,
  className,
  disabled,
  size = "md",
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(styles.btn, className)}
      data-size={size}
    >
      {children}
    </button>
  );
}
