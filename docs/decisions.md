# Approved decisions

Record of stack and policy choices for MTR Insight. Do not change scope silently.

## ADR-001 — Package manager and UI stack (2026-10-16)

- **Decision:** pnpm + Next.js App Router + TypeScript strict + Tailwind CSS + Vitest.
- **Context:** `.cursorrules` leaves styling, charts, ORM, auth, and test runner open; team chose these for the base prototype.
- **Consequences:** Lockfile is `pnpm-lock.yaml`. New major dependencies require approval.

## ADR-002 — Domain-first KPIs before UI (2026-10-16)

- **Decision:** Ship pure domain functions for K1–K5 and alerts before screens P1–P7 and before loading sim-1.0 JSON.
- **Context:** Paso 9 prototype needs correct formulas; UI must not redefine them.
- **Consequences:** Tests use inline typed fixtures. `data/fixtures/sim-1.0` remains a placeholder until the next iteration.

## ADR-003 — K1 red-streak weeks = 2 (provisional) (2026-10-16)

- **Decision:** `alertPolicies.k1RedStreak.redStreakWeeks = 2`.
- **Conflict:** Pasos 5/8 specify 3 weeks; Paso 11 CP-02 specifies 2.
- **Status:** Provisional — awaiting tutor decision. CP-02 must not be marked passed until resolved.
- **Change process:** Update `src/config/alert-policies.ts` version and this ADR when approved.

## ADR-004 — DSS airport break-even + 2045 projection (2026-10-16)

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

- Chart library
- ORM / PostgreSQL client
- Identity provider (Supabase Auth is an example only, not selected)
- Figma / DESIGN.md tokens

