# Strategic KPIs (K1–K5)

Source: Notion Paso 5 and Paso 8; invariants mirrored in `.cursorrules`.
Implementation: `src/domain/kpis` with thresholds in `src/config/thresholds.ts`.

Evaluate thresholds with **raw** ratios. Round only for presentation.
Missing or zero denominators return `status: "no_data"` (never false green).

## Summary

| KPI | Formula | Green | Yellow | Red |
|-----|---------|-------|--------|-----|
| **K1** Load factor by route, operator, aircraft | `sum(passengers) / sum(seats)` (not mean of flight %) | ≥ 70% | ≥ 65% and &lt; 70% | &lt; 65% |
| **K2** Regulatory / contractual compliance | satisfied with valid evidence ÷ applicable | 100% of criticals (no overdue critical) | non-critical overdue | critical overdue **or** quarterly &lt; 90% |
| **K3** Installed capacity utilization | rolling 12-month pax ÷ declared annual capacity (1.7M) | &lt; 80% | ≥ 80% and &lt; 90% | ≥ 90% |
| **K4** Regional international demand capture | direct intl departures from MTR ÷ catchment intl travelers | ≥ 20% | ≥ 10% and &lt; 20% | &lt; 10% |
| **K5** Information integrity and timeliness | critical records on time and validated ÷ expected | ≥ 98% | ≥ 95% and &lt; 98% | &lt; 95% **or** unresolved technical conflict |

## K2 evidence rule

A `completedFlag` without `evidenceId` and `approvalDate` does **not** count as satisfied. Compliance is evaluated as of the selected `asOfDate`.

## Alerts

| Trigger | Rule | Default policy |
|---------|------|----------------|
| `K1_RED_STREAK` | K1 red for N consecutive weeks | N = **2** (`alert-policies.ts`) |
| `SOURCE_NOT_LOADED` | Critical source not loaded | Owner TI / PG-01 |

### Open conflict — red streak weeks

- Pasos 5 and 8: escalate PG-02 after **three** red weeks.
- Paso 11 CP-02: escalate after **two** red weeks.

Current code uses **two** (bootstrap checklist). Documented in [decisions.md](decisions.md). **Do not mark CP-02 acceptance until the tutor decides.**

## Weekly demo windows

Fixture weekly views must be labeled as demo windows; they do not replace monthly/quarterly business frequencies in the KPI specifications.

## Notion

- Paso 5: https://app.notion.com/p/a89bad1f0bce401c8912300b4fcdb7fe
- Paso 8: https://app.notion.com/p/8e31e8e826b946c38e11592377d422f1
