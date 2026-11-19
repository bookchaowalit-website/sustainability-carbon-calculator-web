# Carbon Calculator — Carbon Tally

## Look

Since 2026-11-19 the ledger uses the shared **App shell** (`app/app-shell.css`, `components/app-shell.tsx`,
see `APP-SHELL.md`): Geist via next/font, the `--as-*` light/dark tokens, category lists with counts in the
sidebar (a row of pills on phones), the ledger rows first, and the breakdown under them. Ledger-only pieces
(`.ct-*`) live in `app/globals.css` and use the shell tokens only.

- Head: list title, line count and the CO₂e estimate in one line, so the first row is above the fold on phones.
- New line opens the composer in place: activity, category (segmented), amount in the category's unit. Add stays
  disabled until both are valid, and each field says what is missing (inline, aria-live).
- Rows: activity, amount × default factor = kg, category pill, Remove (undoable for 6 seconds).
- Floor: text ≥ 12px, controls ≥ 44px, 4.5:1 text in light and dark, forced-colors support, footer link to the hub.

## Integrity

Factors are demonstrative defaults kept in `lib/carbon.ts`, not an audited dataset. The page says so; no offset or certification.
