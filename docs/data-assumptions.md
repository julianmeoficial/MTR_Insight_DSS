# Data assumptions

## Closed reference facts (15 Oct 2026, amended 28 Oct 2026)

Treat as verified reference anchors for demos (not live feeds):

| Fact | Value | Notes |
|------|-------|-------|
| Runway length | 2,297 m | metar-taf.com; RC-08 adopted. Conflict remains vs 2,300 m local sheet |
| Runway designator | RWY 14/32 · true heading ≈ 140.5° / 320.5° | OurAirports / cartas. **Do not** adopt FlightRadar24 `09L/09R/27L` for MTR (wrong airport data) |
| 2024 traffic | 1,478,610 passengers | Highest cited figure |
| 2025 traffic | 1,452,689 passengers | Airplan / K3 rolling baseline |
| Declared annual capacity | 1,700,000 passengers | K3 denominator |
| H1 2026 snapshot | 801,353 pax · 10,502 ops | Airplan news 9 Jul 2026. Verified aggregate. **Not** K3; do not annualize |
| Official domestic routes | BAQ, BOG, EOH, MDE | aeropuertomonteria.co/rutas |
| Official international route | PTY only | Same source; Quito not on official map |
| Operating airlines | Avianca, Clic, JetSMART, LATAM, Satena | aeropuertomonteria.co/aerolineas |
| Cargo operators | Deprisa B104–B105, LATAM Cargo B106 | No published tonnage |
| Satena PTY schedule | Mon / Wed / Fri, ERJ-145 50 seats | Press; 09:55 assumed |
| International departure definition | MTR–PTY nonstop | Adopted 15 Oct |
| Copa start | December 2026 (assumed) | Announced; not on /aerolineas as of 28 Oct |

## Simulation vs observation

- **dashboard-0.2** (`data/fixtures/dashboard/`): PTY flight-level demo rows plus **national weekly aggregates** (synthetic-demo) for K1 by route/operator. Catalog files: `routes.json`, `airlines.json`, `cargo.json`, `semester-h1-2026.json`. As-of 2026-11-30. Labeled DEMO; not a substitute for monthly/quarterly business frequencies.
- National LF rows are calibrated to the H1 2026 pace and published frequencies; they are **not** airline manifests.
- Route–airline pairing for domestic legs is cross-evidence (schedules / secondary sites), not an official Airplan join table.
- **sim-1.0** (Paso 9): simulated 12-week window from 26 Oct 2026 — labeled demo; not yet loaded as the full control-table dump in this branch.
- Forecasts (e.g. Airbus GMF 3.9%) are global references, not validated Montería-specific forecasts.
- Label verified, pending, conflicting, and simulated statuses separately when fixtures arrive.
- B737 160 seats is a scenario assumption; A320neo 186 is published for JetSMART; ATR 72 68 seats is a scenario assumption for Clic.

## As-of date

Use `AS_OF_DATE` (see `.env.example`) for historical KPI evaluation. Never compute fixture results from the server’s “today”.

## Privacy

Fixtures and logs must contain only aggregates by flight/time slot. No identifiable passenger or biometric records.
