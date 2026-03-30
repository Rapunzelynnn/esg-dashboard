# ESG Dashboard — Refactoring Overview

**Created:** 2026-03-27
**Branch strategy:** `main` (stable) → `dev` (integration) → feature branches → back to `dev` → `main`
**Status:** Phase 1 complete, merged to `dev`

---

## Context

Single-page SvelteKit app visualizing S&P 500 ESG data. Data is public and updated yearly via Python scraping. Solo project.

### Known issues in current codebase
- Price CSV downloaded twice on page load; re-fetched per company on every selection
- `$: console.log(...)` reactive statement in a `.ts` module (does not work as intended)
- `ProcessedCompanyData` interface declared twice in `types.ts`
- `dataLoader.ts` exists but is entirely unused
- `FilterPanel.svelte` / `FilterState` defined but not wired to chart filtering
- All commits on `main`, no branching history

---

## Phase Execution Order

| Phase | Branch | Scope | Depends On | Status |
|-------|--------|-------|------------|--------|
| 0 | — | Set up `dev` branch (done) | — | **Done** |
| 1 | `refactor/data-layer` | Fix loading bugs, consolidate data module | — | **Done** |
| 2 | `refactor/svelte5-migration` | Full Svelte 4 → 5 rewrite | Phase 1 | Pending |
| 3 | `refactor/d3-charts` | Replace Chart.js analysis charts with D3 | Phase 2 | Pending |
| 4 | `chore/github-actions-data-update` | Python scraper + GitHub Actions workflow | Independent | Pending |

Each phase: branch from `dev` → implement → PR into `dev` → when all phases stable → merge `dev` into `main`.

---

## Phase 1 — Data Layer

**Branch:** `refactor/data-layer`
**Goal:** Fix performance bugs and consolidate all data loading into one clean module.

### Decisions
- Keep static CSVs in `static/` — data is public, yearly updates, no hosting needed
- Load both CSVs once on app start; parse price CSV into a full in-memory `Map<symbol, PriceData[]>` upfront so company selection requires zero network requests
- Yearly update workflow: Python scraper in `scripts/` → GitHub Actions `workflow_dispatch` → commits updated CSVs

### Target structure
```
src/lib/data/
  csvParser.ts       ← parse ESG CSV → Company[]
  priceLoader.ts     ← parse price CSV → Map<symbol, PriceData[]>
  index.ts           ← export: loadAllData()
scripts/
  scrape_esg.py
.github/workflows/
  update-data.yml
```

### What to remove
- Duplicate `loadPriceData` in `+page.svelte`
- `src/lib/utils/dataLoader.ts` (unused)
- All `console.log` / `console.warn` debug statements
- Duplicate `ProcessedCompanyData` declaration in `types.ts`

### Detailed plan
→ See `docs/superpowers/plans/2026-03-27-data-layer.md`

### Completion
Merged to `dev` on 2026-03-27. All four stages implemented:
1. Dead code removal (duplicate `ProcessedCompanyData`, unused `dataLoader.ts`)
2. Created `src/lib/data/` module (`csvParser.ts`, `priceLoader.ts`, `index.ts`)
3. Rewired stores and components — single `loadAllData()` call on mount
4. Cleaned debug statements, verified production build

---

## Phase 2 — Svelte 4 → 5 Migration

**Branch:** `refactor/svelte5-migration`
**Goal:** Full rewrite to Svelte 5 runes. No legacy mode.

### Key syntax changes
| Svelte 4 | Svelte 5 |
|----------|----------|
| `writable(value)` | `$state(value)` in `.svelte.ts` |
| `export let prop` | `let { prop } = $props()` |
| `$: derived = ...` | `let derived = $derived(...)` |
| `$: { sideEffect }` | `$effect(() => { sideEffect })` |
| `on:click={fn}` | `onclick={fn}` |

### Migration order (bottom-up)
1. Leaf UI components — `ESGScores`, `CompanySearch`, card components
2. Chart components — `StockPriceChart`, `ESGIndustryAnalysis`, `MarketCapCorrelation`, `ScoreComparison`, `StockPriceCorrelation`
3. Stores → `src/lib/state.svelte.ts` using module-level `$state`
4. Root — `+page.svelte`, `DashboardLayout.svelte`

### Notes
- `svelte-chartjs` will be removed in Phase 3 — migrate it as-is in Phase 2, then replace in Phase 3
- `FilterState` is not wired to charts — migrate it as-is, do not wire during this phase
- Update `svelte-check` and `@sveltejs/kit` to latest compatible versions

### Detailed plan
→ Write at start of Phase 2 session using `writing-plans` skill

---

## Phase 3 — D3 Chart Library

**Branch:** `refactor/d3-charts`
**Goal:** Replace Chart.js in the four analysis charts with D3 for map-like zoom/pan interaction.

### Motivation
Analysis charts (ESGIndustryAnalysis, MarketCapCorrelation, ScoreComparison, StockPriceCorrelation) show 500 S&P 500 companies. Wide data ranges force charts to zoom far out, making clustered points indistinguishable. Users need scroll-to-zoom and drag-to-pan to inspect detail.

### Decisions
- **Keep Chart.js** for `StockPriceChart` (company-level line chart — works fine as-is)
- **Replace Chart.js** with D3 in all four analysis charts
- Use `d3-zoom` for scroll/pinch zoom + drag pan
- Use `d3-selection`, `d3-scale`, `d3-axis` for rendering
- Use Svelte 5 `$effect` to re-render on data/filter change
- Shared utilities in `src/lib/charts/` (scales, axes, zoom setup) to avoid duplication

### Target structure
```
src/lib/charts/
  zoom.ts            ← d3-zoom setup, shared config
  scales.ts          ← reusable scale builders
  axes.ts            ← reusable axis renderers
```

### Interaction spec
- Scroll wheel: zoom in/out centered on cursor
- Drag: pan across the chart
- Double-click or button: reset to default view
- Tooltip on hover: company name + metric values

### Detailed plan
→ Write at start of Phase 3 session using `writing-plans` skill

---

## Phase 4 — GitHub Actions Data Update

**Branch:** `chore/github-actions-data-update`
**Goal:** Automate yearly CSV regeneration via Python scraper + GitHub Actions.

### Decisions
- Trigger: `workflow_dispatch` (manual trigger once a year) + optional `schedule: cron`
- Scraper outputs directly to `static/processed_sp500_esg_data.csv` and `static/processed_sp500_price_data.csv`
- Workflow auto-commits updated files with message `chore: update ESG data YYYY`

### Target structure
```
scripts/
  scrape_esg.py          ← fetches ESG scores, outputs ESG CSV
  scrape_prices.py       ← fetches price history, outputs price CSV
  requirements.txt
.github/workflows/
  update-data.yml
```

### Detailed plan
→ Write at start of Phase 4 session using `writing-plans` skill

---

## How to Start a New Session

1. Check out the relevant phase branch: `git checkout refactor/data-layer`
2. Reference this file for context
3. Run the `writing-plans` skill to generate the detailed stage-by-stage plan for that phase
4. Implement following the plan

## Git Workflow Per Phase

```bash
git checkout dev
git checkout -b refactor/<phase-name>
# ... implement ...
git push -u origin refactor/<phase-name>
# open PR into dev, review, merge
```

When all phases are merged into `dev` and stable:
```bash
git checkout main
git merge dev
git push origin main
```
