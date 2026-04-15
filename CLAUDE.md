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

### Rules

- **Always use Chrome** via the Claude-in-Chrome extension
- Never use other browsers (Safari, Firefox, Dia, Arc, etc.) for UI verification
- Dia also has the Claude extension installed — **never call `switch_browser`**, it broadcasts to all browsers including Dia and is disruptive
- The MCP tool response has no `browser` field — there is no programmatic way to confirm Chrome vs Dia. The only safeguard is the "Multiple Chrome extensions connected" error. Ensure Dia's extension is not connected during Claude Code sessions.
- **Always operate within the MCP tab group (Claude's dedicated window)** — never interact with tabs outside this group; never scan all-windows tabs
- Dev server default port is 5173, but may differ if that port is occupied

### Project-Specific: Scale Transform

`DashboardLayout.svelte` wraps the page with a `scale(0.5)` CSS transform. Screenshots show everything at **half the coded size** — a component written at `width: 1200px` appears as 600px in the browser. When evaluating screenshots, account for this: do not flag correctly-sized elements as "too small."

### Connecting Chrome

Connection is established via a native messaging host — no manual "Connect" popup. The extension (Claude in Chrome Beta) auto-connects on every session once the host is configured.

**One-time setup:** The user runs `/chrome` in the Claude Code CLI to install the native messaging host, then restarts Chrome.

**If disconnected:** Prompt the user **once**: _"The Chrome extension isn't connecting. Please run `/chrome` in Claude Code CLI, then let me know when done."_ Retry `tabs_context_mcp` once after they confirm. If still failing, note the issue and stop.

**If `tabs_context_mcp` returns "Multiple Chrome extensions connected":** Dia's extension is also active. Prompt the user to run `/chrome` → "Reconnect extension" to restore a single connection, then retry.

### Workflow — Run Before Any UI Verification

**Step 1 — Ensure the dev server is running and find the port:**

First, call `tabs_context_mcp({ createIfEmpty: true })` (Step 2 below) and check if any tab in the MCP group already has a `http://localhost:*` URL — extract `<port>` from it directly. If found, skip the rest of Step 1.

Otherwise, scan for a running Node server:
```bash
lsof -i :5173-5185 | grep LISTEN | grep node
```
- Port found → note as `<port>`
- Nothing listening → run `npm run dev` in background; watch its stdout for the line `Local: http://localhost:<port>` to get the exact port; also retry `lsof` every 2s (up to 15s) as a fallback until a port responds

**Step 2 — Get the Claude window:**

Call `tabs_context_mcp({ createIfEmpty: true })`.
- Returns tab list → proceed (the MCP group is Claude's dedicated window; a new window is only created when no group exists yet — subsequent calls never open a second window)
- Returns "Browser extension is not connected" → prompt user once as above; retry once after confirmation
- Returns "Multiple Chrome extensions connected" → prompt user to reconnect as above; retry once

**Step 3 — Find or open the localhost tab (within MCP group only):**

Scan `availableTabs` returned in Step 2 for a tab whose `url` starts with `http://localhost:<port>`.
- Found → record its `tabId` — **stop here, do not open another tab or window**
- Not found → call `navigate` on an existing MCP tab with `url=http://localhost:<port>`; if the group has no tabs, call `tabs_create_mcp` first, then `navigate`
- Record the `tabId`; if a "tab not found" error occurs at any point → return to Step 2 to re-discover

**Step 4 — Verify visually after code changes:**

1. Wait 2s for Vite HMR to auto-reload the page
2. Call `read_console_messages` with pattern `(?i)(error|\[vite\])`:
   - JS errors present → note them; they are likely the root cause of any visual issue
   - `[vite] full reload` seen, or no `[vite]` messages at all → call `navigate` on the `tabId` with `http://localhost:<port>` to force a full reload, then wait 2s
3. Take screenshot using `computer`
4. Evaluate against the current feature plan/spec; account for 0.5x scale transform

**Step 5 — Fix-verify loop (max 3 iterations total):**

If the screenshot or console output shows a problem:
1. Fix the code
2. Repeat Step 4
3. After 3 total attempts (original check + 2 fix attempts), **stop** — report the last screenshot, console output, and what was tried; ask the user for guidance

**Mandatory connection check:** Before declaring any UI work complete, call `tabs_context_mcp` to confirm the extension is still connected.
