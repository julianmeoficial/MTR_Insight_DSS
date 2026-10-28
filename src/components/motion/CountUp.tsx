"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { formatInt, formatPct, formatPp } from "@/lib/format";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

export type CountMode = "pct" | "pctCore" | "int" | "pp";

/** First reveal and later updates (DESIGN.md §6.4). */
export const COUNT_REVEAL_S = 0.7;
export const COUNT_UPDATE_S = 0.32;

function renderCount(mode: CountMode, n: number): string {
  if (mode === "pct") return formatPct(n);
  if (mode === "pp") return formatPp(n);
  if (mode === "pctCore") {
    return formatPct(n).replace(/[\s ]+%$/, "");
  }
  return formatInt(n);
}

/**
 * Wraps "." and "," so monospace faces (B612) do not leave a full empty cell
 * around the separator. Input is our own formatter output, never user text.
 */
function toSeparatedHtml(text: string): string {
  return text.replace(/[.,]/g, (sep) => `<span class="numSep">${sep}</span>`);
}

type Props = {
  value: number | null;
  mode?: CountMode;
  className?: string;
  /** Seconds before the first reveal starts (stagger with siblings). */
  delay?: number;
};

/**
 * Any visible pixel starts the first count. Clipped parents (the tilted hero
 * frame) never report a large ratio, and until the count starts the final
 * figure stays on screen, so a status never sits next to a zero.
 */
const VIEW_THRESHOLD = 0;

/**
 * Counts toward the value on first reveal, then tweens from the previous
 * value when it changes (filters, scenarios). The final figure is in the
 * server HTML and in a screen-reader copy, so nothing reads a midway number.
 * Reduced motion: final figure, no tween.
 */
export function CountUp({ value, mode = "int", className, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const reduced = usePrefersReducedMotion();
  const finalText = value === null ? "n/d" : renderCount(mode, value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === null || reduced) {
      el.innerHTML = toSeparatedHtml(finalText);
      shown.current = value;
      return;
    }
    const first = shown.current === null;
    const state = { n: first ? 0 : shown.current! };
    const tween = gsap.to(state, {
      paused: first,
      n: value,
      duration: first ? COUNT_REVEAL_S : COUNT_UPDATE_S,
      delay: first ? delay : 0,
      ease: first ? "expo.out" : "power2.inOut",
      onUpdate: () => {
        el.innerHTML = toSeparatedHtml(renderCount(mode, state.n));
        shown.current = state.n;
      },
      onComplete: () => {
        el.innerHTML = toSeparatedHtml(finalText);
        shown.current = value;
      },
    });
    // First reveal waits until the figure is on screen (landing chapters,
    // long SIG pages); later updates play at once.
    let observer: IntersectionObserver | null = null;
    if (first) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            el.innerHTML = toSeparatedHtml(renderCount(mode, 0));
            tween.play();
            observer?.disconnect();
          }
        },
        { threshold: VIEW_THRESHOLD },
      );
      observer.observe(el);
    }
    return () => {
      observer?.disconnect();
      tween.kill();
    };
  }, [value, mode, reduced, finalText, delay]);

  return (
    <span className={cn(className)}>
      <span
        ref={ref}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: toSeparatedHtml(finalText) }}
      />
      <span className="sr-only">{finalText}</span>
    </span>
  );
}
