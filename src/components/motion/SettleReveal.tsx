"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { COUNT_REVEAL_S } from "@/components/motion/CountUp";

type Props = {
  children: React.ReactNode;
  /** Same delay passed to the sibling CountUp. */
  delay?: number;
};

/**
 * Shows a status only once its number has settled, so a pill never sits
 * next to a midway figure (DESIGN.md §6.4).
 */
export function SettleReveal({ children, delay = 0 }: Props) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.span
      style={{ display: "inline-flex" }}
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: "some" }}
      transition={{
        delay: delay + COUNT_REVEAL_S * 0.85,
        duration: 0.16,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.span>
  );
}
