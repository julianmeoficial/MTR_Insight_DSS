# Approved decisions

Record of stack and policy choices for MTR Insight. Do not change scope silently.

## ADR-001 — Package manager and UI stack (2026-10-16, amended)

- **Decision:** pnpm + Next.js App Router + TypeScript strict + Vitest.
- **Styling (amended 2026-10-16):** CSS Modules + global design tokens. Tailwind CSS removed.
- **Consequences:** Lockfile is `pnpm-lock.yaml`. Co-located `*.module.css`; no utility-class styling.

## ADR-002 — Domain-first KPIs before UI (2026-10-16)

- **Decision:** Ship pure domain functions for K1–K5 and alerts before screens P1–P7 and before loading sim-1.0 JSON.
- **Context:** Paso 9 prototype needs correct formulas; UI must not redefine them.
- **Consequences:** Tests use inline typed fixtures. `data/fixtures/sim-1.0` remains a placeholder until the next iteration.

## ADR-003 — K1 red-streak weeks = 2 (provisional) (2026-10-16)

- **Decision:** `alertPolicies.k1RedStreak.redStreakWeeks = 2`.
- **Conflict:** Pasos 5/8 specify 3 weeks; Paso 11 CP-02 specifies 2.
- **Status:** Provisional — awaiting tutor decision. CP-02 must not be marked passed until resolved.
- **Change process:** Update `src/config/alert-policies.ts` version and this ADR when approved.

## ADR-004 — DESIGN.md tokens over Figma GOGO pastel (2026-10-16)

- **Decision:** P1/P2 UI uses semantic tokens from `DESIGN.md` (`ok`/`warn`/`crit`: `#4FA36B` / `#E39B2D` / `#D9483B`). KPI tiles follow §8.3 (2 px status bar + glyph + label), not full-card pastel fills.
- **Conflict:** Figma frame GOGO (node 3:238) uses `#62a250` / `#d2ac3b` / `#d04f4f` and pastel badge fills.
- **Status:** Approved for this pass — informational structure from GOGO adapted to DESIGN anatomy.
- **Consequences:** Visual pixel-match to GOGO is out of scope; accessibility and token consistency take priority.

## ADR-005 — Three.js apron ambience only (2026-10-16)

- **Decision:** `three` + `@types/three` allowed solely for contained “apron at dusk” canvas behind P1 hero/header. No 3D globes, neon HUD, or KPI data in WebGL.
- **Also approved:** `lucide-react`, `motion` (`motion/react`). Charts remain custom SVG/CSS; visx deferred until needed.
- **Consequences:** `prefers-reduced-motion` disables or freezes the canvas; analytics stay in domain + SVG.

## ADR-006 — GSAP + ScrollTrigger only on landing (2026-10-16)

- **Decision:** Add `gsap` for editorial landing reveals, fan-chart stroke draw and ≤8 % parallax (disabled on touch / reduced-motion).
- **Boundary:** No GSAP inside `/p1`–`/p7`. App shell keeps Motion for nav indicator and KPI cross-fades (no count-up).
- **Consequences:** Landing motion is calm and once-per-element; charts in SIG stay SVG/CSS.

## ADR-007 — Public `/` vs SIG route group `(sig)` (2026-10-16)

- **Decision:** Landing lives at `/` without AppShell. P1–P7 and Alertas live under `src/app/(sig)` so URLs stay `/p1`…`/alertas` but share DemoBanner, NavRail and TopBar.
- **Also:** Theme (`data-theme`) and locale (ES/EN) cookies with inline boot script to avoid flash; dark remains SIG default preference when unset.

## ADR-008 — CSS Modules replace Tailwind (2026-10-16)

- **Decision:** Remove `tailwindcss` and `@tailwindcss/turbopack`. Style with DESIGN.md tokens in `globals.css` and co-located CSS Modules.
- **Landing inspiration:** Statamic rhythm (hero landscape + overlapping product panel) translated to apron dusk + LIVE KPIs.
- **SIG inspiration:** Billow cockpit — one continuous frame, zero-gap KPI cells.
- **Toggles:** Lucide `Sun`/`Moon`/`Languages` icon buttons only (no text labels).
- **Consequences:** DESIGN.md v2 is source of truth; utility classes are banned.

## ADR-009 — DSS airport break-even + 2045 projection (2026-10-16)

- **Decision:** Implement P6 DSS with the Paso 8 **airport** economics model, not airline ticket fares.
- **Editable inputs mapped from checklist:**
  - “Tarifa media” → **ingreso medio por pasajero** \(T_{aeroportuaria} + I_{comercial}\)
  - “Costo por vuelo” → \(C_{fijo} + C_{variable}\) agregado
  - “Frecuencias” → vuelos/semana · sentido
- **Formula:** \(LF_{eq} = C_{vuelo} / ((T+I) \times A_{ofrecidos})\); values &gt; 100 % are **infeasible** (not capped).
- **Aircraft catalog:** ERJ-145 and 737 for current MTR ops; A350-900, A350-1000, A350-1000ULR (`A350K-ULR`), A350F (cargo), ACJ350 for expansion scenarios only.
- **Projection:** \(P(t)=P(2024)\times(1+r)^{t-2024}\) with r ∈ {2.5 %, 3.9 % GMF Airbus global, 5.5 %}; capacity triggers at 80 % / 90 % (R16).
- **Consequences:** Domain in `src/domain/dss`; UI on `/p6`; no chart library added.

## Explicitly deferred

- Chart library (visx if SVG composables become insufficient)
- ORM / PostgreSQL client
- Identity provider (Supabase Auth is an example only, not selected)
- Real auth / enforced role matrix (UnauthorizedState stub only)
