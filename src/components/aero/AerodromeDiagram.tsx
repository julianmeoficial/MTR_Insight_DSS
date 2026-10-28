"use client";

import { useRef } from "react";
import type { RunwayId, RunwayRef, TerminalId, TerminalRef } from "@/domain/erpm";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { gsap, useGSAP } from "@/lib/gsap";
import { formatInt } from "@/lib/format";
import styles from "./AerodromeDiagram.module.css";

type Props = {
  runways: RunwayRef[];
  terminals: TerminalRef[];
  /** Hide projected assets (current configuration) */
  showProjected: boolean;
  highlightRunway?: RunwayId;
  highlightTerminal?: TerminalId;
};

/** Drawing area in SVG units; lengths are scaled to the longest runway. */
const W = 720;
const PAD = 56;
const RWY_GAP = 92;

/**
 * Schematic aerodrome chart: runways to scale in length, terminals and
 * aprons as blocks. Not a survey or an AIP chart.
 */
export function AerodromeDiagram({
  runways,
  terminals,
  showProjected,
  highlightRunway,
  highlightTerminal,
}: Props) {
  const { dict } = usePreferences();
  const t = dict.aerodrome;
  const root = useRef<SVGSVGElement>(null);

  const visible = runways.filter((r) => showProjected || r.status === "existing");
  const maxLen = Math.max(...runways.map((r) => r.lengthM));
  const pxPerM = (W - PAD * 2) / maxLen;
  const rwy1 = runways.find((r) => r.id === "RWY1")!;
  const rwy2 = runways.find((r) => r.id === "RWY2");

  // RWY1 sits on top; RWY2 parallel below; terminals between and below.
  const yFor = (id: RunwayId) => (id === "RWY1" ? 70 : 70 + RWY_GAP * 2);
  const xStart = (r: RunwayRef) => PAD + (maxLen - r.lengthM) * pxPerM * (r.id === "RWY1" ? 0.5 : 0);
  const h = (r: RunwayRef) => Math.max(8, r.widthM * 0.22);
  const height = showProjected && rwy2 ? 70 + RWY_GAP * 2 + 70 : 70 + RWY_GAP + 40;

  const t1 = terminals.find((x) => x.id === "T1")!;
  const t2 = terminals.find((x) => x.id === "T2");
  const scaleM = 1000;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-rwy]", {
          scaleX: 0,
          transformOrigin: "0% 50%",
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.12,
        });
        gsap.from("[data-centerline]", {
          strokeDashoffset: 48,
          duration: 1.2,
          ease: "none",
        });
        gsap.from("[data-block]", {
          autoAlpha: 0,
          y: 6,
          duration: 0.4,
          ease: "expo.out",
          stagger: 0.06,
          delay: 0.3,
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [showProjected] },
  );

  function runway(r: RunwayRef) {
    const x = xStart(r);
    const y = yFor(r.id);
    const len = r.lengthM * pxPerM;
    const hh = h(r);
    const [a, b] = r.designator.split("/");
    const projected = r.status === "projected";
    const active = highlightRunway === r.id;
    return (
      <g key={r.id} data-active={active ? "true" : undefined} className={styles.runway}>
        <rect
          data-rwy
          x={x}
          y={y - hh / 2}
          width={len}
          height={hh}
          rx={1.5}
          className={projected ? styles.rwyProjected : styles.rwyExisting}
        />
        {/* Threshold piano keys */}
        {[x + 3, x + len - 13].map((tx) =>
          [0, 1, 2, 3].map((k) => (
            <rect
              key={`${tx}-${k}`}
              x={tx}
              y={y - hh / 2 + 1.5 + k * ((hh - 3) / 4)}
              width={10}
              height={Math.max(1, (hh - 3) / 4 - 1)}
              className={styles.marking}
            />
          )),
        )}
        <line
          data-centerline
          x1={x + 18}
          x2={x + len - 18}
          y1={y}
          y2={y}
          className={styles.centerline}
        />
        <text x={x - 8} y={y + 4} textAnchor="end" className={styles.designator}>
          {a}
        </text>
        <text x={x + len + 8} y={y + 4} textAnchor="start" className={styles.designator}>
          {b}
        </text>
        <text x={x} y={y - hh / 2 - 10} className={styles.rwyLabel}>
          RWY {r.designator} · {formatInt(r.lengthM)} × {formatInt(r.widthM)} m ·{" "}
          {dict.validator.approach[r.approach]}
          {projected ? ` · ${t.projected}` : ""}
        </text>
      </g>
    );
  }

  function terminal(term: TerminalRef, x: number, y: number, w: number) {
    const projected = term.status === "projected";
    const active = highlightTerminal === term.id;
    return (
      <g
        key={term.id}
        data-block
        className={styles.terminal}
        data-active={active ? "true" : undefined}
      >
        <rect x={x} y={y} width={w} height={28} rx={3} className={styles.apron} />
        <rect
          x={x + 8}
          y={y + 6}
          width={w - 16}
          height={16}
          rx={2}
          className={projected ? styles.bldgProjected : styles.bldgExisting}
        />
        <text x={x + w / 2} y={y + 18} textAnchor="middle" className={styles.termLabel}>
          {term.id} · {t.code} {term.maxCodeLetter}
        </text>
      </g>
    );
  }

  const r1x = xStart(rwy1);
  const r1len = rwy1.lengthM * pxPerM;

  return (
    <figure className={styles.figure}>
      <svg
        ref={root}
        viewBox={`0 0 ${W} ${height}`}
        className={styles.svg}
        role="img"
        aria-label={t.aria}
      >
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" className={styles.hatch} />
          </pattern>
        </defs>

        {/* Taxiway from RWY1 to T1 */}
        <line
          x1={r1x + r1len * 0.55}
          x2={r1x + r1len * 0.55}
          y1={yFor("RWY1")}
          y2={yFor("RWY1") + RWY_GAP - 30}
          className={styles.taxiway}
        />
        {terminal(t1, r1x + r1len * 0.55 - 70, yFor("RWY1") + RWY_GAP - 30, 140)}

        {showProjected && rwy2 && t2 ? (
          <>
            <line
              x1={PAD + rwy2.lengthM * pxPerM * 0.35}
              x2={PAD + rwy2.lengthM * pxPerM * 0.35}
              y1={yFor("RWY2") - RWY_GAP + 40}
              y2={yFor("RWY2")}
              className={styles.taxiwayProjected}
            />
            {terminal(t2, PAD + rwy2.lengthM * pxPerM * 0.35 - 90, yFor("RWY2") - RWY_GAP + 12, 180)}
          </>
        ) : null}

        {visible.map(runway)}

        {/* Scale bar and north-ish heading note */}
        <g className={styles.scale} transform={`translate(${PAD}, ${height - 16})`}>
          <line x1={0} x2={scaleM * pxPerM} y1={0} y2={0} />
          <line x1={0} x2={0} y1={-4} y2={4} />
          <line x1={scaleM * pxPerM} x2={scaleM * pxPerM} y1={-4} y2={4} />
          <text x={scaleM * pxPerM + 8} y={4}>
            {formatInt(scaleM)} m
          </text>
        </g>
      </svg>
      <figcaption className={styles.caption}>
        <span className={styles.legendItem}>
          <span className={styles.swatch} data-kind="existing" aria-hidden />
          {t.existing}
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} data-kind="projected" aria-hidden />
          {t.projected}
        </span>
        <span>{t.note}</span>
      </figcaption>
    </figure>
  );
}
