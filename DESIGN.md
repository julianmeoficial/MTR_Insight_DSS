# DESIGN.md — MTR Insight (v4.0.0 · "Final Approach")

> A-DSS for Los Garzones Airport (MTR), Montería, Colombia.
> Visual, motion and interaction source of truth. Read before any UI change.
> Code vs. this file: this file wins. This file vs. approved Figma: ask.

---

## 0. Scope

| Item | Value |
|---|---|
| Version | 4.0.0 (2026-10-16), replaces v3 |
| Applies to | Landing (`/`), SIG app (`/p1`–`/p7`, `/alertas`, `/escenarios`, `/decisiones`) |
| Stack | Next.js App Router, React, TypeScript strict, CSS Modules |
| Fonts | `next/font/google`: Inter (variable, `opsz`), JetBrains Mono |
| Motion | gsap ≥ 3.13 (ScrollTrigger, SplitText, DrawSVG) + @gsap/react; motion/react in SIG |
| 3D | three: landing scene + CSS 3D product tilt. Never encodes KPI data |
| Icons | lucide-react, 16 px in SIG, 20 px on landing, stroke 1.5 |
| Themes | Landing: dark only. SIG: dark default, light supported |

Not an official Airplan product, ATC tool or certified decision engine.

---

## 1. Concept: Final Approach

A good decision is a stabilized approach: aligned, on glidepath, with every
instrument readable. MTR Insight borrows the language of an instrument
approach (centerline, PAPI, threshold, glidepath) and executes it with
Linear-grade craft: dark, precise, fast, keyboard-first, product UI as hero.

### 1.1 Signatures (what makes it ours)

1. **Centerline.** A 1 px dashed accent line (`12 / 12`) that draws with
   scroll down the landing and ends at the final CTA ("threshold").
   In the SIG it appears only as the active-view indicator.
2. **PAPI.** Four 6 px lights. Used as loader (lights shift red → white in
   sequence) and as brand detail. Decorative only; never a data encoding.
3. **Wayfinding tags.** Airport sign style: yellow on black (location)
   `MTR · SKMR`, black on yellow (direction) `1.0 Medir →`. Radius 2 px,
   Inter 600, uppercase allowed only here.
4. **Glidepath 3°.** The hero camera descends on a 3° path; diagonal
   accents on the landing use 3°. Resting product tilt = `rotateX(24deg)`.
5. **Dusk light.** One warm radial light from the horizon. Never multicolor.

### 1.2 Linear: take / don't

| Take | Don't |
|---|---|
| Near-black canvas, layered surfaces, 1 px low-opacity lines | Indigo brand, their copy, their illustrations |
| Product UI built in HTML as the hero, tilted in 3D | Screenshots as images (always live components + fixtures) |
| Numbered chapters with sticky titles and UI fragments | Generic "bento" feature grids |
| Tight display type, neutral text gradient | Colored gradient text |
| ⌘K, shortcuts, dense lists, split view, inbox | Faux-AI features, chat boxes |
| Fast, subtle motion with physical easing | Bouncy springs, parallax everywhere |

### 1.3 Banned ("AI flop" tells)

- Any text in Times/serif fallback. Default untuned Inter.
- UPPERCASE letter-spaced eyebrows (except wayfinding tags).
- Decorative codes in nav (`P1`, `AL`). Codes live in breadcrumbs/tooltips.
- Colored left borders, outlined red status boxes, full-width banners.
- Aurora/purple gradients, glassmorphism (except the nav blur), neon glow,
  3D globes, emoji, sparkles, "AI-powered", pulsing LIVE dots on demo data.
- Count-up on numbers. Mixed languages. Lorem ipsum. Fake logos.
- Stretched single KPI with dead space. Equal-weight everything.

---

## 2. Color

```css
/* src/styles/tokens.css */
:root, [data-theme="dark"] {
  color-scheme: dark;
  --bg: #08090A;
  --surface-1: #0F1011;   /* panels, sidebar */
  --surface-2: #141516;   /* cards, rows hover */
  --surface-3: #1A1B1E;   /* inputs, selected */
  --surface-4: #212226;   /* pressed, menus */
  --line: rgb(255 255 255 / .06);
  --line-2: rgb(255 255 255 / .10);
  --line-3: rgb(255 255 255 / .16);
  --highlight: inset 0 1px 0 rgb(255 255 255 / .05); /* top inner edge */

  --fg: #F7F8F8;
  --fg-2: #B4B8BF;        /* secondary */
  --fg-3: #8A8F98;        /* tertiary, meta */
  --fg-4: #62666D;        /* disabled, never essential */

  --accent: #F2C230;      /* taxiway yellow */
  --accent-hover: #FFD24A;
  --accent-fg: #14110A;
  --accent-soft: color-mix(in oklab, var(--accent) 14%, transparent);

  --ok: #4CC38A; --warn: #F0A93B; --crit: #EB5757; --info: #6FA3E0; --nodata: #8A8F98;

  --series-1: #6F97F0; /* Copa */
  --series-2: #F2C230; /* Satena */
  --series-3: #4FC1B2; --series-4: #A98BEA; --series-5: #F0957C; --series-6: #8A8F98;

  --dusk: radial-gradient(60% 50% at 50% 0%, rgb(242 194 48 / .07), transparent 70%);
  --focus: #F2C230;

  --shadow-1: 0 1px 2px rgb(0 0 0 / .4);
  --shadow-2: 0 8px 24px -8px rgb(0 0 0 / .6);
  --shadow-3: 0 32px 80px -20px rgb(0 0 0 / .8), 0 0 0 1px var(--line-2);
}

[data-theme="light"] { /* SIG only */
  color-scheme: light;
  --bg: #FBFBFA; --surface-1: #F5F5F4; --surface-2: #FFFFFF;
  --surface-3: #F0EFED; --surface-4: #E8E7E4;
  --line: rgb(16 17 20 / .06); --line-2: rgb(16 17 20 / .10); --line-3: rgb(16 17 20 / .16);
  --highlight: inset 0 1px 0 rgb(255 255 255 / .8);
  --fg: #111214; --fg-2: #3C3F45; --fg-3: #6B6F76; --fg-4: #9A9DA3;
  --accent-fg: #14110A;
  --ok: #1F8A55; --warn: #B76E00; --crit: #C93A2E; --info: #2F6FB0;
  --series-1: #3D6FD9; --series-2: #D69E00;
  --focus: #111214;
  --shadow-1: 0 1px 2px rgb(16 17 20 / .05);
  --shadow-2: 0 8px 24px -8px rgb(16 17 20 / .12);
  --shadow-3: 0 32px 80px -20px rgb(16 17 20 / .25), 0 0 0 1px var(--line-2);
}
```

Rules: ≤ 1 accent fill per viewport. Status colors never as series.
Tints only via `color-mix`. No new hex outside this file.

---

## 3. Typography

```ts
// src/app/fonts.ts
import { Inter, JetBrains_Mono } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'], axes: ['opsz'], variable: '--font-inter', display: 'swap',
});
export const mono = JetBrains_Mono({
  subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap',
});
```

```css
:root {
  --ff-sans: var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --ff-mono: var(--font-mono), ui-monospace, "SF Mono", Menlo, monospace;
  /* tuned Inter: single-storey a, open digits, round quotes */
  --ff-features: "cv11", "ss01", "ss03";

  --t-mini: 0.6875rem; /* 11 kbd, tags */
  --t-xs: 0.75rem;     /* 12 meta */
  --t-sm: 0.8125rem;   /* 13 SIG body, lists */
  --t-md: 0.9375rem;   /* 15 landing small */
  --t-lg: 1.0625rem;   /* 17 landing body */
  --t-xl: 1.25rem;     /* 20 */
  --t-2xl: 1.5rem;     /* 24 SIG page title */
  --t-3xl: 2rem;       /* 32 KPI */
  --t-4xl: clamp(2.25rem, 3vw + 1rem, 3.5rem);   /* chapter titles */
  --t-hero: clamp(3rem, 6vw + 1rem, 5.5rem);     /* hero */
}
body { font: 400 var(--t-sm)/1.5 var(--ff-sans); font-feature-settings: var(--ff-features);
  font-optical-sizing: auto; color: var(--fg); background: var(--bg);
  -webkit-font-smoothing: antialiased; }
.num { font-variant-numeric: tabular-nums; }
```

| Role | Size / weight | Tracking | Line |
|---|---|---|---|
| Hero | hero / 590 | -0.045em | 1.0 |
| Chapter title | 4xl / 590 | -0.035em | 1.05 |
| SIG page title | 24 / 600 | -0.02em | 1.2 |
| Card / section title | 15–17 / 590 | -0.01em | 1.3 |
| Body landing | 17 / 400, `--fg-2` | -0.005em | 1.6 |
| Body SIG | 13 / 400–500 | 0 | 1.5 |
| KPI value | 32 / 590, tabular | -0.025em | 1 |
| Meta | 12 / 500, `--fg-3` | 0 | 1.4 |
| Codes, kbd | Mono 11–12 / 500 | 0 | 1 |

- Display titles: neutral gradient only.
  `background: linear-gradient(180deg, var(--fg) 30%, color-mix(in oklab, var(--fg) 55%, transparent)); background-clip: text; color: transparent;`
- Sentence case everywhere. Units at 0.55em, `--fg-3`.
- Weights: 400 / 510 / 590 (variable). Never 700+ in SIG.

---

## 4. Shape, space, surfaces

```css
:root {
  --r-2: 2px;  /* wayfinding tags */
  --r-4: 4px;  /* kbd, chips */
  --r-6: 6px;  /* nav items, inputs, small buttons */
  --r-8: 8px;  /* buttons, menus, rows */
  --r-12: 12px; /* cards, panels, product frame */
  --r-16: 16px; /* landing showcases, dialogs */
  --r-pill: 999px;
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 20px; --s-6: 24px;
  --s-8: 32px; --s-10: 40px; --s-12: 48px; --s-16: 64px; --s-24: 96px; --s-32: 128px;
}
.card {
  background: linear-gradient(180deg, rgb(255 255 255 / .025), rgb(255 255 255 / .01)), var(--surface-2);
  border-radius: var(--r-12);
  box-shadow: var(--highlight), 0 0 0 1px var(--line);
}
```

- No `border` on cards: ring via box-shadow + top highlight.
- Separate with space first, `--line` second.
- Nested radius = outer − padding.

---

## 5. Landing (dark only)

Max content 1200 px, showcases 1360 px. Section rhythm `--s-32` desktop,
`--s-16` mobile. The centerline SVG runs behind all sections.

| # | Section | Content | Motion |
|---|---|---|---|
| 0 | Nav (64 px) | Logo · Producto, Método, DSS, 2045, Datos · lang · "Entrar" (ghost) · "Ver el tablero" (primary) | Blur `saturate(180%) blur(12px)` + bottom line only after 8 px scroll |
| 1 | Hero | Tag `MTR · SKMR`. H1 "El sistema de decisión del aeropuerto de Montería." Sub: "Cinco indicadores, alertas y escenarios explicables para ocupación, cumplimiento, capacidad y crecimiento a 2045." CTAs. Live P1 product frame, tilted. Runway scene behind | §6.3 hero timeline |
| 2 | Proof strip | 3–4 verified facts, tabular, source footnote | Fade 400 ms |
| 3 | 1.0 Medir | K1–K5 tiles assemble into P1 | Tiles rise, stagger 40 ms; sparklines draw |
| 4 | 2.0 Detectar | Alert inbox fragment, severity rows | Rows slide 8 px, j/k cursor moves |
| 5 | 3.0 Explicar | "Por qué" panel: formula, numerator, denominator, threshold, rule version | Terms highlight in sequence |
| 6 | 4.0 Simular | Live simulator: aircraft, frequency, load → break-even + tornado | Real interaction, 200 ms morphs |
| 7 | 5.0 Proyectar | 2045 fan (low/base/high), 80 % / 90 % trigger years | DrawSVG on scroll |
| 8 | 6.0 Gobernar | Data pipeline: sources → RC-01..08 → warehouse, status per source | Packets travel the line once |
| 9 | Teclado | "Opera sin soltar el teclado." ⌘K palette fragment + shortcut grid | Keys press in sequence |
| 10 | Final CTA | Centerline ends at threshold bar (green lights) → CTA | Threshold lights on |
| 11 | Footer | Academic credits, DEMO disclaimer, sources | — |

Chapter layout: 5/12 sticky title column (wayfinding tag + title + 2 lines)
and 7/12 UI fragment. Mobile: stacked, no pin.
UI fragments are real components with fixtures and `aria-hidden` copies
removed; each has a text summary for screen readers.

Product frame:
```css
.stage { perspective: 2000px; perspective-origin: 50% 0; }
.frame { transform: rotateX(24deg); transform-origin: 50% 0; border-radius: var(--r-12);
  box-shadow: var(--highlight), var(--shadow-3); overflow: hidden;
  mask-image: linear-gradient(to bottom, #000 55%, transparent 98%); will-change: transform; }
```

---

## 6. Motion

### 6.1 Tokens

```css
:root {
  --d-1: 100ms; --d-2: 160ms; --d-3: 240ms; --d-4: 400ms; --d-5: 700ms;
  --e-out: cubic-bezier(.16, 1, .3, 1);      /* expo-out feel */
  --e-in-out: cubic-bezier(.65, 0, .35, 1);
  --e-snap: cubic-bezier(.2, 0, 0, 1);       /* UI controls */
}
```
GSAP: `expo.out` (entrances), `power2.inOut` (transitions), `none` (scrub).

### 6.2 Rules

- Animate only `transform`, `opacity`, `clip-path`, `filter: blur ≤ 8px`.
- Every effect answers "what changed?" No idle loops except the 3D scene.
- One hero moment, one moment per chapter. SIG motion ≤ 240 ms.
- `useGSAP({ scope })` always; `gsap.matchMedia()` for reduced motion and
  ≥ 768 px; plugins registered once in `src/lib/gsap.ts`.
- ScrollTrigger only on the landing. Kill on unmount (handled by useGSAP).
- Reduced motion: no scrub, no pin, no 3D; opacity 200 ms or instant.

### 6.3 Hero timeline

| t (s) | Element | From → to | Dur |
|---|---|---|---|
| 0.00 | Scene canvas | opacity 0 → 1 | 1.6 |
| 0.10 | Tag | y 8 → 0, fade | 0.5 |
| 0.20 | H1 lines (SplitText mask) | yPercent 100 → 0, stagger .08 | 0.9 |
| 0.55 | Sub + CTAs | y 12 → 0, fade, stagger .06 | 0.6 |
| 0.75 | Product frame | rotateX 36 y 120 opacity 0 → rotateX 24 y 0 | 1.4 |
| scroll | Product frame | rotateX 24 → 0, scale .94 → 1 (scrub .6) | 0–60 % hero |
| scroll | Camera | moves forward along 3° glidepath | 0–100 % hero |

```tsx
// src/lib/gsap.ts
'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP);
export { gsap, ScrollTrigger, SplitText, useGSAP };
```

```tsx
// Hero.tsx (excerpt)
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    SplitText.create('[data-h1]', {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 100, duration: .9, stagger: .08, ease: 'expo.out', delay: .2 }),
    });
    gsap.from('[data-frame]', { rotateX: 36, y: 120, autoAlpha: 0, duration: 1.4, ease: 'expo.out', delay: .75 });
    gsap.to('[data-frame]', { rotateX: 0, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '[data-stage]', start: 'top 70%', end: 'bottom 60%', scrub: .6 } });
  });
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('[data-frame]', { rotateX: 0 });
  });
}, { scope: root });
```

Centerline: one SVG `path` behind the page, `stroke-dasharray: 12 12`,
revealed with a mask driven by DrawSVG + ScrollTrigger (`scrub: true`).

---

## 7. 3D: "Final approach" scene

- Plain three, one canvas, `dynamic(() => import(...), { ssr: false })`.
- Stylized, not to scale, not a real survey of SKMR.
- Elements: dark ground, runway plane, edge lights (InstancedMesh, warm
  white), centerline lights, green threshold bar, 4 PAPI lights left side,
  approach light bars. Exponential fog color = `--bg`. Additive sprite glow
  (no postprocessing dependency).
- Camera on 3° glidepath; scroll advances it; idle drift ≤ 0.2 units/s.
- Budgets: ≤ 6 draw calls, ≤ 50 k triangles, DPR ≤ 1.5, 60 fps on M1,
  < 120 KB gzip for the scene chunk. Pause via IntersectionObserver and
  `document.hidden`. Poster `webp` for reduced motion, low power, no WebGL.
- Never place KPI values or status in the scene.

---

## 8. SIG app (Linear-grade)

### 8.1 Shell

```
┌ Sidebar 232 ───────┬ Header 44: breadcrumb · view options · filter · as-of · DEMO tag ─┐
│ MTR · SKMR ▾       │                                                                   │
│ ⌕ Buscar     ⌘K    │  Content (list / dashboard / split view)                          │
│ ◉ Alertas      4   │                                                                   │
│ Vistas             │                                                                   │
│  ▦ Tablero         │                                                                   │
│  ⇄ Rutas           │                                                                   │
│  ✓ Cumplimiento    │                                                                   │
│  ▥ Infraestructura │                                                                   │
│  ◎ Demanda         │                                                                   │
│  ↗ Planeación 2045 │                                                                   │
│  ◇ Calidad         │                                                                   │
│ DSS                │                                                                   │
│  ⚖ Escenarios      │                                                                   │
│  ✎ Decisiones      │                                                                   │
└────────────────────┴───────────────────────────────────────────────────────────────────┘
```

- Sidebar: `--surface-1`, items 28 px, `--r-6`, 13/510, icon 16 `--fg-3`.
  Active: `--surface-3` + `--fg`. Counts right-aligned mono 11.
- Section labels 12/510 `--fg-3`, sentence case.
- DEMO tag in header: wayfinding style, tooltip with disclaimer.
- Density: lists rows 36 px; dashboards padding 24.

### 8.2 Keyboard

| Key | Action |
|---|---|
| ⌘K | Command palette (navigate, filter, open scenario, change as-of) |
| G then T/R/C/I/D/P/Q | Go to Tablero, Rutas, Cumplimiento, Infraestructura, Demanda, Planeación, Calidad |
| G then A | Alertas |
| J / K | Next / previous row |
| Enter / Esc | Open detail / back |
| F | Filter |
| ⇧D | Change as-of date |
| E | Explain focused KPI |
| ? | Shortcut sheet |

Shortcuts show as `kbd` chips (mono 11, `--surface-3`, `--r-4`) in menus
and tooltips.

### 8.3 Patterns

- **Split view:** list (420 px) + detail pane; URL reflects selection.
- **Context menu** on rows (right click / `⋯`).
- **Optimistic UI** only for local UI state; never for domain writes.
- **Empty states:** one line + one action + shortcut hint.
- **Loader:** PAPI glyph; skeletons for layout.

---

## 9. DSS: first-tier capabilities

Each capability supports human judgment. None executes operational actions.

| Capability | UI | Notes |
|---|---|---|
| **Explain (Por qué)** | `E` or info icon → panel: formula, numerator, denominator, raw value, threshold band, rule/threshold version, source + validated time, link to P7 rows | Uses domain functions; no UI math |
| **As-of time travel** | Header date scrubber; all views recompute; persistent chip "Viendo al 30 nov 2026" | Injected as-of, never "today" in demos |
| **Cross-filter + drill** | Click a series/bar → filters page; KPI tile → P-page; point → detail drawer | Filter chips in header |
| **What-if simulator** | Inputs panel (aircraft, frequency, load, costs, growth rate). Each input shows provenance: source default vs edited (accent dot) with reset | Step 8 break-even model only |
| **Goal seek** | "¿Qué necesito para…?" solve one variable (e.g. min passengers via ceil, break-even LF) | >100 % = "Inviable", never capped |
| **Sensitivity (tornado)** | ±10 % per input on outcome, sorted by impact | Mandatory next to any recommendation |
| **Scenario compare** | Up to 3 columns, baseline pinned, deltas highlighted, author/date/version | Save/compare in full SIG only |
| **Horizon 2045** | Fan low/base/high (2.5 / 3.9 / 5.5 %), base year + provenance, trigger years at 80 % / 90 % | Forecast styling always |
| **Alert inbox** | Linear-style inbox, grouped by severity, owner, period, trigger; detail with history | Workflow states need approval 🔒 |
| **Decision log** | Record decision, linked scenario snapshot, rationale, owner, date | New scope, needs approval 🔒 |
| **Committee brief** | Print/PDF stylesheet of a scenario or P1 at an as-of date | Needs approval 🔒 |

🔒 = not in the current approved scope; confirm before implementing.

---

## 10. Data visualization

- Card is the frame; no chart borders. Horizontal gridlines `--line`.
  Axis labels 11–12 `--fg-3`, tabular. No axis lines.
- Copa `--series-1`, Satena `--series-2`, fixed across the product.
- Target: 1 px dashed `--fg-3` + label "Meta 70 %". Threshold bands ≤ 6 %.
- Forecast: dashed + hatch + `Proyección` tag. Observed: solid 1.5–2 px.
- Tooltip: crosshair, all series at x, sorted, tabular, unit + period,
  `--surface-4`, `--r-8`, `--shadow-2`.
- Legend inline top-left, click isolates, hover emphasizes.
- Every chart: "Ver tabla" + `aria-label` summary.
- Reveal once (draw 700 ms, bars 400 ms stagger 30 ms). Filter morphs 240 ms.
- No 3D charts, no pie > 4 parts, no dual axes without approval.

---

## 11. Core components

| Component | Spec |
|---|---|
| Button | 32 / 36 / 44 px, `--r-8`, 13–15/510. Primary: accent fill. Secondary: `--surface-3` + ring. Ghost: hover `--surface-3`. Press `scale(.98)` 100 ms |
| IconButton | 28–32 px square, `--r-6`, `aria-label` required |
| KpiTile | Label + StatusPill · value (32, tabular) + unit · delta chip + target · sparkline 32 px · source/validated meta. Whole tile links to drill-down |
| StatusPill | 20 px, `--r-pill`, 12/510, glyph + label, tint 14 %. ok `CircleCheck`, warn `TriangleAlert`, crit `OctagonAlert`, nodata `CircleDashed` |
| Row (list) | 36 px, `--r-8` on hover/selection inset 4 px, status · title · code chip (mono) · meta · owner · time |
| Drawer | 480 px right, `--surface-1`, slide 240 ms `--e-out` |
| Palette (⌘K) | 640 px, top 20 vh, `--surface-2`, `--shadow-3`, grouped results, kbd hints |
| Tooltip | `--surface-4`, `--r-6`, 12 px, delay 400 ms |
| Kbd | mono 11, 18 px tall, `--surface-3`, `--r-4`, ring `--line-2` |
| Wayfinding tag | 22 px, `--r-2`, 11/600 uppercase, yellow-on-black or black-on-yellow |
| PAPI loader | 4 × 6 px lights, gap 6, cycle 1.2 s; static under reduced motion |

States everywhere: skeleton, empty, error, no-data, partial, stale,
unauthorized.

---

## 12. CSS Modules conventions

```
src/
  styles/tokens.css      # only place with raw values
  app/globals.css        # @layer reset, base, components; .num
  lib/gsap.ts            # plugin registration
  lib/cn.ts
  components/<Name>/<Name>.tsx | <Name>.module.css | index.ts
  landing/<Section>/...  # landing-only sections and scene
```

- camelCase classes; one root class; variants/state via `data-*`.
- Only `var(--*)`; no hex, raw px type/space/radius/shadow, `!important`,
  IDs, or `:global` outside globals. Nesting ≤ 2.
- Logical properties; container queries for components.
- `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }`.

---

## 13. Accessibility and performance

- WCAG 2.1 AA; `--fg-4` never for essential text.
- Keyboard: every action reachable; focus trap in palette/drawer/dialog.
- Landing: LCP < 2.0 s, CLS < 0.05, INP < 200 ms, JS on first load
  < 180 KB gzip (scene lazy after LCP).
- SIG: route transition < 100 ms perceived; lists virtualized > 200 rows.

---

## 14. Copy

- Spanish default, English via dictionary. No mixed strings.
- Short, factual, no hype: "Escenarios explicables", not "Insights potenciados".
- Numbers: `Intl` with `es-CO`/`en-US`. Dates "30 nov 2026"; relative in lists.

---

## 15. QA checklist

- [ ] Rendered font is Inter with features on; no serif anywhere.
- [ ] Landing at 1440 / 1024 / 390; SIG dark + light.
- [ ] Hero timeline matches §6.3; reduced motion verified.
- [ ] Scene: ≤ 6 draw calls, 60 fps, pauses offscreen, poster fallback.
- [ ] No banned tells (§1.3); ≤ 1 accent fill per viewport.
- [ ] KPI views show unit, period, source, validated time, explain panel.
- [ ] Keyboard pass (§8.2); focus visible.
- [ ] Lighthouse a11y ≥ 95; budgets in §13 met.