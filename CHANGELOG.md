# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Aerodrome expansion as a midfield master plan: parallel RWY 14L/32R at 1.500 m, T2 pier and headhouse facing it, intermodal hub with a pedestrian skybridge T1 to T2, roundabout and one-way ring, taxi and bus bays, an elevated parcel belt between T1 cargo and a T2 cargo annex, parking, hotel, park, MRO hangar, fuel farm and fire station; selectable hub and support zone in the sidecar
- Aerodrome 3D rebuilt: to-scale runways, aprons, stands, cargo docks, tower, lights, sign tags, camera presets, loading and fallback states
- P5 future route planner (national/international, current/expansion), P2 national/international switch, alert read marks
- Weekly national demo data with seasonality; 2045 planning with the full aircraft catalog
- Expansion model: runway 14L/32R and Terminal 2 (simulated), infrastructure and terminal selectors in `/validador`, A350 requirements (width, ACN/PCN, CAT, ARFF, code letter), CDG/NRT/ICN routes
- Aerodrome chart, split-flap codes, PAPI route loaders, centerline nav indicator and grouped account picker
- P6/Escenarios trigger years for T1 vs T1 + T2
- Count-up on the landing starts when each figure enters the viewport; proof facts count from config values
- `/situacion` (Paso 13): routes and opportunities by evidence stage, upgrades and the ERPM data inventory, split view with J/K and URL selection
- `/validador` (Paso 14): route × aircraft validator for airport and airline perspectives, base/favorable/restrictive presets, checks, data gaps and scenario comparison (`src/domain/erpm`, tested)
- `/admin`: read-only access matrix, threshold and alert policy versions, quality rules and the open PG-02 conflict
- Global `G` navigation, `?` shortcut sheet and palette entries filtered by role; J/K in the alert center
- Editorial landing at `/` (DESIGN §10.1): hero, numbered sections, GSAP reveals
- Theme and ES/EN toggles with cookie persistence and boot script (no flash)
- Route group `(sig)` for P1–P7/Alertas; public landing outside AppShell
- Domain DSS (ceil occupancy helpers, airport break-even, 2045 fan and capacity triggers) and P3–P7 screens on fixtures
- P6 DSS simulator: airport break-even by aircraft (ERJ-145, 737, A350 variants incl. A350K-ULR and A350F), 2045 projection (2.5/3.9/5.5 %) and capacity triggers 80/90 % (R16)
- App navigation for P1–P7 and alert center
- Centro de alertas fed by local JSON under `data/fixtures/demo/`

### Changed

- Aerodrome 3D: sage and charcoal palette, steel-teal glazing, Lambert materials with async shader compile (first frame from about 4.5 s to 0.2 s), tighter camera framing
- Fixed: sections shrinking inside the scroll column (Situación actual list overlapping the next section), page-level scroll from screen-reader helpers, separator tightening applied to non-monospace figures
- P4, P5 and P7 rebuilt on shared token-only view styles (no inline styles); KPI headline component
- Screen titles follow DESIGN.md §3 (24/600) with sentence-case breadcrumbs instead of uppercase eyebrows
- Removed count-up animation everywhere (DESIGN.md §1.3) and the colored bar on the P2 KPI hero
- DESIGN.md: CSS Modules stack; SIG shell
- Global tokens + `*.module.css` only; Tailwind and `@tailwindcss/turbopack` removed
- Dark theme default for SIG screens; AppNav replaced by AppShell

### Planned

- Load sim-1.0 JSON fixtures (Paso 9)
- Full P3–P7 UI and DSS simulators
- PostgreSQL + ETL for full SIG


## [0.1.0] — 2026-10-16

### Added

- Next.js App Router scaffold with TypeScript strict, Tailwind CSS, and pnpm
- Layered folder tree (`domain`, `application`, `data`, `config`, `docs`, `tests`)
- Domain module for strategic KPIs K1–K5 with Paso 8 traffic-light thresholds
- Alert engine with K1 red-streak and source-not-loaded rules
- Versioned threshold and alert policy config (red streak default: 2 weeks; conflict with Paso 5/8 documented)
- Vitest domain tests (boundaries, zero denominators, evidence rules, alert idempotency)
- Project documentation: README, setup, architecture, KPIs, decisions, data assumptions
- Minimal landing page stating base-prototype scope
