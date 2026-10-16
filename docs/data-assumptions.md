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

- **sim-1.0** (Paso 9): simulated 12-week window from 26 Oct 2026 — labeled demo; not yet loaded in this repo version.
- Forecasts (e.g. Airbus GMF 3.9%) are global references, not validated Montería-specific forecasts.
- Label verified, pending, conflicting, and simulated statuses separately when fixtures arrive.

## As-of date

Use `AS_OF_DATE` (see `.env.example`) for historical KPI evaluation. Never compute fixture results from the server’s “today”.

## Privacy

Fixtures and logs must contain only aggregates by flight/time slot. No identifiable passenger or biometric records.
