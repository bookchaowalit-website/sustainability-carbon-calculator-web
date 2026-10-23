# Carbon Calculator

A small activity ledger for a demonstrative carbon estimate: three sample lines (travel, home energy, food), a total
and a per-category breakdown. Add or remove lines; each new line uses a fixed default factor for its category.
Sample data and factors are kept in the code; this is an educational estimate, not an emissions report.

Live: https://carbon.bookchaowalit.com (Vercel deploys each push to `main`, see `PRODUCT.md`).

## What it does not do

- No real emission-factor dataset, no offsets, no certification or regulatory reporting. No account. Nothing is saved:
  a reload brings back the three sample lines.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: ledger logic, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/carbon.ts`: sample ledger, default factors and units per category, `computeTotals`, `barWidth`, `addActivity`
  (validates label and amount) and `removeActivity` (used by the page).
- `app/page.tsx`: the client ledger.
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
