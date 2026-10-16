# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- App navigation for P1–P7 and alert center
- Centro de alertas fed by local JSON under `data/fixtures/demo/` (≥2 active alerts via domain engine)
- Placeholder screens P3–P7 with title and purpose (Paso 8)
- Shell screens P1–P2 and prototype smoke tests
- P6 DSS simulator: airport break-even by aircraft (ERJ-145, 737, A350 variants incl. A350K-ULR and A350F), editable revenue/cost/frequencies, 2045 projection (2.5/3.9/5.5 %) and capacity triggers 80/90 % (R16)

### Planned

- Load sim-1.0 JSON fixtures (Paso 9)
- Full P1–P7 UI and DSS simulators
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
