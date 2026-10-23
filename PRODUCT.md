# Carbon Calculator — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `carbon-calculator`, evidence Prototype) on
> 2026-10-23.

## What it is

A client-only activity ledger with demonstrative emission factors and no data source.

## Who it is for

A curious individual, or a portfolio visitor, who wants to see which everyday inputs make up a rough estimate.

## What works today

1. A ledger that starts with three sample lines (motorbike commute, grid electricity, rice meal) and shows each
   line's kg CO₂e (amount × factor).
2. A running total and a Travel / Home / Food breakdown with proportional bars.
3. Add a line: label, category and amount. The unit follows the category (km, kWh, servings) and the factor is that
   category's fixed default (Travel 0.04, Home 0.42, Food 0.38 kg CO₂e per unit). Blank labels and amounts that are not
   positive numbers are ignored.
4. Remove any line.
5. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- The factors are illustrative defaults, not a sourced or audited dataset; there is no supplier data, offset purchase,
  certification or regulatory reporting.
- Nothing is saved: the ledger lives in page memory and resets on reload. No account, storage or sync. No API route.

## Live URL and deploy state

- Live: https://carbon.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-carbon-calculator-frontend` is linked to this repository
  (`bookchaowalit-website/sustainability-carbon-calculator-web`, branch `main`), so each push to `main` deploys to
  production. Last production deploy before this work: 2026-10-23, commit 5c63983 (Git, READY).
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `sustainability-carbon-calculator-web`, org
  `personal-yu0`).

## Boundaries

- Browser-only, no server data. The only outbound call is a Sentry error report, when the DSN is set.
