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

## Explicitly deferred

- Chart library
- ORM / PostgreSQL client
- Identity provider (Supabase Auth is an example only, not selected)
- DSS break-even and 2045 projection modules (`src/domain/dss` placeholder)
- Figma / DESIGN.md tokens
