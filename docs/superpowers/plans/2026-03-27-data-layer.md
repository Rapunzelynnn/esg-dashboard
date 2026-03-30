# Data Layer Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement each stage in a fresh session. Each stage has its own verification checkpoint and commit before the next stage begins.

**Goal:** Fix performance bugs (double price CSV fetch, per-selection re-fetch) and consolidate all data loading into `src/lib/data/` so the app loads both CSVs once on startup and requires zero network requests on company selection.

**Architecture:** Create a `src/lib/data/` module with three focused files: `csvParser.ts` (ESG CSV → `Company[]`), `priceLoader.ts` (price CSV → `Map<symbol, PriceData[]>`), and `index.ts` (`loadAllData()` entry point that fetches and populates stores). The stores file keeps only store declarations. `+page.svelte` calls `loadAllData()` once on mount. `StockPriceChart` reads from the pre-populated store.

**Tech Stack:** SvelteKit 2, Svelte 4, TypeScript

**Code standards:** DRY — no logic duplicated across files. Each file has one responsibility. No abstractions added for hypothetical future use.

---

## File Map

```
CREATE  src/lib/data/csvParser.ts       ← parseCSV(): ESG CSV text → Company[]
CREATE  src/lib/data/priceLoader.ts     ← parseAllPriceData(): price CSV text → Map<symbol, PriceData[]>
CREATE  src/lib/data/index.ts           ← loadAllData(): fetch both CSVs, parse, populate stores

MODIFY  src/lib/stores/index.ts         ← strip to store declarations only
MODIFY  src/lib/types.ts                ← remove duplicate ProcessedCompanyData
MODIFY  src/routes/+page.svelte         ← replace dual fetch with single loadAllData()
MODIFY  src/lib/components/StockPriceChart.svelte  ← read from priceDataStore (no fetch)

DELETE  src/lib/utils/dataLoader.ts     ← unused; references non-existent types
```

---

## Stage 1 — Dead Code Removal

**Session:** Fresh
**Branch:** `refactor/data-layer` (already checked out)
**Recommended skill/agent:** `superpowers:executing-plans` (simple targeted edits, no new files)
**Commit when:** both steps pass `npm run check`

Remove two dead code artifacts before building anything new. These are independent of the data module changes and should be cleaned up first.

### Step 1.1 — Fix duplicate `ProcessedCompanyData` in `src/lib/types.ts`

TypeScript silently merges same-name interface declarations; the second adds `industryAvg?` and `industryStdDev?`. Consolidate into one.

Replace lines 157–166 in `src/lib/types.ts`:

```typescript
// REMOVE — first declaration (lines 157–160):
export interface ProcessedCompanyData extends Company {
  relativeESG: number;
  isOutlier: boolean;
}

// KEEP — second declaration becomes the single one:
export interface ProcessedCompanyData extends Company {
  relativeESG: number;
  isOutlier: boolean;
  industryAvg?: number;
  industryStdDev?: number;
}
```

Verify: `npm run check` — no errors.

### Step 1.2 — Delete `src/lib/utils/dataLoader.ts`

This file is not imported anywhere and references `ESGData`/`RawESGData` types that don't exist in `types.ts`.

```bash
# Confirm nothing imports it:
grep -r "dataLoader" src/
# Expected: no output

rm src/lib/utils/dataLoader.ts
rmdir src/lib/utils/ 2>/dev/null || true
```

Verify: `npm run check` — no new errors (the file's own broken-import errors disappear).

### Stage 1 Commit

```bash
git add src/lib/types.ts
git add -u src/lib/utils/
git commit -m "fix: remove duplicate ProcessedCompanyData and unused dataLoader"
```

---

## Stage 2 — Build the Data Module

**Session:** Fresh
**Branch:** `refactor/data-layer`
**Recommended skill/agent:** `feature-dev:feature-dev` — new files, clear spec, no ambiguity
**Commit when:** all three files compile cleanly in isolation

Create `src/lib/data/` as the single source of truth for CSV parsing and loading. No file in this module imports from `$lib/stores` — parsers are pure functions, `index.ts` updates stores after parsing.

### Step 2.1 — Create `src/lib/data/csvParser.ts`

Move and clean up the ESG CSV parsing logic from `src/lib/stores/index.ts`. Remove all `console.log`/`console.warn` debug calls. Keep the quote-aware CSV splitter (required by the data format).

```typescript
// src/lib/data/csvParser.ts
import type { Company } from '$lib/types';

function safeParseFloat(value: string): number {
	const parsed = parseFloat(value);
	return isNaN(parsed) ? 0 : parsed;
}

function cleanCompanyName(name: string): string {
	if (!name) return '';
	return name
		.trim()
		.replace(/\*\*/g, '')
		.replace(/\s+/g, ' ')
		.replace(/\s*,\s*/g, ', ')
		.replace(/\s*\.\s*/g, '.')
		.replace(/Inc$/, 'Inc.')
		.replace(/Corp$/, 'Corp.')
		.replace(/\s+Inc\.$/, ' Inc.')
		.replace(/\s+Corp\.$/, ' Corp.');
}

export function parseCSV(csvText: string): Company[] {
	const lines = csvText
		.split('\n')
		.filter((line) => line.trim())
		.map((line) => line.replace(/\*\*/g, ''));

	const headerRow = lines[0].split(',').map((h) => h.trim());
	const headerIndexMap = new Map<string, number>();
	headerRow.forEach((header, index) => {
		headerIndexMap.set(header.toLowerCase().replace(/[^a-z0-9_]/g, ''), index);
	});

	return lines
		.slice(1)
		.map((line) => {
			const values: string[] = [];
			let currentValue = '';
			let insideQuotes = false;

			for (const char of line) {
				if (char === '"') {
					insideQuotes = !insideQuotes;
				} else if (char === ',' && !insideQuotes) {
					values.push(currentValue.trim().replace(/^"|"$/g, ''));
					currentValue = '';
				} else {
					currentValue += char;
				}
			}
			values.push(currentValue.trim().replace(/^"|"$/g, ''));

			const getValue = (header: string): string => {
				const index = headerIndexMap.get(header.toLowerCase().replace(/[^a-z0-9_]/g, ''));
				return index !== undefined && index < values.length ? values[index] : '';
			};

			const company: Company = {
				symbol: getValue('symbol'),
				fullName: cleanCompanyName(getValue('fullname')),
				industryCode: getValue('industry_code'),
				industryName: getValue('industry_name'),
				location: getValue('location'),
				marketCap: safeParseFloat(getValue('marketcap')),
				beta: safeParseFloat(getValue('beta')),
				esgScores: {
					total: safeParseFloat(getValue('total_esg_score')),
					environmental: {
						score: safeParseFloat(getValue('environmental_score')),
						mean: safeParseFloat(getValue('environmental_mean')),
						max: safeParseFloat(getValue('environmental_max'))
					},
					social: {
						score: safeParseFloat(getValue('social_score')),
						mean: safeParseFloat(getValue('social_mean')),
						max: safeParseFloat(getValue('social_max'))
					},
					governance: {
						score: safeParseFloat(getValue('governance_score')),
						mean: safeParseFloat(getValue('governance_mean')),
						max: safeParseFloat(getValue('governance_max'))
					}
				}
			};

			return company.symbol ? company : null;
		})
		.filter((company): company is Company => company !== null);
}
```

### Step 2.2 — Create `src/lib/data/priceLoader.ts`

Parse the entire wide-format price CSV (rows = dates, columns = tickers) into a `Map` in one pass. No per-symbol logic.

```typescript
// src/lib/data/priceLoader.ts
import type { PriceData } from '$lib/types';

export function parseAllPriceData(csvText: string): Map<string, PriceData[]> {
	const result = new Map<string, PriceData[]>();

	const lines = csvText.split('\n');
	if (lines.length < 2) return result;

	// First column is date; remaining columns are ticker symbols
	const symbols = lines[0].split(',').slice(1).map((s) => s.trim());
	for (const symbol of symbols) {
		if (symbol) result.set(symbol, []);
	}

	for (let i = 1; i < lines.length; i++) {
		if (!lines[i].trim()) continue;
		const columns = lines[i].split(',');
		const date = columns[0].trim();

		for (let j = 1; j < columns.length; j++) {
			const symbol = symbols[j - 1];
			if (!symbol) continue;
			const price = parseFloat(columns[j].trim());
			if (!isNaN(price)) result.get(symbol)!.push({ date, price });
		}
	}

	return result;
}
```

### Step 2.3 — Create `src/lib/data/index.ts`

Single async entry point. Fetches both CSVs in parallel, parses them, and writes to stores.

```typescript
// src/lib/data/index.ts
import { companies, priceDataStore } from '$lib/stores';
import { parseCSV } from './csvParser';
import { parseAllPriceData } from './priceLoader';

export async function loadAllData(): Promise<void> {
	const [esgRes, priceRes] = await Promise.all([
		fetch('/processed_sp500_esg_data.csv'),
		fetch('/processed_sp500_price_data.csv')
	]);

	if (!esgRes.ok) throw new Error(`Failed to fetch ESG data: ${esgRes.status}`);
	if (!priceRes.ok) throw new Error(`Failed to fetch price data: ${priceRes.status}`);

	const [esgText, priceText] = await Promise.all([esgRes.text(), priceRes.text()]);

	companies.set(parseCSV(esgText));
	priceDataStore.set(parseAllPriceData(priceText));
}
```

### Stage 2 Verification

```bash
npm run check
```

Expected: No errors in the three new files. Other files may still error (stores still exports old functions — fixed in Stage 3).

### Stage 2 Commit

```bash
git add src/lib/data/
git commit -m "feat: add src/lib/data module with csvParser, priceLoader, and loadAllData"
```

### Stage 2 Code Review

**Skill:** `superpowers:requesting-code-review`
**Scope:** `src/lib/data/` (three new files only)
**Focus:** Verify pure functions have no side effects, types match what Stage 3 will consume (`Company[]`, `Map<string, PriceData[]>`), and no imports from `$lib/stores` snuck in.

---

## Stage 3 — Rewire Stores and Components

**Session:** Fresh
**Branch:** `refactor/data-layer`
**Recommended skill/agent:** `feature-dev:feature-dev` — modifying multiple interconnected files
**Commit when:** `npm run check` passes and browser smoke test passes

Wire the new data module into the app. This stage modifies four files that are tightly coupled — all changes must land together before verification makes sense.

### Step 3.1 — Slim `src/lib/stores/index.ts` to declarations only

Remove `parseCSV`, `safeParseFloat`, `cleanCompanyName`, `loadCompanyData`, `loadPriceData`, the broken `$: console.log(...)` labeled statement, and `RawPriceData`. Keep only store declarations and `filterState`.

```typescript
// src/lib/stores/index.ts
import { writable } from 'svelte/store';
import type { Company, PriceData, FilterState } from '$lib/types';

export const companies = writable<Company[]>([]);
export const selectedCompany = writable<Company | null>(null);
export const priceDataStore = writable(new Map<string, PriceData[]>());

export const filterState = writable<FilterState>({
	timeRange: [new Date(new Date().getFullYear() - 1), new Date()],
	selectedSectors: [],
	selectedIndustries: [],
	selectedCompanies: [],
	locationFilter: [],
	esgScoreRange: [0, 100],
	dataAvailabilityFilter: [],
	sortBy: 'total_esg_score',
	sortDirection: 'desc'
});
```

### Step 3.2 — Update `src/routes/+page.svelte`

Replace local `loadPriceData` function and `processedPriceData` variable with a single `loadAllData()` call. Pass price data to `StockPriceCorrelation` from the store.

Replace the entire `<script>` block:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { companies, priceDataStore } from '$lib/stores';
  import { loadAllData } from '$lib/data';
  import { Card } from '$lib/components/ui/card';
  import CompanySearch from '$lib/components/CompanySearch.svelte';
  import CompanyProfile from '$lib/components/CompanyProfile.svelte';
  import ESGIndustryAnalysis from '$lib/components/ESGIndustryAnalysis.svelte';
  import MarketCapCorrelation from '$lib/components/MarketCapCorrelation.svelte';
  import ScoreComparison from '$lib/components/ScoreComparison.svelte';
  import StockPriceCorrelation from '$lib/components/StockPriceCorrelation.svelte';
  import type { PriceData } from '$lib/types';

  let loading = true;
  let activeChart = 0;

  const charts = [
    { id: 0, title: 'Industrial Score Breakdown', icon: '📊' },
    { id: 1, title: 'ESG vs Market Cap', icon: '💰' },
    { id: 2, title: 'Score Comparison', icon: '⚖️' },
    { id: 3, title: 'ESG vs Stock Price', icon: '📉' }
  ];

  // Convert Map to Record for StockPriceCorrelation prop compatibility
  $: priceDataRecord = Object.fromEntries($priceDataStore) as Record<string, PriceData[]>;

  onMount(async () => {
    try {
      await loadAllData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  });
</script>
```

In the template, change `priceData={processedPriceData}` to `priceData={priceDataRecord}` (one line change on the `StockPriceCorrelation` usage).

### Step 3.3 — Update `src/lib/components/StockPriceChart.svelte`

Remove `loadPriceData` import and the per-symbol fetch call. Data is pre-loaded — just read from `$priceDataStore`. Replace the full `<script>` block:

```svelte
<script lang="ts">
    import { priceDataStore } from '$lib/stores';
    import type { StockChartOptions } from '$lib/types';
    import { Line } from 'svelte-chartjs';
    import {
        Chart as ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        TimeScale
    } from 'chart.js';
    import type { Scale, CoreScaleOptions, Point, ChartData } from 'chart.js';
    import 'chartjs-adapter-date-fns';

    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

    export let symbol: string;
    let data: ChartData<'line', Point[], unknown> | undefined = undefined;

    const options: StockChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: {
                type: 'time',
                time: { unit: 'month', displayFormats: { month: 'MMM' } },
                grid: { display: false, borderColor: 'transparent' },
                ticks: { font: { size: 10 }, color: '#666', maxRotation: 45, minRotation: 45 }
            },
            y: {
                type: 'linear',
                display: true,
                grid: { borderColor: 'transparent' },
                ticks: {
                    font: { size: 10 },
                    color: '#666',
                    callback: function(this: Scale<CoreScaleOptions>, tickValue: string | number) {
                        return `$${Number(tickValue).toFixed(0)}`;
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'white',
                titleColor: '#000',
                bodyColor: '#666',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 4,
                cornerRadius: 4,
                displayColors: false,
                callbacks: {
                    label: (context) => `$${(context.raw as Point).y.toFixed(2)}`
                }
            },
            legend: { display: false }
        }
    };

    function buildChartData(sym: string) {
        const symbolData = $priceDataStore.get(sym);
        if (!symbolData?.length) { data = undefined; return; }

        data = {
            datasets: [{
                label: `${sym} Price`,
                data: symbolData.map(d => ({ x: new Date(d.date).getTime(), y: d.price })),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 3
            }]
        };
    }

    $: if (symbol) buildChartData(symbol);
</script>
```

Keep the template unchanged. The `{#if !data}` / `{:else}` guards in the template handle the no-data case.

### Stage 3 Verification

```bash
npm run check
```

Expected: Zero errors.

Then open `http://localhost:5173` and verify:
1. Dashboard loads with company data in all four analysis tabs
2. Search and select a company — stock chart appears
3. Open browser Network tab — exactly **2 CSV fetches** on initial load, **0 new requests** when selecting a company

### Stage 3 Commit

```bash
git add src/lib/stores/index.ts src/routes/+page.svelte src/lib/components/StockPriceChart.svelte
git commit -m "refactor: wire data module into stores and components"
```

### Stage 3 Code Review

**Skill:** `superpowers:requesting-code-review`
**Scope:** All four modified files: `src/lib/stores/index.ts`, `src/routes/+page.svelte`, `src/lib/components/StockPriceChart.svelte`, `src/lib/components/StockPriceCorrelation.svelte` (if touched)
**Focus:** This is the highest-risk stage — verify:
- `stores/index.ts` exports only declarations; no parsing logic remains
- `+page.svelte` calls `loadAllData()` exactly once in `onMount`; no local fetch calls remain
- `StockPriceChart.svelte` reads from `$priceDataStore` only; no `loadPriceData` import or fetch call remains
- `priceDataRecord` reactive statement correctly converts `Map` → `Record` for `StockPriceCorrelation` prop

---

## Stage 4 — Final Cleanup and Verification

**Session:** Fresh
**Branch:** `refactor/data-layer`
**Recommended skill/agent:** General-purpose or inline (grep + delete, no logic changes)
**Commit when:** `npm run build` succeeds and browser smoke test passes

### Step 4.1 — Remove remaining debug console statements

```bash
grep -rn "console\.log\|console\.warn" src/
```

Remove any `console.log` or `console.warn` that are debug artifacts (not error handling in `catch` blocks). After Stage 2, the stores and csvParser should already be clean — check components for any leftover debug calls.

Verify: `npm run check` — no errors.

### Step 4.2 — Production build

```bash
npm run build
```

Expected: Build succeeds with no errors or warnings.

### Step 4.3 — Smoke test

```bash
npm run preview
```

Open `http://localhost:4173`. Verify:
1. All four analysis tabs display data
2. Company search and selection works
3. Stock chart renders per company
4. Network tab: **2 CSV fetches on load only**, zero on selection

### Stage 4 Commit

```bash
git add -A src/
git commit -m "chore: remove debug console statements; phase 1 complete"
```
