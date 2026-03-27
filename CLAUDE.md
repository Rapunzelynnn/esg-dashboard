# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (localhost:5173)
npm run build        # production build
npm run preview      # preview production build
npm run check        # TypeScript + Svelte type checking
npm run check:watch  # type checking in watch mode
```

No test runner is configured (only a placeholder `src/index.test.ts` exists).

## Architecture

Single-page SvelteKit app that visualizes S&P 500 ESG data. No backend — all data is loaded client-side from two static CSV files:

- `static/processed_sp500_esg_data.csv` — company ESG scores, market cap, industry metadata
- `static/processed_sp500_price_data.csv` — historical price data (wide format: rows=dates, columns=ticker symbols)

**Data flow:**
1. `src/routes/+page.svelte` fetches both CSVs on mount
2. `src/lib/stores/index.ts` parses the ESG CSV via `parseCSV()` and populates the `companies` Svelte writable store; also exports `loadPriceData()` for per-symbol price loading
3. Components read from `$companies`, `$selectedCompany`, and `$priceDataStore` stores
4. `selectedCompany` is set by `CompanySearch.svelte` and drives the `CompanyProfile` panel

**Layout:**
`+page.svelte` is the only route. It renders two sections:
- **Company Profile** (top ~35%): `CompanySearch` + `CompanyProfile` + `StockPriceChart` + `ESGScores`
- **Overall Analysis** (bottom ~65%): tab-navigated charts — `ESGIndustryAnalysis`, `MarketCapCorrelation`, `ScoreComparison`, `StockPriceCorrelation`

`DashboardLayout.svelte` wraps the page with a `scale(0.5)` CSS transform to simulate 50% browser zoom — the internal layout is designed at 2× viewport size. This means chart/component dimensions in code will appear doubled relative to actual rendered size.

**Key types** (`src/lib/types.ts`):
- `Company` — the primary data model (symbol, ESG scores nested by E/S/G, marketCap, beta, industry)
- `FilterState` — filter panel state shape (not yet wired to chart filtering in all components)

**Note:** `src/lib/utils/dataLoader.ts` defines `ESGData`/`RawESGData` types and processing functions that are unused by active components — the real parsing is in `src/lib/stores/index.ts`.

## Active Refactoring

This project is undergoing a structured refactor. Before starting any implementation work, read:
**`docs/refactoring-overview.md`** — covers all four phases, decisions made, and how to start each session.

Current branch structure: `main` (stable) → `dev` (integration) → feature branches.
All feature branches start from `dev`, not `main`.

To start a refactoring phase:
1. `git checkout dev && git checkout -b refactor/<phase-name>`
2. Read the relevant phase section in `docs/refactoring-overview.md`
3. Run the `writing-plans` skill to generate the detailed plan for that phase

## UI Stack

- SvelteKit 2 + Svelte 4
- Tailwind CSS (utility classes used directly in components)
- Chart.js 4 via `svelte-chartjs` wrapper (line charts use time scale with `chartjs-adapter-date-fns`)
- shadcn-style `Card` component in `src/lib/components/ui/card/`
- `lucide-svelte` for icons
