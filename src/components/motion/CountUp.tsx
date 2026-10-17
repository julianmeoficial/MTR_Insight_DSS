"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { formatInt, formatPct, formatPp } from "@/lib/format";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

export type CountMode = "pct" | "pctCore" | "int" | "pp";

function renderCount(mode: CountMode, n: number): string {
  if (mode === "pct") return formatPct(n);
  if (mode === "pp") return formatPp(n);
  if (mode === "pctCore") {
    return formatPct(n).replace(/[\s\u00A0]+%$/, "");
  }
  return formatInt(n);
}

type Props = {
  value: number | null;
  mode?: CountMode;
  className?: string;
  duration?: number;
};

/**
 * Renders the final figure in HTML, then eases toward it after mount.
 * Reduced motion keeps the final figure with no tween.
 */
export function CountUp({
  value,
  mode = "int",
  className,
  duration = 0.9,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const finalText = value === null ? "n/d" : renderCount(mode, value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === null || reduced) {
      el.textContent = finalText;
      return;
    }
    const state = { n: 0 };
    el.textContent = renderCount(mode, 0);
    const tween = gsap.to(state, {
      n: value,
      duration,
      ease: "expo.out",
      onUpdate: () => {
        el.textContent = renderCount(mode, state.n);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, mode, reduced, finalText, duration]);

  return (
    <span ref={ref} className={cn(className)}>
      {finalText}
    </span>
  );
}
