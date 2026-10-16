# Architecture

## Layers

```
Presentation (src/app, src/components)
        ↓
Application  (src/application) — façade / use-cases
        ↓
Domain       (src/domain/kpis, alerts, dss)
        ↓
Data         (src/data/fixtures | postgres) — shared typed contracts
```

- KPI, alert, and DSS formulas are pure TypeScript functions under `src/domain`.
- Components must consume `KpiResult` / `AlertEvent`; they must not redefine thresholds.
- Fixture and PostgreSQL adapters should share the same input record types.

## Screens (Paso 8) — not implemented in 0.1.0

| Screen | Question | KPI |
|--------|----------|-----|
| P1 Tablero ejecutivo | ¿Cómo está el aeropuerto hoy? | K1–K5 |
| P2 Rutas y ocupación | ¿La ruta es sostenible? | K1 |
| P3 Cumplimiento | ¿Qué cumple y qué falta? | K2 |
| P4 Infraestructura | ¿Soporta el crecimiento? | K3 |
| P5 Desarrollo de rutas | ¿Cuánta demanda regional capta MTR? | K4 |
| P6 Planeación 2045 (DSS) | ¿Cuándo ampliar? | DSS — interactive break-even + 2045 projection on `/p6` |
| P7 Calidad del dato | ¿La información es confiable? | K5 |

P1, P2, and the alert center will import from `@/application` or `@/domain`.

## Config

| Module | Role |
|--------|------|
| `src/config/thresholds.ts` | Traffic-light cutoffs (versioned) |
| `src/config/alert-policies.ts` | Alert streak length, owners, policy refs |
| `src/config/aircraft.ts` | DSS aircraft catalog (MTR ops + A350 expansion) |
| `src/config/dss-defaults.ts` | Break-even defaults and 2045 rates/capacity |

## DSS domain

- `src/domain/dss/break-even.ts` — airport \(LF_{eq}\)
- `src/domain/dss/projection-2045.ts` — GMF-style scenarios and 80/90 % triggers
- UI: `src/components/dss/*` consumes domain results only

## Time zone

Business dates use `America/Bogota`. Inject `AS_OF_DATE` for demos; never use `Date.now()` for fixture KPI evaluation.
