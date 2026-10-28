"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import styles from "./landing.module.css";

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const frame = root.querySelector<HTMLElement>("[data-frame]");
        const heroStage = root.querySelector<HTMLElement>("[data-hero-stage]");

        // Hero copy enters with CSS (landing.module.css) so it plays on first
        // paint instead of waiting for hydration; GSAP owns the frame and scroll.

        const wide = window.matchMedia("(min-width: 768px)").matches;
        if (frame && heroStage && wide) {
          gsap.set(frame, {
            rotateX: 28,
            y: 72,
            autoAlpha: 0,
            scale: 0.96,
            transformPerspective: 2000,
            transformOrigin: "50% 0%",
          });

          gsap.to(frame, {
            rotateX: 18,
            y: 0,
            autoAlpha: 1,
            duration: 1.15,
            delay: 0.55,
            ease: "expo.out",
          });

          const scrubTween = gsap.fromTo(
            frame,
            { rotateX: 18, scale: 0.96 },
            {
              rotateX: 0,
              scale: 1,
              ease: "none",
              immediateRender: false,
              paused: true,
            },
          );

          ScrollTrigger.create({
            trigger: heroStage,
            start: "top 40%",
            end: "bottom 20%",
            scrub: 0.45,
            animation: scrubTween,
            invalidateOnRefresh: true,
          });
        } else if (frame) {
          gsap.set(frame, { rotateX: 0, y: 0, scale: 1, autoAlpha: 1 });
        }

        const centerline = root.querySelector<SVGPathElement>(
          "[data-centerline-path]",
        );
        if (centerline && wide) {
          gsap.fromTo(
            centerline,
            { drawSVG: "0%" },
            {
              drawSVG: "100%",
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
              },
            },
          );
        }

        ScrollTrigger.batch("[data-chapter-ui]", {
          start: "top 90%",
          once: true,
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { y: 18, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.45,
                stagger: 0.06,
                ease: "power2.out",
                overwrite: "auto",
                clearProps: "transform,opacity,visibility",
              },
            );
          },
        });

        const proof = root.querySelector("[data-proof]");
        if (proof) {
          gsap.fromTo(
            proof,
            { autoAlpha: 0.001 },
            {
              autoAlpha: 1,
              duration: 0.4,
              ease: "power2.out",
              scrollTrigger: { trigger: proof, start: "top 92%", once: true },
              clearProps: "opacity,visibility",
            },
          );
        }

        const fanPath = root.querySelector<SVGPathElement>("[data-fan-path]");
        if (fanPath) {
          gsap.fromTo(
            fanPath,
            { drawSVG: "0%" },
            {
              drawSVG: "100%",
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: { trigger: fanPath, start: "top 85%", once: true },
            },
          );
        }
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          "[data-frame], [data-h1], [data-hero-tag], [data-hero-sub], [data-hero-cta]",
          {
            rotateX: 0,
            y: 0,
            scale: 1,
            autoAlpha: 1,
            clearProps: "transform,opacity,visibility",
          },
        );
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className={styles.page} data-landing-theme="dark">
      {children}
    </div>
  );
}
