"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type Props = {
  text: string;
  className?: string;
  /** Seconds before flipping starts (stagger rows) */
  delay?: number;
};

/**
 * Departure-board flip for short codes (IATA, ICAO, runway designators).
 * Plays once when the code enters the viewport; letters settle left to
 * right. Final text is in the HTML and for screen readers.
 */
export function SplitFlap({ text, className, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const chars = [...text];
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      duration: 0.32 + chars.length * 0.035,
      delay,
      ease: "power1.out",
      paused: true,
      onUpdate: () => {
        const settled = Math.floor(state.p * chars.length);
        el.textContent = chars
          .map((c, i) =>
            i < settled || !/[A-Z0-9]/.test(c)
              ? c
              : CHARSET[Math.floor(Math.random() * CHARSET.length)],
          )
          .join("");
      },
      onComplete: () => {
        el.textContent = text;
      },
    });
    // Background tabs pause the GSAP ticker; never leave a scrambled code.
    const total = (delay + 0.32 + chars.length * 0.035) * 1000 + 250;
    let fallback = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          tween.play();
          fallback = window.setTimeout(() => {
            tween.kill();
            el.textContent = text;
          }, total);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
      tween.kill();
      el.textContent = text;
    };
  }, [text, delay, reduced]);

  return (
    <span className={cn(className)} aria-label={text}>
      <span ref={ref} aria-hidden>
        {text}
      </span>
    </span>
  );
}
