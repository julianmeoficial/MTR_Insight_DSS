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

- **Amended by ADR-013** (GSAP now also in SIG, without ScrollTrigger).
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
- Real MFA, server-side authorization and PostgreSQL row policies (see ADR-010 for the demo role picker)

## ADR-010 — Demo role session for the base prototype (2026-10-21)

- **Decision:** Staging accounts live in `src/config/access-matrix.ts` and are chosen on `/login`. The choice is stored in the `mtr-demo-session` cookie and filters navigation, direct routes and the P2 operator control.
- **Context:** Paso 10 allows a role selector on the fixture prototype as a visual simulation. It is not authentication, MFA, or the full SIG.
- **Rules in code:** Paso 8/10 screen matrix. `/alertas` follows P1. `/escenarios` follows P6. `/decisiones` stays closed in this prototype. Satena and Copa are separate accounts and cannot widen the operator filter. TI sees P7 only.
- **Consequences:** Missing or unknown cookie values redirect SIG routes to `/login`. A denied route renders the restricted state. Do not describe this cookie as a protected session. Real IdP, MFA and server authorization remain deferred.

## ADR-011 — Paso 13/14 views, administration and keyboard layer (2026-10-28)

- **Decision:** Add `/situacion` (Paso 13 baseline), `/validador` (Paso 14 DSS + ERPM route × aircraft validator) and `/admin` (read-only administration). Add global `G`-sequence navigation and a `?` shortcut sheet (DESIGN.md §8.2).
- **Access (demo matrix):** `/situacion` follows P1 or P5. `/validador` follows P5 or P6. `/admin` needs the new `admin` grant (TI and gerencia general, per Paso 8 §6 "TI: P7 y administración"). Airline accounts and ANI see none of them. `/decisiones` stays closed (DESIGN.md §9 🔒).
- **Domain:** `src/domain/erpm` evaluates runway vs takeoff distance, range with reserve, MTOW vs pavement, demand vs supply, the Paso 8 airport break-even and K3 utilization after the route. Verdicts: viable preliminar, condicionado, no viable, sin datos. Missing PCN or demand is a data gap, never a pass. An operating route is not added twice to K3.
- **Assumptions:** Scenario presets live in `src/config/erpm-scenarios.ts` (`erpm-1.0.0`). Restrictive multiplies takeoff distance by 1.15 and demand by 0.8; favorable multiplies demand by 1.2. MTOW, range and takeoff distances are manufacturer references. Route demand in `data/fixtures/dashboard/situation.json` is an academic assumption. All of these need validation before any real use.
- **Not covered:** Real performance calculations, PCN, elevation/temperature correction, slots, airline fare models.

## ADR-012 — Count-up kept, with a rule (2026-10-28, amended)

- **Decision:** Count-up stays (product owner request). DESIGN.md §6.4 now defines it: first reveal from 0 in 700 ms, updates tween from the previous value in 320 ms, final figure in HTML and for screen readers, and status pills appear only when the number settles (`SettleReveal`).
- **Context:** The first pass removed it because P1 showed "58,5 · En meta" while counting to 74,3 %. The settle rule fixes that contradiction without dropping the animation.

## ADR-013 — Notion typography and GSAP in SIG (2026-10-28)

- **Decision:** Replace Inter + JetBrains Mono with Archivo (titles, width axis), IBM Plex Sans (text and UI) and B612 Mono (KPIs, codes, dates), as defined in Notion "MTR Insight · Filosofía de diseño". `--series-4` moves from violet to Sinú ochre `#C8894B`.
- **Amends ADR-006:** GSAP is allowed in the SIG for count-up, chart reveals and value tweens. ScrollTrigger stays landing-only.

## ADR-014 — Expansion assumptions in the validator (2026-10-28)

- **Decision:** `/validador` gets an assumptions rail. Runway length and terminal capacity are airport inputs applied to every scenario; demand, takeoff factor, revenue, cost and frequencies are per scenario. Each field shows its source or preset, an edited marker and a reset.
- **Purpose:** Use the DSS to evaluate an airport expansion project (for example a longer runway) before it exists. Results with edited values describe a hypothetical project and the UI says so.
- **Domain:** `resolveScenario`, `requiredRunwayM` and `routeSensitivity` (±10 %, ±1 frequency) in `src/domain/erpm`, with tests.

## ADR-015 — Expansion master plan in the DSS (2026-10-28)

- **Decision:** Model a future MTR with a second runway 14L/32R (4.000–4.200 m, default 4.100 m, 60 m wide, PCN 90, CAT II) and an international Terminal 2 (code E, 4 widebody stands, 2.500.000 pax/year), plus ARFF category 9. Terminal 1 and runway 14/32 stay as today (2.297 m verified; width 40 m, PCN 50 and CAT I simulated).
- **Validator:** `infraConfig` (current or expansion) and a terminal choice (automatic, T1, T2). Checks per aircraft: takeoff length, width, ACN vs PCN, approach category for the route segment, ARFF, terminal code letter and border control, range with reserve, demand, airport break-even and terminal utilization. T2 starts empty, so its utilization is only the routes assigned to it.
- **Routes added:** Paris (CDG), Tokyo Narita (NRT) and Seoul Incheon (ICN) as proposed intercontinental scenarios next to Madrid. With a 10 % reserve the A350-900 cannot reach Incheon and the A350-1000 can; the restrictive 15 % reserve rules out both.
- **2045 planning:** P6 and Escenarios compare R16 trigger years with T1 alone and with T1 + T2.
- **Status:** All expansion data is simulated for the academic project and labeled in the UI. It is not an announced Airplan or Aerocivil plan.

## ADR-016 — Aeronautical UI layer (2026-10-28)

- **Decision:** Add a schematic aerodrome chart (P4 and validator), split-flap code reveals, `SKMR` location tags on every SIG header, a dashed centerline as the active nav indicator, a runway mandatory sign tag, PAPI route loaders and a grouped account picker on `/login`.
- **Boundaries:** Status colors stay for KPI states; the red runway tag follows real airport signage and carries no data. No new hex values outside `tokens.css`.
