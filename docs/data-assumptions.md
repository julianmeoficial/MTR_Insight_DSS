# Data assumptions

## Closed reference facts (15 Oct 2026)

Treat as verified reference anchors for demos (not live feeds):

| Fact | Value | Notes |
|------|-------|-------|
| Runway length | 2,297 m | metar-taf.com |
| 2024 traffic | 1,478,610 passengers | Highest cited figure |
| Declared annual capacity | 1,700,000 passengers | K3 denominator |
| Satena schedule | Mon / Wed / Fri, ERJ-145 50 seats | Press; 09:55 assumed |
| International departure definition | MTR–PTY nonstop | Adopted 15 Oct |
| Copa start | December 2026 (assumed) | Not officially confirmed; flight numbers may be null |

## Simulation vs observation

- **dashboard-0.1** (`data/fixtures/dashboard/`): synthetic weekly windows for P1–P7 DSS UI (as-of 2026-11-30), plus infrastructure conflict, competitors and ETL log. Labeled DEMO; not a substitute for monthly/quarterly business frequencies.
- **sim-1.0** (Paso 9): simulated 12-week window from 26 Oct 2026 — labeled demo; not yet loaded as the full control-table dump in this branch.
- Forecasts (e.g. Airbus GMF 3.9%) are global references, not validated Montería-specific forecasts.
- Label verified, pending, conflicting, and simulated statuses separately when fixtures arrive.
- B737 160 seats is a scenario assumption; Jetstream 32 appears as reference capacity only.

## As-of date

Use `AS_OF_DATE` (see `.env.example`) for historical KPI evaluation. Never compute fixture results from the server’s “today”.

## Privacy

Fixtures and logs must contain only aggregates by flight/time slot. No identifiable passenger or biometric records.
