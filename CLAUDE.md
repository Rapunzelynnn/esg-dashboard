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

## Browser Verification

Use the Claude-in-Chrome extension (`mcp__claude-in-chrome__*` tools) for all UI verification.

### When to verify visually

**For plan-driven work:**
The plan is the authority. Trigger Chrome verification only at the exact step the plan marks for it, after all that step's prerequisite steps are complete. Do not verify earlier — even if visual files were already modified.

**For ad-hoc requests (no plan):**
Complete ALL code changes for the request first, then check: if any modified file's template, `<style>` block, Tailwind classes, or component structure changed, trigger Chrome verification once. Never verify after a single file edit if more changes are still needed to fulfill the request.

**Skip Chrome verification when all changes are purely non-visual:**
- TypeScript type fixes, interface changes, or type annotations only
- Store or data logic with no change to rendered output
- Utility functions, constants, or CSV parsing
- A plan step has no verify instruction and no dependent verify step

### Rules

- **Always use Chrome** via the Claude-in-Chrome extension
- Never use other browsers (Safari, Firefox, Dia, Arc, etc.) for UI verification
- Dia also has the Claude extension installed — **never call `switch_browser`**, it broadcasts to all browsers including Dia and is disruptive
- Dev server default port is 5174, but may differ if that port is occupied

### Project-Specific: Scale Transform

`DashboardLayout.svelte` wraps the page with a `scale(0.5)` CSS transform. Screenshots show everything at **half the coded size** — a component written at `width: 1200px` appears as 600px in the browser. When evaluating screenshots, account for this: do not flag correctly-sized elements as "too small."

### Dedicated Window Concept

All Claude-navigated pages stay in a single dedicated Chrome window — separate from the user's other Chrome windows. Claude creates and reuses this window automatically; the user never opens it manually. The dedicated window is identified by matching `http://localhost:<port>` in the connected Chrome session.

### Connecting Chrome

Connection is established via a native messaging host — no manual "Connect" popup. The extension (Claude in Chrome Beta) auto-connects on every session once the host is configured.

**One-time setup:** The user runs `/chrome` in the Claude Code CLI to install the native messaging host, then restarts Chrome.

**If disconnected:** Prompt the user **once**: _"The Chrome extension isn't connecting. Please run `/chrome` in Claude Code CLI, then let me know when done."_ Retry `tabs_context_mcp` once after they confirm. If still failing, note the issue and stop.

If `tabs_context_mcp` returns "Multiple Chrome extensions connected", prompt the user to run `/chrome` → "Reconnect extension".

### Workflow Decision Tree

**Step 1 — Ensure the dev server is running:**
```bash
lsof -i :5173 -i :5174 -i :5175 | grep LISTEN
```
- Port is listening → note it as `<port>`
- Nothing listening → run `npm run dev` in background, then retry `lsof` every 2s (up to 15s) until a port responds. If no port appears after 15s, stop and prompt the user: "The dev server didn't start — please check for errors and let me know when it's running."

**Step 2 — Verify extension connection** via `tabs_context_mcp`:
- Returns tab data → proceed to Step 3
- Returns "Browser extension is not connected" → prompt user once as above

**Step 3 — Find the dedicated window** via `tabs_context_mcp`:
- Look for any tab whose URL is `http://localhost:<port>` (this app has one route: `/`)
- Multiple matches → prefer the window with the fewest total tabs
- Match found → reuse that tab; do not open new windows or tabs
- No match → go to Step 4

**Step 4 — Create the dedicated window** (only when Step 3 finds nothing):
Call `tabs_context_mcp` with `createIfEmpty: true`. Do NOT use `open -na "Google Chrome"` or any bash command.

**Step 5 — Stay in the dedicated window:**
- All navigation: use `navigate` on the identified tab ID
- If the server dies mid-session (connection error in screenshot or console), re-run Step 1 to restart it before retrying
- Before screenshotting: wait 2s for Vite HMR, then call `read_console_messages` with pattern `(?i)(error|\[vite\])`:
  - `[vite] hmr update` seen → HMR succeeded; proceed to screenshot
  - `[vite] full reload` seen → Vite is already reloading; wait an additional 2s, then screenshot
  - No `[vite]` messages → HMR may not have fired; call `navigate` on the tab to force a reload, then wait 2s
  - JS errors present → note them; likely the root cause of any visual issue
- Use `computer` (screenshot) for visual verification — remember the 0.5x scale transform
- If screenshot shows a problem, fix and re-screenshot (max 3 total attempts before escalating to the user)
