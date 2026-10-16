# Setup

## Prerequisites

- Node.js 20+ (repo developed on Node 24)
- pnpm 11 (`corepack enable` or install from https://pnpm.io)

## Install

```bash
pnpm install
```

Optional environment file:

```bash
cp .env.example .env.local
```

`AS_OF_DATE` is the business as-of date for historical demos (`America/Bogota`). Do not compute fixture KPIs from the host clock.

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Next.js development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (domain) once |
| `pnpm test:watch` | Vitest watch mode |

## Notes

- Base prototype does not require PostgreSQL.
- Full SIG database URL placeholders are commented in `.env.example` only.
- Never commit credentials or filled `.env.local` files.
