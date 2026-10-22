# MTR Insight

Academic management information system (SIG) with an airport decision-support component for **Los Garzones Airport (MTR)**, Montería, Colombia.

This is **not** an official Airplan product, a live airport integration, an air traffic control system, or a certified operational decision engine.

## Scope

| Mode | What it is | Persistence |
|------|------------|-------------|
| **Base prototype** (current bootstrap) | Domain KPIs K1–K5 + alert engine; landing shell | Versioned JSON/CSV fixtures (sim-1.0 pending) |
| **Full SIG** (target 31 Oct 2026) | Screens P1–P7, ETL, auth by role, DSS | PostgreSQL (Paso 7 dimensional model) |

Mock auth, placeholders, or static fixtures must never be presented as the complete SIG.

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- CSS Modules + design tokens (`src/styles/tokens.css`); no Tailwind
- Vitest (domain tests)
- pnpm
- Deploy target: Vercel (not wired in this commit)

Auth provider, ORM, and chart libraries are intentionally unset — see [docs/decisions.md](docs/decisions.md).

## Quick start

```bash
pnpm install
pnpm dev
```

Other scripts: `pnpm lint`, `pnpm lint:copy`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

Copy [`.env.example`](.env.example) to `.env.local` if you need `AS_OF_DATE` for demos.

Demo access: open `/login` and pick a staging account. The `mtr-demo-session` cookie only filters this prototype. It is not authentication, MFA, or the full SIG. Limits and the R14 response notes are in [docs/security.md](docs/security.md).

Full setup notes: [docs/setup.md](docs/setup.md).

## Repository layout

```
src/app/            Presentation (App Router)
src/domain/         KPI, alert, and (later) DSS calculations
src/application/    Thin façade for screens
src/data/           Fixture / PostgreSQL adapters
src/config/         Versioned thresholds and alert policies
data/fixtures/      sim-1.0 datasets (placeholder README)
docs/               Architecture, KPIs, decisions, assumptions
tests/domain/       Vitest suites for KPIs and alerts
```

## Documentation

- [Architecture](docs/architecture.md) — layers and P1–P7 map
- [KPIs](docs/kpis.md) — K1–K5 formulas and traffic lights
- [Decisions](docs/decisions.md) — approved stack and open conflicts
- [Security](docs/security.md) — demo access limits and R14 response notes
- [Data assumptions](docs/data-assumptions.md)
- [Changelog](CHANGELOG.md)

## Project sources

- Notion TCC SIG: https://app.notion.com/p/ebd2fe41c4a9435b8cf0ce6003ed9f60
- Linear: https://linear.app/brevku/project/tcc-sig-0ef51885d4c2/overview

## License

See [LICENSE](LICENSE) (MIT). Do not add or replace the license without explicit approval from the rights holders.
