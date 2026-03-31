# Svelte 4 → 5 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## ✅ Session Status

**Branch:** `refactor/svelte5-migration`
**Progress:** 6 of 16 tasks complete

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Upgrade dependencies + config | ✅ done | `chore: upgrade to Svelte 5 and tooling` |
| 2 | Create state module | ✅ done | `refactor: replace stores with Svelte 5 state module` |
| 3 | Migrate card UI components (6 files) | ✅ done | `refactor: migrate card UI components to Svelte 5` |
| 4 | Migrate ESGScores.svelte | ✅ done | `refactor: migrate ESGScores to Svelte 5` |
| 5 | Migrate FilterPanel.svelte | ✅ done | `refactor: migrate FilterPanel to Svelte 5` |
| 6 | Migrate CompanySearch.svelte | ✅ done | `refactor: migrate CompanySearch to Svelte 5` |
| 7 | Migrate StockPriceChart.svelte | ✅ done | `refactor: migrate StockPriceChart to Svelte 5` |
| 8 | Migrate CompanyProfile.svelte | ⬜ next | — |
| 9 | Migrate ESGIndustryAnalysis.svelte | ⬜ | — |
| 10 | Migrate MarketCapCorrelation.svelte | ⬜ | — |
| 11 | Migrate ScoreComparison.svelte | ⬜ | — |
| 12 | Migrate StockPriceCorrelation.svelte | ⬜ | — |
| 13 | Migrate DashboardLayout.svelte | ⬜ | — |
| 14 | Migrate +layout.svelte | ⬜ | — |
| 15 | Migrate +page.svelte | ⬜ | — |
| 16 | Final verification + commit | ⬜ | — |

---

## 📋 Handoff Template (how each chat session is structured)

Every session prompt follows this exact structure. **When finishing a task, generate the next task's prompt using this template.**

```
## ESG Dashboard — Svelte 5 Migration: Task N

### 1. What's been done
[List completed tasks with their commit messages — copy from the progress table above]

### 2. What this task does and why
[1-2 sentences: what changes in this task + why it must happen at this point in the sequence]

### 3. Steps
[Numbered steps. For file content, say "exact code is in the plan under Task N Step X". Always end with:]
- Verify: [specific grep/check command]
- Commit: [exact git command]
- Update the progress table in the plan (mark this task ✅, add commit message, change next task to ⬜ next)
- Generate the Task N+1 session prompt using the Handoff Template and print it for the user to copy

### 4. Project context
- Path: `/Users/lynn.peng/Documents/GitHub/esg-dashboard`
- Branch: `refactor/svelte5-migration`
- Plan file: `docs/superpowers/plans/2026-03-30-svelte5-migration.md`
- Commit style: lowercase imperative, no Co-Authored-By, under 60 chars
- `npm install` requires `--legacy-peer-deps`
- `$state`/`$derived`/`$effect`/`$props` are runes — never import them
```

---

## 📋 Task 2 — Session Prompt

```
## ESG Dashboard — Svelte 5 Migration: Task 2

### 1. What's been done
- Task 1 ✅ — Upgraded Svelte 4→5, svelte-check 3→4, @sveltejs/vite-plugin-svelte 3→4, @sveltejs/kit→2.16. Commit: `chore: upgrade to Svelte 5 and tooling`

### 2. What this task does and why
Creates `src/lib/state.svelte.ts` — a single Svelte 5 runes-based module that replaces all Svelte 4 writable stores. Every component migration in Tasks 3–15 imports from this module, so it must exist before any component is touched.

### 3. Steps
Exact file contents are in the plan file under "Task 2".

1. Create `src/lib/state.svelte.ts` using the code in Task 2 Step 1.
   (`$state` is a rune — no import line needed. Remove the bogus import line if the plan shows one.)

2. Overwrite `src/lib/data/index.ts` with the code in Task 2 Step 2.

3. Delete the old stores file:
   `git rm src/lib/stores/index.ts`

4. Verify (no errors in these specific files — other components still fail, that's fine):
   `npm run check 2>&1 | grep -E "(state\.svelte|stores/index|data/index)" | head -20`

5. Commit:
   `git add src/lib/state.svelte.ts src/lib/data/index.ts && git commit -m "refactor: replace stores with Svelte 5 state module"`

6. In the plan file, update the progress table: mark Task 2 ✅, add commit message, mark Task 3 as `⬜ next`.
   Commit: `git add docs/superpowers/plans/2026-03-30-svelte5-migration.md && git commit -m "docs: mark task 2 complete"`

7. Using the Handoff Template in the plan file, generate the Task 3 session prompt and print it so the user can copy it into their next chat. Task 3 migrates 6 card UI components in `src/lib/components/ui/card/` — read that section in the plan for the details to fill into the template.

### 4. Project context
- Path: `/Users/lynn.peng/Documents/GitHub/esg-dashboard`
- Branch: `refactor/svelte5-migration`
- Plan file: `docs/superpowers/plans/2026-03-30-svelte5-migration.md`
- Commit style: lowercase imperative, no Co-Authored-By, under 60 chars
- `npm install` requires `--legacy-peer-deps`
- `$state`/`$derived`/`$effect`/`$props` are runes — never import them
```

---

**Goal:** Fully rewrite the ESG Dashboard from Svelte 4 to Svelte 5 runes — no legacy mode.

**Architecture:** Replace `writable` stores with a single `src/lib/state.svelte.ts` module using module-level `$state`. Migrate all components bottom-up (leaf → chart → layout). Stores are deleted; components import directly from the state module.

**Tech Stack:** Svelte 5, SvelteKit 2, TypeScript 5, Chart.js 4 (via `svelte-chartjs` — kept as-is; replaced in Phase 3), Tailwind CSS.

---

## Syntax Reference (Svelte 4 → 5)

| Svelte 4 | Svelte 5 |
|----------|----------|
| `export let prop` | `let { prop } = $props()` |
| `export let prop = default` | `let { prop = default } = $props()` |
| `$: derived = expr` | `let derived = $derived(expr)` |
| `$: { sideEffect() }` | `$effect(() => { sideEffect() })` |
| `writable(value)` | `$state(value)` in `.svelte.ts` |
| `$store` | `state.field` (direct access) |
| `store.set(v)` | `state.field = v` |
| `on:click={fn}` | `onclick={fn}` |
| `on:click\|stopPropagation={fn}` | `onclick={(e) => { e.stopPropagation(); fn() }}` |
| `<slot />` | `{@render children()}` |
| `$$restProps` | spread from `$props()` |
| `$$Props` | `interface Props { ... }` |
| `<svelte:window on:click={fn} />` | `<svelte:window onclick={fn} />` |

---

## File Map

**Create:**
- `src/lib/state.svelte.ts` — replaces `src/lib/stores/index.ts`

**Modify (in order):**
1. `package.json` — upgrade Svelte 5 + tooling
2. `svelte.config.js` — add runes config
3. `src/lib/state.svelte.ts` — new reactive state module
4. `src/lib/data/index.ts` — use new state module
5. `src/lib/components/ui/card/card.svelte`
6. `src/lib/components/ui/card/card-content.svelte`
7. `src/lib/components/ui/card/card-header.svelte`
8. `src/lib/components/ui/card/card-footer.svelte`
9. `src/lib/components/ui/card/card-title.svelte`
10. `src/lib/components/ui/card/card-description.svelte`
11. `src/lib/components/ESGScores.svelte`
12. `src/lib/components/FilterPanel.svelte`
13. `src/lib/components/CompanySearch.svelte`
14. `src/lib/components/StockPriceChart.svelte`
15. `src/lib/components/CompanyProfile.svelte`
16. `src/lib/components/ESGIndustryAnalysis.svelte`
17. `src/lib/components/MarketCapCorrelation.svelte`
18. `src/lib/components/ScoreComparison.svelte`
19. `src/lib/components/StockPriceCorrelation.svelte`
20. `src/lib/components/DashboardLayout.svelte`
21. `src/routes/+layout.svelte`
22. `src/routes/+page.svelte`

**Delete:**
- `src/lib/stores/index.ts`

---

## Task 1: Upgrade dependencies and config

**Files:**
- Modify: `package.json`
- Modify: `svelte.config.js`

- [x] **Step 1: Update package.json devDependencies**

```json
{
  "devDependencies": {
    "@sveltejs/adapter-auto": "^3.0.0",
    "@sveltejs/kit": "^2.16.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@types/chart.js": "^2.9.41",
    "autoprefixer": "^10.4.20",
    "clsx": "^2.1.1",
    "postcss": "^8.4.47",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "tailwind-merge": "^2.5.4",
    "tailwind-variants": "^0.2.1",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

- [x] **Step 2: Install updated packages**

Run: `npm install`

Expected: packages install without fatal errors (peer-dep warnings about svelte-chartjs are OK — it still runs under Svelte 5).

- [x] **Step 3: Verify check still runs (it will fail — that is expected)**

Run: `npm run check 2>&1 | head -30`

Expected: type errors about old syntax — this is the baseline we will resolve.

---

## Task 2: Create the state module

This replaces `src/lib/stores/index.ts` with a Svelte 5 runes-based state module.

**Files:**
- Create: `src/lib/state.svelte.ts`
- Delete: `src/lib/stores/index.ts` (do this at the end of this task)

- [ ] **Step 1: Create `src/lib/state.svelte.ts`**

```typescript
// src/lib/state.svelte.ts
import type { Company, PriceData, FilterState } from '$lib/types';

export const appState = $state({
  companies: [] as Company[],
  selectedCompany: null as Company | null,
  priceData: new Map<string, PriceData[]>(),
  filterState: {
    timeRange: [new Date(new Date().getFullYear() - 1), new Date()],
    selectedSectors: [],
    selectedIndustries: [],
    selectedCompanies: [],
    locationFilter: [],
    esgScoreRange: [0, 100],
    dataAvailabilityFilter: [],
    sortBy: 'total_esg_score',
    sortDirection: 'desc'
  } as FilterState
});
```

- [ ] **Step 2: Update `src/lib/data/index.ts` to import from state module**

```typescript
// src/lib/data/index.ts
import { appState } from '$lib/state.svelte';
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

	appState.companies = parseCSV(esgText);
	appState.priceData = parseAllPriceData(priceText);
}
```

- [ ] **Step 3: Delete the old stores file**

Run: `rm src/lib/stores/index.ts`

---

## Task 3: Migrate card UI components

These six small components share an identical pattern: replace `$$Props`/`$$restProps`/`<slot />` with Svelte 5 equivalents.

**Files:** All files in `src/lib/components/ui/card/`

- [ ] **Step 1: Migrate `card.svelte`**

```svelte
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {}
	let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn("bg-card text-card-foreground rounded-lg border shadow-sm", className)}
	{...rest}
>
	{@render children?.()}
</div>
```

- [ ] **Step 2: Migrate `card-content.svelte`**

```svelte
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {}
	let { class: className, children, ...rest }: Props = $props();
</script>

<div class={cn("p-6", className)} {...rest}>
	{@render children?.()}
</div>
```

- [ ] **Step 3: Migrate `card-header.svelte`**

```svelte
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {}
	let { class: className, children, ...rest }: Props = $props();
</script>

<div class={cn("flex flex-col space-y-1.5 p-6 pb-0", className)} {...rest}>
	{@render children?.()}
</div>
```

- [ ] **Step 4: Migrate `card-footer.svelte`**

```svelte
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {}
	let { class: className, children, ...rest }: Props = $props();
</script>

<div class={cn("flex items-center p-6 pt-0", className)} {...rest}>
	{@render children?.()}
</div>
```

- [ ] **Step 5: Migrate `card-description.svelte`**

```svelte
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	interface Props extends HTMLAttributes<HTMLParagraphElement> {}
	let { class: className, children, ...rest }: Props = $props();
</script>

<p class={cn("text-muted-foreground text-sm", className)} {...rest}>
	{@render children?.()}
</p>
```

- [ ] **Step 6: Migrate `card-title.svelte`**

```svelte
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { HeadingLevel } from "./index.js";
	import { cn } from "$lib/utils.js";

	interface Props extends HTMLAttributes<HTMLHeadingElement> {
		tag?: HeadingLevel;
	}
	let { class: className, tag = 'h3', children, ...rest }: Props = $props();
</script>

<svelte:element
	this={tag}
	class={cn("text-lg font-semibold leading-none tracking-tight", className)}
	{...rest}
>
	{@render children?.()}
</svelte:element>
```

- [ ] **Step 7: Run type check**

Run: `npm run check 2>&1 | grep "card" | head -20`

Expected: no errors in card components.

---

## Task 4: Migrate ESGScores.svelte

**File:** `src/lib/components/ESGScores.svelte`

Key changes: `export let` → `$props()`, local `writable` store → `$state`, `on:mouseenter/mouseleave/focus/blur` → direct event attributes.

- [ ] **Step 1: Replace the script block**

Replace the entire `<script>` block with:

```svelte
<script lang="ts">
    import { $state } from 'svelte'; // not needed — $state is a rune, no import

    interface Props {
        esgScores: {
            total: number;
            environmental: { score: number; mean: number; max: number };
            social: { score: number; mean: number; max: number };
            governance: { score: number; mean: number; max: number };
        };
        showTotal?: boolean;
        showBreakdown?: boolean;
    }
    let { esgScores, showTotal = true, showBreakdown = true }: Props = $props();

    type CategoryKey = 'environmental' | 'social' | 'governance';
    const categories: CategoryKey[] = ['environmental', 'social', 'governance'];

    interface ScoreRange {
        min: number;
        max: number;
        label: string;
        color: string;
        description: string;
    }

    const scoreRanges: ScoreRange[] = [
        { min: 80, max: 100, label: 'Excellent', color: 'bg-blue-500', description: 'Significantly above industry average, demonstrating leadership' },
        { min: 65, max: 79.99, label: 'Very Good', color: 'bg-cyan-500', description: 'Above industry average, showing strong performance' },
        { min: 50, max: 64.99, label: 'Good', color: 'bg-teal-500', description: 'Around industry average, meeting standards' },
        { min: 35, max: 49.99, label: 'Fair', color: 'bg-amber-500', description: 'Below industry average, improvement needed' },
        { min: 0, max: 34.99, label: 'Poor', color: 'bg-red-500', description: 'Significantly below industry average' }
    ];

    let activeTooltip = $state<string | null>(null);

    function formatScore(score: number): string {
        if (!score || isNaN(score)) return '0.0';
        return score.toFixed(1);
    }

    function getMeanPosition(score: number, max: number): string {
        if (!score || !max) return '0%';
        return `${(score / max) * 100}%`;
    }

    function getCategoryLabel(category: CategoryKey): string {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    function getScoreRating(score: number, mean: number, max: number): ScoreRange {
        const meanPercentage = (mean / max) * 100;
        const scorePercentage = (score / max) * 100;
        const relativePosition = ((scorePercentage - meanPercentage) / meanPercentage) * 100;
        if (relativePosition >= 50) return scoreRanges[0];
        else if (relativePosition >= 20) return scoreRanges[1];
        else if (relativePosition >= -20) return scoreRanges[2];
        else if (relativePosition >= -50) return scoreRanges[3];
        else return scoreRanges[4];
    }

    function getScoreColor(score: number, mean: number, max: number): string {
        return getScoreRating(score, mean, max).color;
    }

    function getScoreStatus(score: number, mean: number): string {
        const difference = ((score - mean) / mean * 100).toFixed(1);
        const direction = score > mean ? 'above' : 'below';
        return `${Math.abs(Number(difference))}% ${direction} industry average`;
    }
</script>
```

- [ ] **Step 2: Replace event handlers in the template**

In the template, find the invisible button and replace `on:` event attributes:

```svelte
<!-- BEFORE -->
<button
    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    aria-label="Show details for {getCategoryLabel(category)} score"
    on:mouseenter={() => activeTooltip = category}
    on:mouseleave={() => activeTooltip = null}
    on:focus={() => activeTooltip = category}
    on:blur={() => activeTooltip = null}
/>
```

```svelte
<!-- AFTER -->
<button
    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    aria-label="Show details for {getCategoryLabel(category)} score"
    onmouseenter={() => activeTooltip = category}
    onmouseleave={() => activeTooltip = null}
    onfocus={() => activeTooltip = category}
    onblur={() => activeTooltip = null}
/>
```

The tooltip condition `{#if $activeTooltip === category}` becomes `{#if activeTooltip === category}` (no `$` prefix — `activeTooltip` is now a plain `$state` variable, not a store).

---

## Task 5: Migrate FilterPanel.svelte

**File:** `src/lib/components/FilterPanel.svelte`

Note: `FilterState` has `minESGScore` and `maxESGScore` in the template but NOT in the `FilterState` type definition — these bindings reference undefined fields. Migrate as-is without fixing this pre-existing mismatch (scope rule).

- [ ] **Step 1: Replace script block**

```svelte
<script lang="ts">
  import type { FilterState } from '../types';

  interface Props {
    localFilter: FilterState;
  }
  let { localFilter }: Props = $props();
</script>
```

Template is unchanged — `bind:value` still works in Svelte 5.

---

## Task 6: Migrate CompanySearch.svelte

**File:** `src/lib/components/CompanySearch.svelte`

- [ ] **Step 1: Replace script block**

```svelte
<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import type { Company } from '$lib/types';

	let searchTerm = $state('');

	let filteredCompanies = $derived(
		searchTerm
			? appState.companies
					.filter((company) => {
						const searchLower = searchTerm.toLowerCase();
						const symbolLower = (company.symbol || '').toLowerCase();
						const fullNameLower = (company.fullName || '').toLowerCase();
						const combinedNameLower = `${symbolLower} ${fullNameLower}`.toLowerCase();
						return combinedNameLower.includes(searchLower);
					})
					.slice(0, 5)
			: []
	);

	function selectCompany(company: Company) {
		appState.selectedCompany = company;
		searchTerm = '';
	}
</script>
```

- [ ] **Step 2: Update event handler in template**

```svelte
<!-- BEFORE -->
<button
    class="w-full px-4 py-2 text-left hover:bg-gray-100"
    on:click={() => selectCompany(company)}
>
```

```svelte
<!-- AFTER -->
<button
    class="w-full px-4 py-2 text-left hover:bg-gray-100"
    onclick={() => selectCompany(company)}
>
```

---

## Task 7: Migrate StockPriceChart.svelte

**File:** `src/lib/components/StockPriceChart.svelte`

Key change: `$: if (symbol) buildChartData(symbol, $priceDataStore)` → `$effect`.

- [ ] **Step 1: Replace script block**

```svelte
<script lang="ts">
    import { appState } from '$lib/state.svelte';
    import type { PriceData, StockChartOptions } from '$lib/types';
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

    interface Props {
        symbol: string;
    }
    let { symbol }: Props = $props();
    let data = $state<ChartData<'line', Point[], unknown> | undefined>(undefined);

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

    function buildChartData(sym: string, store: Map<string, PriceData[]>) {
        const symbolData = store.get(sym);
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

    $effect(() => {
        if (symbol) buildChartData(symbol, appState.priceData);
    });
</script>
```

Template is unchanged.

---

## Task 8: Migrate CompanyProfile.svelte

**File:** `src/lib/components/CompanyProfile.svelte`

No props — reads directly from `appState.selectedCompany`. No `on:` events in template.

- [ ] **Step 1: Replace script block**

```svelte
<script lang="ts">
    import { appState } from '$lib/state.svelte';
    import StockPriceChart from './StockPriceChart.svelte';
    import ESGScores from './ESGScores.svelte';

    const scoreRanges = [
        { label: 'Poor', color: 'bg-red-500' },
        { label: 'Fair', color: 'bg-amber-500' },
        { label: 'Good', color: 'bg-teal-500' },
        { label: 'Very Good', color: 'bg-cyan-500' },
        { label: 'Excellent', color: 'bg-blue-500' }
    ];

    function formatMarketCap(value: number): string {
        if (!value || isNaN(value)) return '$0.00';
        if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
        if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)} billion`;
        if (value >= 1_000_000) return `$${(value / 1_000_000_000).toFixed(2)} million`;
        return `$${value.toFixed(2)}`;
    }

    function formatBeta(value: number): string {
        if (!value || isNaN(value)) return '0.00';
        return value.toFixed(2);
    }
</script>
```

- [ ] **Step 2: Update template store references**

Replace all `$selectedCompany` with `appState.selectedCompany` in the template. For example:

```svelte
<!-- BEFORE -->
{#if $selectedCompany}
  ...{$selectedCompany?.fullName || 'No Name'}...
  <StockPriceChart symbol={$selectedCompany.symbol} />
  <ESGScores esgScores={$selectedCompany.esgScores} showBreakdown={false} />
```

```svelte
<!-- AFTER -->
{#if appState.selectedCompany}
  ...{appState.selectedCompany?.fullName || 'No Name'}...
  <StockPriceChart symbol={appState.selectedCompany.symbol} />
  <ESGScores esgScores={appState.selectedCompany.esgScores} showBreakdown={false} />
```

Do a global find-and-replace: `$selectedCompany` → `appState.selectedCompany` (in the template section only).

- [ ] **Step 3: Run type check on migrated leaf components**

Run: `npm run check 2>&1 | grep -E "(ESGScores|CompanySearch|StockPrice|CompanyProfile|FilterPanel|card)" | head -30`

Expected: no errors in these files.

---

## Task 9: Migrate ESGIndustryAnalysis.svelte

**File:** `src/lib/components/ESGIndustryAnalysis.svelte`

This is the most complex component. Strategy: replace the entire `<script>` block, then do a global find-and-replace on event handlers in the template.

- [ ] **Step 1: Replace the entire `<script>` block**

```svelte
<script lang="ts">
  import type { Company } from '$lib/types';
  import { appState } from '$lib/state.svelte';

  // Props
  interface Props {
    data?: Company[];
    expanded?: boolean;
  }
  let { data = [], expanded = false }: Props = $props();

  // Types
  interface IndustryData {
    industryName: string;
    environmental: number;
    social: number;
    governance: number;
    total: number;
  }
  type ESGType = 'environmental' | 'social' | 'governance';
  type TooltipContent = {
    visible: boolean;
    score: number;
    type: ESGType;
    industryName: string;
  };

  // Constants
  const maxScore = 100;
  const defaultChartHeight = 320;
  const expandedChartHeight = 500;
  const gridLines = [20, 40, 60, 80];
  const yAxisLabels = [0, 20, 40, 60, 80, 100];
  const barStyles = {
    base: "transition-all duration-200 ease-out transform",
    hover: "scale-105 shadow-lg",
    tooltip: "absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-lg z-50"
  };
  const industryCategories: Record<string, string[]> = {
    'Energy': ['Oil & Gas Upstream & Integrated','Oil & Gas Storage & Transportation','Oil & Gas Refining & Marketing','Energy Equipment & Services'],
    'Materials': ['Chemicals','Construction Materials','Metals & Mining','Containers & Packaging','Steel'],
    'Industrials': ['Aerospace & Defense','Airlines','Building Products','Machinery and Electrical Equipment','Electrical Components & Equipment','Trading Companies & Distributors','Professional Services','Commercial Services & Supplies','Construction & Engineering','Transportation and Transportation Infrastructure','Auto Components'],
    'Consumer Discretionary': ['Automobiles','Retailing','Restaurants & Leisure Facilities','Hotels, Resorts & Cruise Lines','Leisure Equipment & Products and Consumer Electronics','Homebuilding','Textiles, Apparel & Luxury Goods','Casinos & Gaming','Household Durables'],
    'Consumer Staples': ['Food Products','Food & Staples Retailing','Household Products','Personal Products','Beverages','Tobacco'],
    'Health Care': ['Biotechnology','Pharmaceuticals','Health Care Equipment & Supplies','Health Care Providers & Services','Life Sciences Tools & Services'],
    'Financials': ['Banks','Diversified Financial Services and Capital Markets','Insurance','Real Estate Management & Development','Equity Real Estate Investment Trusts (REITs)'],
    'Information Technology': ['Semiconductors & Semiconductor Equipment','Software','IT Services','Computers & Peripherals and Office Electronics','Communications Equipment','Electronic Equipment, Instruments & Components'],
    'Communication Services': ['Interactive Media, Services & Home Entertainment','Media, Movies & Entertainment','Telecommunication Services'],
    'Utilities': ['Electric Utilities','Gas Utilities','Multi and Water Utilities']
  };

  // State
  let selectedIndustries = $state(new Set<string>());
  let searchTerm = $state('');
  let showDropdown = $state(false);
  let initialized = $state(false);
  let tooltipContent = $state<TooltipContent>({ visible: false, score: 0, type: 'environmental', industryName: '' });

  // Derived
  let allIndustryData = $derived(processData(data));
  let industries = $derived(
    [...new Set(data.map(d => d.industryName))].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )
  );
  let highlightedIndustry = $derived(appState.selectedCompany?.industryName || '');
  let chartHeight = $derived(expanded ? expandedChartHeight : defaultChartHeight);
  let filteredIndustries = $derived(
    industries.filter(industry => industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  let groupedIndustries = $derived(
    filteredIndustries.reduce((acc, industry) => {
      const category = getIndustryCategory(industry);
      if (!acc[category]) acc[category] = [];
      acc[category].push(industry);
      return acc;
    }, {} as Record<string, string[]>)
  );
  let sortedCategories = $derived(
    Object.keys(industryCategories).filter(cat => groupedIndustries[cat]?.length > 0)
  );
  let industryData = $derived(
    allIndustryData
      .filter(d => selectedIndustries.has(d.industryName))
      .sort((a, b) => {
        if (a.industryName === highlightedIndustry) return -1;
        if (b.industryName === highlightedIndustry) return 1;
        return b.total - a.total;
      })
  );

  // Initialize selected industries when data/company changes
  $effect(() => {
    if (appState.selectedCompany && industries.length > 0) {
      if (!initialized) {
        selectedIndustries = getRelatedIndustries(appState.selectedCompany.industryName);
        initialized = true;
      }
    } else if (industries.length > 0 && !initialized) {
      selectedIndustries = new Set(industries);
      initialized = true;
    }
  });

  // Reset when selected company changes
  $effect(() => {
    if (appState.selectedCompany) {
      selectedIndustries = getRelatedIndustries(appState.selectedCompany.industryName);
      initialized = true;
    }
  });

  // Functions
  function getBarColor(type: ESGType): string {
    const colors = { environmental: 'bg-blue-500', social: 'bg-green-500', governance: 'bg-indigo-500' };
    return colors[type];
  }

  function showTooltip(score: number, type: ESGType, industryName: string) {
    tooltipContent = { visible: true, score, type, industryName };
  }

  function hideTooltip() {
    tooltipContent = { ...tooltipContent, visible: false };
  }

  function handleClickOutside() {
    tooltipContent = { ...tooltipContent, visible: false };
    showDropdown = false;
  }

  function getHeight(value: number): string {
    return `${(value / maxScore) * chartHeight}px`;
  }

  function getGridLinePosition(value: number): string {
    return `${(1 - value / maxScore) * chartHeight}px`;
  }

  function formatIndustryName(name: string): string {
    const words = name.split(' ');
    let lines = [''];
    let currentLine = 0;
    words.forEach(word => {
      if (lines[currentLine].length + word.length > 15 && lines[currentLine].length > 0) {
        currentLine++;
        lines[currentLine] = '';
      }
      lines[currentLine] = lines[currentLine] + (lines[currentLine].length ? ' ' : '') + word;
    });
    return lines.join('\n');
  }

  function toggleIndustry(industry: string) {
    if (selectedIndustries.has(industry)) {
      selectedIndustries.delete(industry);
    } else {
      selectedIndustries.add(industry);
    }
    selectedIndustries = new Set(selectedIndustries);
  }

  function selectAll() {
    selectedIndustries = new Set(industries);
  }

  function clearAll() {
    if (appState.selectedCompany?.industryName) {
      selectedIndustries = new Set([appState.selectedCompany.industryName]);
    } else {
      selectedIndustries = new Set();
    }
  }

  function removeIndustry(industry: string) {
    if (industry === appState.selectedCompany?.industryName) return;
    selectedIndustries.delete(industry);
    selectedIndustries = new Set(selectedIndustries);
  }

  function findIndustryCategory(industryName: string): string | null {
    for (const [category, inds] of Object.entries(industryCategories)) {
      if (inds.includes(industryName)) return category;
    }
    return null;
  }

  function getRelatedIndustries(industryName: string): Set<string> {
    const relatedIndustries = new Set<string>();
    if (!industryName) return new Set(allIndustryData.slice(0, 5).map(d => d.industryName));
    relatedIndustries.add(industryName);
    const parentCategory = findIndustryCategory(industryName);
    if (parentCategory && industryCategories[parentCategory]) {
      industryCategories[parentCategory].forEach(industry => {
        if (industries.includes(industry)) relatedIndustries.add(industry);
      });
    }
    if (relatedIndustries.size < 3) {
      allIndustryData
        .filter(d => !relatedIndustries.has(d.industryName))
        .slice(0, 5 - relatedIndustries.size)
        .forEach(d => relatedIndustries.add(d.industryName));
    }
    return relatedIndustries;
  }

  function processData(companies: Company[]): IndustryData[] {
    const industryGroups = companies.reduce((acc, company) => {
      if (!acc[company.industryName]) {
        acc[company.industryName] = { environmental: [], social: [], governance: [] };
      }
      acc[company.industryName].environmental.push(company.esgScores.environmental.score);
      acc[company.industryName].social.push(company.esgScores.social.score);
      acc[company.industryName].governance.push(company.esgScores.governance.score);
      return acc;
    }, {} as Record<string, { environmental: number[]; social: number[]; governance: number[]; }>);
    return Object.entries(industryGroups)
      .map(([industryName, scores]) => ({
        industryName,
        environmental: average(scores.environmental),
        social: average(scores.social),
        governance: average(scores.governance),
        total: average(scores.environmental) + average(scores.social) + average(scores.governance)
      }))
      .sort((a, b) => b.total - a.total);
  }

  function average(arr: number[]): number {
    return arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;
  }

  function getBarStyles(industryName: string) {
    const isHighlighted = industryName === highlightedIndustry;
    return {
      opacity: isHighlighted ? '1' : '0.7',
      transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      zIndex: isHighlighted ? '10' : '1'
    };
  }

  function getIndustryCategory(industryName: string): string {
    for (const [category, inds] of Object.entries(industryCategories)) {
      if (inds.includes(industryName)) return category;
    }
    return 'Other';
  }
</script>
```

- [ ] **Step 2: Update `<svelte:window>` and `on:click|stopPropagation` in template**

```svelte
<!-- BEFORE -->
<svelte:window on:click={handleClickOutside} />
```
```svelte
<!-- AFTER -->
<svelte:window onclick={handleClickOutside} />
```

Replace all `on:click|stopPropagation={() => showDropdown = !showDropdown}` → `onclick={(e) => { e.stopPropagation(); showDropdown = !showDropdown; }}`

Replace all other `on:click|stopPropagation={fn}` → `onclick={(e) => { e.stopPropagation(); fn(); }}`

Replace all plain `on:click={fn}` → `onclick={fn}`

Replace all `on:mouseenter={fn}` → `onmouseenter={fn}`, `on:mouseleave={fn}` → `onmouseleave={fn}`

---

## Task 10: Migrate MarketCapCorrelation.svelte

**File:** `src/lib/components/MarketCapCorrelation.svelte`

- [ ] **Step 1: Replace the entire `<script>` block**

```svelte
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company, IndustryAccumulator, ProcessedCompanyData } from '$lib/types';
import { appState } from '$lib/state.svelte';

interface Props {
  data?: Company[];
  expanded?: boolean;
}
let { data = [], expanded = false }: Props = $props();

// State
let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let selectedCompany = $state<ProcessedCompanyData | null>(null);
let hoveredPoint = $state<ProcessedCompanyData | null>(null);
let viewMode = $state<'absolute' | 'relative'>('relative');
let showDropdown = $state(false);

// Industry categories and colors (identical to original — kept as const)
const categoryOrder = ['Information Technology','Communication Services','Financials','Industrials','Consumer Discretionary','Consumer Staples','Health Care','Energy','Materials','Utilities'];

const industryCategories = {
  'Information Technology': { base: '#2563EB', industries: [{ name: 'Software', shade: '#2563EB' },{ name: 'IT Services', shade: '#1D4ED8' },{ name: 'Computers & Peripherals and Office Electronics', shade: '#1E40AF' },{ name: 'Semiconductors & Semiconductor Equipment', shade: '#3B82F6' },{ name: 'Communications Equipment', shade: '#60A5FA' },{ name: 'Electronic Equipment, Instruments & Components', shade: '#2563EB' }] },
  'Communication Services': { base: '#EA580C', industries: [{ name: 'Interactive Media, Services & Home Entertainment', shade: '#EA580C' },{ name: 'Media, Movies & Entertainment', shade: '#C2410C' },{ name: 'Telecommunication Services', shade: '#9A3412' }] },
  'Financials': { base: '#059669', industries: [{ name: 'Banks', shade: '#059669' },{ name: 'Diversified Financial Services and Capital Markets', shade: '#047857' },{ name: 'Insurance', shade: '#065F46' },{ name: 'Real Estate Management & Development', shade: '#10B981' },{ name: 'Equity Real Estate Investment Trusts (REITs)', shade: '#34D399' }] },
  'Industrials': { base: '#DC2626', industries: [{ name: 'Aerospace & Defense', shade: '#DC2626' },{ name: 'Airlines', shade: '#B91C1C' },{ name: 'Building Products', shade: '#991B1B' },{ name: 'Machinery and Electrical Equipment', shade: '#EF4444' },{ name: 'Electrical Components & Equipment', shade: '#F87171' },{ name: 'Trading Companies & Distributors', shade: '#DC2626' },{ name: 'Professional Services', shade: '#B91C1C' },{ name: 'Commercial Services & Supplies', shade: '#991B1B' },{ name: 'Construction & Engineering', shade: '#EF4444' },{ name: 'Transportation and Transportation Infrastructure', shade: '#F87171' },{ name: 'Auto Components', shade: '#DC2626' }] },
  'Consumer Discretionary': { base: '#D97706', industries: [{ name: 'Automobiles', shade: '#D97706' },{ name: 'Retailing', shade: '#B45309' },{ name: 'Restaurants & Leisure Facilities', shade: '#92400E' },{ name: 'Hotels, Resorts & Cruise Lines', shade: '#F59E0B' },{ name: 'Leisure Equipment & Products and Consumer Electronics', shade: '#FBBF24' },{ name: 'Homebuilding', shade: '#D97706' },{ name: 'Textiles, Apparel & Luxury Goods', shade: '#B45309' },{ name: 'Casinos & Gaming', shade: '#92400E' },{ name: 'Household Durables', shade: '#F59E0B' }] },
  'Consumer Staples': { base: '#DB2777', industries: [{ name: 'Food Products', shade: '#DB2777' },{ name: 'Food & Staples Retailing', shade: '#BE185D' },{ name: 'Household Products', shade: '#9D174D' },{ name: 'Personal Products', shade: '#EC4899' },{ name: 'Beverages', shade: '#F472B6' },{ name: 'Tobacco', shade: '#DB2777' }] },
  'Health Care': { base: '#0284C7', industries: [{ name: 'Biotechnology', shade: '#0284C7' },{ name: 'Pharmaceuticals', shade: '#0369A1' },{ name: 'Health Care Equipment & Supplies', shade: '#075985' },{ name: 'Health Care Providers & Services', shade: '#0EA5E9' },{ name: 'Life Sciences Tools & Services', shade: '#38BDF8' }] },
  'Energy': { base: '#0D9488', industries: [{ name: 'Oil & Gas Upstream & Integrated', shade: '#0D9488' },{ name: 'Oil & Gas Storage & Transportation', shade: '#0F766E' },{ name: 'Oil & Gas Refining & Marketing', shade: '#115E59' },{ name: 'Energy Equipment & Services', shade: '#14B8A6' }] },
  'Materials': { base: '#65A30D', industries: [{ name: 'Chemicals', shade: '#65A30D' },{ name: 'Construction Materials', shade: '#4D7C0F' },{ name: 'Metals & Mining', shade: '#3F6212' },{ name: 'Containers & Packaging', shade: '#84CC16' },{ name: 'Steel', shade: '#A3E635' }] },
  'Utilities': { base: '#CA8A04', industries: [{ name: 'Electric Utilities', shade: '#CA8A04' },{ name: 'Gas Utilities', shade: '#A16207' },{ name: 'Multi and Water Utilities', shade: '#854D0E' }] }
};

// Derived
let industryStats = $derived(
  data.reduce((acc: IndustryAccumulator, company) => {
    if (!acc[company.industryName]) {
      acc[company.industryName] = { companies: [], avgESG: 0, avgMarketCap: 0, stdDevESG: 0 };
    }
    acc[company.industryName].companies.push(company);
    const stats = acc[company.industryName];
    const validCompanies = stats.companies.filter(c => c.esgScores?.total > 0 && !isNaN(c.esgScores.total));
    if (validCompanies.length > 0) {
      stats.avgESG = validCompanies.reduce((sum, c) => sum + c.esgScores.total, 0) / validCompanies.length;
      const squaredDiffs = validCompanies.map(c => Math.pow(c.esgScores.total - stats.avgESG, 2));
      stats.stdDevESG = Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / validCompanies.length);
      stats.avgMarketCap = validCompanies.reduce((sum, c) => sum + c.marketCap, 0) / validCompanies.length;
    }
    return acc;
  }, {} as IndustryAccumulator)
);

let marketCapData = $derived(
  data.map(company => {
    const stats = industryStats[company.industryName];
    const avgESG = stats?.avgESG || 0;
    const stdDevESG = stats?.stdDevESG || 1;
    const relativeESG = stdDevESG !== 0 ? (company.esgScores.total - avgESG) / stdDevESG : 0;
    return { ...company, relativeESG, isOutlier: Math.abs(relativeESG) > 2, industryAvg: avgESG, industryStdDev: stdDevESG };
  }).filter(d => d.marketCap > 0 && d.esgScores.total > 0)
);

let filteredData = $derived(
  marketCapData.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      company.symbol.toLowerCase().includes(searchLower) ||
      company.fullName.toLowerCase().includes(searchLower) ||
      company.industryName.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  })
);

let height = $derived(expanded ? 600 : 400);
let maxMarketCap = $derived(Math.max(...filteredData.map(d => d.marketCap)));
let maxScore = $derived(viewMode === 'absolute' ? 100 : 4);
let minScore = $derived(viewMode === 'absolute' ? 0 : -4);

let industries = $derived(
  [...new Set(marketCapData.map(d => d.industryName))].sort((a, b) => {
    const getCatForIndustry = (n: string) =>
      Object.entries(industryCategories).find(([_, cat]) => cat.industries.some(i => i.name === n))?.[0] ?? 'Uncategorized';
    const catA = getCatForIndustry(a);
    const catB = getCatForIndustry(b);
    if (catA !== catB) return categoryOrder.indexOf(catA) - categoryOrder.indexOf(catB);
    if (catA !== 'Uncategorized') {
      const cat = industryCategories[catA as keyof typeof industryCategories];
      if (cat) return cat.industries.findIndex(i => i.name === a) - cat.industries.findIndex(i => i.name === b);
    }
    return a.localeCompare(b);
  })
);

let colorScale = $derived(new Map(industries.map(industry => [industry, getIndustryColor(industry)])));

let relevantIndustries = $derived(new Set<string>((() => {
  if (!appState.selectedCompany) return [];
  const selectedCategory = Object.entries(industryCategories)
    .find(([_, cat]) => cat.industries.some(i => i.name === appState.selectedCompany!.industryName))?.[0];
  if (!selectedCategory) return [appState.selectedCompany.industryName];
  return industryCategories[selectedCategory as keyof typeof industryCategories].industries.map(i => i.name);
})()));

let xAxisTicks = $derived((() => {
  const maxValue = maxMarketCap / 1_000_000_000;
  if (maxValue <= 0) return [];
  let interval = maxValue > 1000 ? 200 : maxValue > 500 ? 100 : maxValue > 200 ? 50 : 20;
  const ticks = [];
  for (let i = 0; i <= maxValue; i += interval) ticks.push(i);
  return ticks;
})());

// Sync selected industries with global company
$effect(() => {
  if (appState.selectedCompany && industries.length > 0) {
    selectedIndustries = new Set([...relevantIndustries]);
  }
});

// Functions
function toggleIndustry(industry: string) {
  selectedIndustries = new Set(selectedIndustries);
  if (selectedIndustries.has(industry)) {
    if (industry === appState.selectedCompany?.industryName) return;
    selectedIndustries.delete(industry);
  } else {
    selectedIndustries.add(industry);
  }
}

function selectAll() { selectedIndustries = new Set(industries); }

function clearAll() {
  if (appState.selectedCompany) {
    selectedIndustries = new Set([appState.selectedCompany.industryName]);
  } else {
    selectedIndustries = new Set();
  }
}

function formatMarketCap(value: number): string {
  if (!value || isNaN(value)) return '$0.00';
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)} billion`;
  if (value >= 1_000_000) return `$${(value / 1_000_000_000).toFixed(2)} million`;
  return `$${value.toFixed(2)}`;
}

function handleChartClick() { selectedCompany = null; }

function handlePointClick(company: ProcessedCompanyData, event: Event) {
  event.stopPropagation();
  selectedCompany = selectedCompany === company ? null : company;
}

function getIndustryColor(industryName: string): string {
  for (const [_, cat] of Object.entries(industryCategories)) {
    const industry = cat.industries.find(i => i.name === industryName);
    if (industry) return industry.shade;
  }
  return '#94A3B8';
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

function formatXAxisLabel(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}T` : `${value}B`;
}
</script>
```

- [ ] **Step 2: Update template event handlers**

Global replacements in template:
- `<svelte:window on:click={() => showDropdown = false} />` → `<svelte:window onclick={() => showDropdown = false} />`
- `on:click|stopPropagation={handleDropdownClick}` → `onclick={handleDropdownClick}` (function already calls `e.stopPropagation()`)
- `on:click|stopPropagation={() => {}}` → `onclick={(e) => e.stopPropagation()}`
- `on:click={() => viewMode = 'absolute'}` → `onclick={() => viewMode = 'absolute'}`
- `on:click={() => viewMode = 'relative'}` → `onclick={() => viewMode = 'relative'}`
- `on:click={selectAll}` → `onclick={selectAll}`
- `on:click={clearAll}` → `onclick={clearAll}`
- `on:click={() => toggleIndustry(industry)}` → `onclick={() => toggleIndustry(industry)}`
- `on:click={handleChartClick}` → `onclick={handleChartClick}`
- `on:click|stopPropagation={(e) => handlePointClick(company, e)}` → `onclick={(e) => handlePointClick(company, e)}`
- `on:mouseenter={() => hoveredPoint = company}` → `onmouseenter={() => hoveredPoint = company}`
- `on:mouseleave={() => hoveredPoint = null}` → `onmouseleave={() => hoveredPoint = null}`
- `on:keydown={(e) => { if (e.key === 'Escape') selectedCompany = null; }}` → `onkeydown={(e) => { if (e.key === 'Escape') selectedCompany = null; }}`

Replace all store references in template:
- `$globalSelectedCompany` → `appState.selectedCompany`

---

## Task 11: Migrate ScoreComparison.svelte

**File:** `src/lib/components/ScoreComparison.svelte`

- [ ] **Step 1: Replace the entire `<script>` block**

```svelte
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company } from '$lib/types';
import { appState } from '$lib/state.svelte';

interface Props {
  data?: Company[];
  expanded?: boolean;
}
let { data = [], expanded = false }: Props = $props();

// State
let hoveredCompany = $state<Company | null>(null);
let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let selectedMetric = $state<'absolute' | 'relative'>('absolute');
let showDropdown = $state(false);

// Industry data (identical const objects — copy from original)
interface IndustryInfo { name: string; shade: string; }
const categoryOrder = ['Information Technology','Communication Services','Financials','Industrials','Consumer Discretionary','Consumer Staples','Health Care','Energy','Materials','Utilities'];
const industryCategories = {
  'Information Technology': { base: '#2563EB', industries: [{ name: 'Software', shade: '#2563EB' },{ name: 'IT Services', shade: '#1D4ED8' },{ name: 'Computers & Peripherals and Office Electronics', shade: '#1E40AF' },{ name: 'Semiconductors & Semiconductor Equipment', shade: '#3B82F6' },{ name: 'Communications Equipment', shade: '#60A5FA' },{ name: 'Electronic Equipment, Instruments & Components', shade: '#2563EB' }] },
  'Communication Services': { base: '#EA580C', industries: [{ name: 'Interactive Media, Services & Home Entertainment', shade: '#EA580C' },{ name: 'Media, Movies & Entertainment', shade: '#C2410C' },{ name: 'Telecommunication Services', shade: '#9A3412' }] },
  'Financials': { base: '#059669', industries: [{ name: 'Banks', shade: '#059669' },{ name: 'Diversified Financial Services and Capital Markets', shade: '#047857' },{ name: 'Insurance', shade: '#065F46' },{ name: 'Real Estate Management & Development', shade: '#10B981' },{ name: 'Equity Real Estate Investment Trusts (REITs)', shade: '#34D399' }] },
  'Industrials': { base: '#DC2626', industries: [{ name: 'Aerospace & Defense', shade: '#DC2626' },{ name: 'Airlines', shade: '#B91C1C' },{ name: 'Building Products', shade: '#991B1B' },{ name: 'Machinery and Electrical Equipment', shade: '#EF4444' },{ name: 'Electrical Components & Equipment', shade: '#F87171' },{ name: 'Trading Companies & Distributors', shade: '#DC2626' },{ name: 'Professional Services', shade: '#B91C1C' },{ name: 'Commercial Services & Supplies', shade: '#991B1B' },{ name: 'Construction & Engineering', shade: '#EF4444' },{ name: 'Transportation and Transportation Infrastructure', shade: '#F87171' },{ name: 'Auto Components', shade: '#DC2626' }] },
  'Consumer Discretionary': { base: '#D97706', industries: [{ name: 'Automobiles', shade: '#D97706' },{ name: 'Retailing', shade: '#B45309' },{ name: 'Restaurants & Leisure Facilities', shade: '#92400E' },{ name: 'Hotels, Resorts & Cruise Lines', shade: '#F59E0B' },{ name: 'Leisure Equipment & Products and Consumer Electronics', shade: '#FBBF24' },{ name: 'Homebuilding', shade: '#D97706' },{ name: 'Textiles, Apparel & Luxury Goods', shade: '#B45309' },{ name: 'Casinos & Gaming', shade: '#92400E' },{ name: 'Household Durables', shade: '#F59E0B' }] },
  'Consumer Staples': { base: '#DB2777', industries: [{ name: 'Food Products', shade: '#DB2777' },{ name: 'Food & Staples Retailing', shade: '#BE185D' },{ name: 'Household Products', shade: '#9D174D' },{ name: 'Personal Products', shade: '#EC4899' },{ name: 'Beverages', shade: '#F472B6' },{ name: 'Tobacco', shade: '#DB2777' }] },
  'Health Care': { base: '#0284C7', industries: [{ name: 'Biotechnology', shade: '#0284C7' },{ name: 'Pharmaceuticals', shade: '#0369A1' },{ name: 'Health Care Equipment & Supplies', shade: '#075985' },{ name: 'Health Care Providers & Services', shade: '#0EA5E9' },{ name: 'Life Sciences Tools & Services', shade: '#38BDF8' }] },
  'Energy': { base: '#0D9488', industries: [{ name: 'Oil & Gas Upstream & Integrated', shade: '#0D9488' },{ name: 'Oil & Gas Storage & Transportation', shade: '#0F766E' },{ name: 'Oil & Gas Refining & Marketing', shade: '#115E59' },{ name: 'Energy Equipment & Services', shade: '#14B8A6' }] },
  'Materials': { base: '#65A30D', industries: [{ name: 'Chemicals', shade: '#65A30D' },{ name: 'Construction Materials', shade: '#4D7C0F' },{ name: 'Metals & Mining', shade: '#3F6212' },{ name: 'Containers & Packaging', shade: '#84CC16' },{ name: 'Steel', shade: '#A3E635' }] },
  'Utilities': { base: '#CA8A04', industries: [{ name: 'Electric Utilities', shade: '#CA8A04' },{ name: 'Gas Utilities', shade: '#A16207' },{ name: 'Multi and Water Utilities', shade: '#854D0E' }] }
};

// Derived
let categorizedIndustries = $derived(
  new Set(Object.values(industryCategories).flatMap(cat => cat.industries.map(i => i.name)))
);

let industries = $derived(
  [...new Set(data.map(d => d.industryName))]
    .filter(industry => categorizedIndustries.has(industry))
    .sort((a, b) => {
      const getCatForIndustry = (n: string) =>
        Object.entries(industryCategories).find(([_, cat]) => cat.industries.some(i => i.name === n))?.[0] ?? '';
      const catA = getCatForIndustry(a);
      const catB = getCatForIndustry(b);
      if (catA !== catB) return categoryOrder.indexOf(catA) - categoryOrder.indexOf(catB);
      const cat = industryCategories[catA as keyof typeof industryCategories];
      if (cat) return cat.industries.findIndex(i => i.name === a) - cat.industries.findIndex(i => i.name === b);
      return a.localeCompare(b);
    })
);

let currentCategory = $derived(
  appState.selectedCompany
    ? Object.entries(industryCategories).find(([_, cat]) =>
        cat.industries.some(i => i.name === appState.selectedCompany?.industryName)
      )?.[0]
    : null
);

let relevantIndustries = $derived(new Set<string>((() => {
  if (!appState.selectedCompany) return industries;
  if (!currentCategory) return [appState.selectedCompany.industryName];
  return industryCategories[currentCategory as keyof typeof industryCategories]
    .industries.map(i => i.name).filter(name => industries.includes(name));
})()));

let processedData = $derived(
  data.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      company.fullName.toLowerCase().includes(searchLower) ||
      company.symbol.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  })
);

let colorScale = $derived(new Map(industries.map(industry => [industry, getIndustryColor(industry)])));

let xAxisTicks = $derived(selectedMetric === 'absolute' ? [0, 20, 40, 60, 80, 100] : [-50, -25, 0, 25, 50]);
let yAxisTicks = $derived(selectedMetric === 'absolute' ? [0, 20, 40, 60, 80, 100] : [-50, -25, 0, 25, 50]);

// Sync with global company selection
$effect(() => {
  if (appState.selectedCompany) {
    const relatedInds = [...relevantIndustries];
    if (relatedInds.length > 0) selectedIndustries = new Set(relatedInds);
  }
});

// Replace onMount click-outside with $effect
$effect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (showDropdown) {
      const dropdown = document.querySelector('.industry-dropdown');
      if (!dropdown?.contains(event.target as Node)) showDropdown = false;
    }
  };
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
});

// Functions
function toggleIndustry(industry: string) {
  selectedIndustries = new Set(selectedIndustries);
  if (selectedIndustries.has(industry)) {
    if (appState.selectedCompany?.industryName === industry) return;
    selectedIndustries.delete(industry);
  } else {
    selectedIndustries.add(industry);
  }
}

function selectAll() { selectedIndustries = new Set(industries); }

function clearAll() {
  if (appState.selectedCompany) {
    selectedIndustries = new Set([appState.selectedCompany.industryName]);
  } else {
    selectedIndustries = new Set();
  }
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

function getIndustryColor(industryName: string): string {
  for (const [_, cat] of Object.entries(industryCategories)) {
    const industry = cat.industries.find(i => i.name === industryName);
    if (industry) return industry.shade;
  }
  return '#94A3B8';
}

function getBubbleSize(score: number): number {
  const minSize = 6;
  const maxSize = expanded ? 32 : 24;
  if (score < 20) return minSize;
  if (score < 40) return minSize + 6;
  if (score < 60) return minSize + 12;
  if (score < 80) return minSize + 18;
  return maxSize;
}

function getTickPosition(tick: number): string {
  return selectedMetric === 'absolute' ? `${tick}%` : `${tick + 50}%`;
}

function getTickLabel(tick: number): string {
  return selectedMetric === 'relative' ? (tick > 0 ? `+${tick}%` : `${tick}%`) : tick.toString();
}

function isSelectedCompany(company: Company): boolean {
  return appState.selectedCompany?.symbol === company.symbol;
}
</script>
```

- [ ] **Step 2: Update template event handlers**

Same replacements as Task 10:
- `on:click={...}` → `onclick={...}`
- `on:click|stopPropagation={...}` → `onclick={...}` (where fn already stops propagation) or `onclick={(e) => { e.stopPropagation(); ... }}`
- `on:mouseenter` → `onmouseenter`, `on:mouseleave` → `onmouseleave`
- `$globalSelectedCompany` → `appState.selectedCompany`

---

## Task 12: Migrate StockPriceCorrelation.svelte

**File:** `src/lib/components/StockPriceCorrelation.svelte`

- [ ] **Step 1: Replace the entire `<script>` block**

```svelte
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company, PriceData } from '$lib/types';
import { appState } from '$lib/state.svelte';

// Types
interface ProcessedCompany extends Company { priceChange: number; }

// Props
interface Props {
  data?: Company[];
  priceData?: Record<string, PriceData[]>;
  expanded?: boolean;
}
let { data = [], priceData = {}, expanded = false }: Props = $props();

// State
let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let hoveredCompany = $state<ProcessedCompany | null>(null);
let selectedMetric = $state<'total' | 'environmental' | 'social' | 'governance'>('total');
let yAxisScale = $state('linear');
let showDropdown = $state(false);
let yMin = $state(-100);
let yMax = $state(800);

// Constants
const categoryOrder = ['Information Technology','Communication Services','Financials','Industrials','Consumer Discretionary','Consumer Staples','Health Care','Energy','Materials','Utilities'];
const industryCategories = {
  'Information Technology': { base: '#2563EB', industries: [{ name: 'Software', shade: '#2563EB' },{ name: 'IT Services', shade: '#1D4ED8' },{ name: 'Computers & Peripherals and Office Electronics', shade: '#1E40AF' },{ name: 'Semiconductors & Semiconductor Equipment', shade: '#3B82F6' },{ name: 'Communications Equipment', shade: '#60A5FA' },{ name: 'Electronic Equipment, Instruments & Components', shade: '#2563EB' }] },
  'Communication Services': { base: '#EA580C', industries: [{ name: 'Interactive Media, Services & Home Entertainment', shade: '#EA580C' },{ name: 'Media, Movies & Entertainment', shade: '#C2410C' },{ name: 'Telecommunication Services', shade: '#9A3412' }] },
  'Financials': { base: '#059669', industries: [{ name: 'Banks', shade: '#059669' },{ name: 'Diversified Financial Services and Capital Markets', shade: '#047857' },{ name: 'Insurance', shade: '#065F46' },{ name: 'Real Estate Management & Development', shade: '#10B981' },{ name: 'Equity Real Estate Investment Trusts (REITs)', shade: '#34D399' }] },
  'Industrials': { base: '#DC2626', industries: [{ name: 'Aerospace & Defense', shade: '#DC2626' },{ name: 'Airlines', shade: '#B91C1C' },{ name: 'Building Products', shade: '#991B1B' },{ name: 'Machinery and Electrical Equipment', shade: '#EF4444' },{ name: 'Electrical Components & Equipment', shade: '#F87171' },{ name: 'Trading Companies & Distributors', shade: '#DC2626' },{ name: 'Professional Services', shade: '#B91C1C' },{ name: 'Commercial Services & Supplies', shade: '#991B1B' },{ name: 'Construction & Engineering', shade: '#EF4444' },{ name: 'Transportation and Transportation Infrastructure', shade: '#F87171' },{ name: 'Auto Components', shade: '#DC2626' }] },
  'Consumer Discretionary': { base: '#D97706', industries: [{ name: 'Automobiles', shade: '#D97706' },{ name: 'Retailing', shade: '#B45309' },{ name: 'Restaurants & Leisure Facilities', shade: '#92400E' },{ name: 'Hotels, Resorts & Cruise Lines', shade: '#F59E0B' },{ name: 'Leisure Equipment & Products and Consumer Electronics', shade: '#FBBF24' },{ name: 'Homebuilding', shade: '#D97706' },{ name: 'Textiles, Apparel & Luxury Goods', shade: '#B45309' },{ name: 'Casinos & Gaming', shade: '#92400E' },{ name: 'Household Durables', shade: '#F59E0B' }] },
  'Consumer Staples': { base: '#DB2777', industries: [{ name: 'Food Products', shade: '#DB2777' },{ name: 'Food & Staples Retailing', shade: '#BE185D' },{ name: 'Household Products', shade: '#9D174D' },{ name: 'Personal Products', shade: '#EC4899' },{ name: 'Beverages', shade: '#F472B6' },{ name: 'Tobacco', shade: '#DB2777' }] },
  'Health Care': { base: '#0284C7', industries: [{ name: 'Biotechnology', shade: '#0284C7' },{ name: 'Pharmaceuticals', shade: '#0369A1' },{ name: 'Health Care Equipment & Supplies', shade: '#075985' },{ name: 'Health Care Providers & Services', shade: '#0EA5E9' },{ name: 'Life Sciences Tools & Services', shade: '#38BDF8' }] },
  'Energy': { base: '#0D9488', industries: [{ name: 'Oil & Gas Upstream & Integrated', shade: '#0D9488' },{ name: 'Oil & Gas Storage & Transportation', shade: '#0F766E' },{ name: 'Oil & Gas Refining & Marketing', shade: '#115E59' },{ name: 'Energy Equipment & Services', shade: '#14B8A6' }] },
  'Materials': { base: '#65A30D', industries: [{ name: 'Chemicals', shade: '#65A30D' },{ name: 'Construction Materials', shade: '#4D7C0F' },{ name: 'Metals & Mining', shade: '#3F6212' },{ name: 'Containers & Packaging', shade: '#84CC16' },{ name: 'Steel', shade: '#A3E635' }] },
  'Utilities': { base: '#CA8A04', industries: [{ name: 'Electric Utilities', shade: '#CA8A04' },{ name: 'Gas Utilities', shade: '#A16207' },{ name: 'Multi and Water Utilities', shade: '#854D0E' }] }
};

// Derived
let categorizedIndustries = $derived(
  new Set(Object.values(industryCategories).flatMap(cat => cat.industries.map(i => i.name)))
);

let industries = $derived(
  [...new Set(data.map(d => d.industryName))]
    .filter(industry => categorizedIndustries.has(industry))
    .sort((a, b) => {
      const getCatForIndustry = (n: string) =>
        Object.entries(industryCategories).find(([_, cat]) => cat.industries.some(i => i.name === n))?.[0] ?? '';
      const catA = getCatForIndustry(a);
      const catB = getCatForIndustry(b);
      if (catA !== catB) return categoryOrder.indexOf(catA) - categoryOrder.indexOf(catB);
      const cat = industryCategories[catA as keyof typeof industryCategories];
      if (cat) return cat.industries.findIndex(i => i.name === a) - cat.industries.findIndex(i => i.name === b);
      return a.localeCompare(b);
    })
);

let colorScale = $derived(new Map(industries.map(industry => [industry, getIndustryColor(industry)])));

let relevantIndustries = $derived(new Set<string>((() => {
  if (!appState.selectedCompany) return industries;
  const selectedCategory = Object.entries(industryCategories)
    .find(([_, cat]) => cat.industries.some(i => i.name === appState.selectedCompany!.industryName))?.[0];
  if (!selectedCategory) return new Set([appState.selectedCompany.industryName]);
  return industryCategories[selectedCategory as keyof typeof industryCategories]
    .industries.map(i => i.name).filter(name => industries.includes(name));
})()));

let processedData = $derived(
  data.map(company => ({
    ...company,
    priceChange: priceData[company.symbol] ? calculatePriceChange(priceData[company.symbol]) ?? 0 : 0
  })).filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      company.fullName.toLowerCase().includes(searchLower) ||
      company.symbol.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  }) as ProcessedCompany[]
);

let xMax = $derived(Math.max(...processedData.map(d => getSelectedEsgScore(d))));

let yTicks = $derived(generateYAxisTicks(yMin, yMax));

let statistics = $derived(processedData.length >= 3 ? {
  stats: { quartiles: calculateQuartiles(processedData) }
} : null);

let visibleIndustries = $derived(appState.selectedCompany ? [...relevantIndustries] : industries);

let insights = $derived(calculateDataInsights(processedData));

// Sync selected industries + yMin/yMax
$effect(() => {
  if (appState.selectedCompany) {
    const relatedInds = [...relevantIndustries];
    if (relatedInds.length > 0) selectedIndustries = new Set(relatedInds);
  }
});

$effect(() => {
  const prices = processedData.map(d => d.priceChange);
  if (prices.length > 0) {
    yMin = Math.floor(Math.min(...prices) / 10) * 10;
    yMax = Math.ceil(Math.max(...prices) / 10) * 10;
  }
});

// Click outside handler
$effect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (showDropdown) {
      const dropdown = document.querySelector('.industry-dropdown');
      if (!dropdown?.contains(event.target as Node)) showDropdown = false;
    }
  };
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
});

// Functions
function calculatePriceChange(prices: PriceData[]): number | null {
  if (!prices || prices.length < 2) return null;
  const sorted = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return ((sorted[sorted.length - 1].price - sorted[0].price) / sorted[0].price) * 100;
}

function generateYAxisTicks(min: number, max: number): number[] {
  const step = (max - min) / 8;
  return Array.from({ length: 9 }, (_, i) => min + step * i);
}

function getSelectedEsgScore(company: Company): number {
  switch (selectedMetric) {
    case 'environmental': return company.esgScores.environmental.score;
    case 'social': return company.esgScores.social.score;
    case 'governance': return company.esgScores.governance.score;
    default: return company.esgScores.total;
  }
}

function formatPriceChange(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function getIndustryColor(industryName: string): string {
  for (const [_, cat] of Object.entries(industryCategories)) {
    const industry = cat.industries.find(i => i.name === industryName);
    if (industry) return industry.shade;
  }
  return '#94A3B8';
}

function getYPosition(value: number): string {
  if (yAxisScale === 'log' && value > 0) {
    return `${((Math.log10(value) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * 100}%`;
  }
  return `${((value - yMin) / (yMax - yMin)) * 100}%`;
}

function selectAll() {
  selectedIndustries = new Set(appState.selectedCompany ? [...relevantIndustries] : industries);
}

function clearAll() {
  selectedIndustries = new Set(appState.selectedCompany ? [appState.selectedCompany.industryName] : []);
}

function toggleIndustry(industry: string) {
  if (appState.selectedCompany?.industryName === industry) return;
  selectedIndustries = new Set(selectedIndustries);
  selectedIndustries.has(industry) ? selectedIndustries.delete(industry) : selectedIndustries.add(industry);
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

function getPointColor(priceChange: number, industry: string): string {
  return colorScale.get(industry) || '#808080';
}

function calculateQuartiles(data: ProcessedCompany[]) {
  const sortedEsg = [...data].sort((a, b) => getSelectedEsgScore(a) - getSelectedEsgScore(b));
  const sortedPrice = [...data].sort((a, b) => a.priceChange - b.priceChange);
  return {
    esg: { min: getSelectedEsgScore(sortedEsg[0]), max: getSelectedEsgScore(sortedEsg[sortedEsg.length - 1]) },
    price: { min: sortedPrice[0].priceChange, max: sortedPrice[sortedPrice.length - 1].priceChange }
  };
}

function calculateDataInsights(data: ProcessedCompany[]) {
  if (data.length === 0) return null;
  const esgScores = data.map(d => getSelectedEsgScore(d));
  const priceChanges = data.map(d => d.priceChange);
  const esgRange = `${Math.floor(Math.min(...esgScores))}-${Math.ceil(Math.max(...esgScores))}`;
  const priceRange = `${Math.min(...priceChanges).toFixed(1)}% and ${Math.max(...priceChanges).toFixed(1)}%`;
  const highEsgAvg = data.filter(d => getSelectedEsgScore(d) > 60).reduce((s, c) => s + c.priceChange, 0) / (data.filter(d => getSelectedEsgScore(d) > 60).length || 1);
  const lowEsgAvg = data.filter(d => getSelectedEsgScore(d) <= 60).reduce((s, c) => s + c.priceChange, 0) / (data.filter(d => getSelectedEsgScore(d) <= 60).length || 1);
  const correlation = Math.abs(calculateCorrelation(esgScores, priceChanges));
  return {
    esgRange,
    priceRange,
    performanceTrend: highEsgAvg > lowEsgAvg ? 'positive' : 'negative',
    predictiveStrength: correlation > 0.5 ? 'strong' : correlation > 0.3 ? 'moderate' : 'weak'
  };
}

function calculateCorrelation(xs: number[], ys: number[]): number {
  const xMean = xs.reduce((a, b) => a + b) / xs.length;
  const yMean = ys.reduce((a, b) => a + b) / ys.length;
  const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
  const denominator = Math.sqrt(
    xs.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) *
    ys.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
  );
  return numerator / denominator;
}
</script>
```

- [ ] **Step 2: Update template event handlers**

Same pattern as Tasks 10–11:
- `on:click={...}` → `onclick={...}`
- `on:click|stopPropagation={...}` → `onclick={...}` (fns that already call stopPropagation) or wrap
- `on:mouseenter` → `onmouseenter`, `on:mouseleave` → `onmouseleave`
- `$globalSelectedCompany` → `appState.selectedCompany`

---

## Task 13: Migrate DashboardLayout.svelte

**File:** `src/lib/components/DashboardLayout.svelte`

Key changes: `bind:this` stays the same in Svelte 5, `onMount` with cleanup → `$effect` with cleanup return, `<slot />` → `{@render children()}`.

- [ ] **Step 1: Replace the entire file**

```svelte
<!-- $lib/components/DashboardLayout.svelte -->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  children: Snippet;
}
let { children }: Props = $props();

let container = $state<HTMLElement | undefined>(undefined);
let wrapper = $state<HTMLElement | undefined>(undefined);

function updateLayout() {
  if (container && wrapper) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const baseWidth = viewportWidth * 2;
    const baseHeight = viewportHeight * 2;
    const scale = 0.5;
    container.style.transform = `scale(${scale})`;
    container.style.width = `${baseWidth}px`;
    container.style.minHeight = `${baseHeight}px`;
    container.style.transformOrigin = '0 0';
    wrapper.style.width = `${viewportWidth}px`;
    wrapper.style.minHeight = `${viewportHeight}px`;
    wrapper.style.overflow = 'auto';
  }
}

$effect(() => {
  updateLayout();
  window.addEventListener('resize', updateLayout);
  return () => {
    window.removeEventListener('resize', updateLayout);
  };
});
</script>

<div class="dashboard-wrapper" bind:this={wrapper}>
  <div class="dashboard-container" bind:this={container}>
    {@render children()}
  </div>
</div>

<style>
  .dashboard-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 100vh;
    overflow-y: auto;
  }

  .dashboard-container {
    position: absolute;
    top: 0;
    left: 0;
    background: white;
    min-height: 100%;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: auto;
  }
</style>
```

---

## Task 14: Migrate +layout.svelte

**File:** `src/routes/+layout.svelte`

The `page` store import was unused — remove it. Replace `<slot />` with `{@render children()}`.

- [ ] **Step 1: Replace the entire file**

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import DashboardLayout from '$lib/components/DashboardLayout.svelte';
  import type { Snippet } from 'svelte';

  interface Props { children: Snippet; }
  let { children }: Props = $props();
</script>

<DashboardLayout>
  <main>
    {@render children()}
  </main>
</DashboardLayout>

<style>
  :global(main) {
    padding: 2rem;
    width: 100%;
    height: 100%;
  }
</style>
```

---

## Task 15: Migrate +page.svelte

**File:** `src/routes/+page.svelte`

Key changes: `$:` derived → `$derived`, `onMount` → `$effect`, `on:click` → `onclick`, `$companies`/`$priceDataStore` → `appState.*`.

- [ ] **Step 1: Replace the entire `<script>` block**

```svelte
<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { loadAllData } from '$lib/data';
  import { Card } from '$lib/components/ui/card';
  import CompanySearch from '$lib/components/CompanySearch.svelte';
  import CompanyProfile from '$lib/components/CompanyProfile.svelte';
  import ESGIndustryAnalysis from '$lib/components/ESGIndustryAnalysis.svelte';
  import MarketCapCorrelation from '$lib/components/MarketCapCorrelation.svelte';
  import ScoreComparison from '$lib/components/ScoreComparison.svelte';
  import StockPriceCorrelation from '$lib/components/StockPriceCorrelation.svelte';
  import type { PriceData } from '$lib/types';

  let loading = $state(true);
  let activeChart = $state(0);

  const charts = [
    { id: 0, title: 'Industrial Score Breakdown', icon: '📊' },
    { id: 1, title: 'ESG vs Market Cap', icon: '💰' },
    { id: 2, title: 'Score Comparison', icon: '⚖️' },
    { id: 3, title: 'ESG vs Stock Price', icon: '📉' }
  ];

  let priceDataRecord = $derived(
    Object.fromEntries(appState.priceData) as Record<string, PriceData[]>
  );

  $effect(() => {
    loadAllData()
      .catch((error) => console.error('Error loading data:', error))
      .finally(() => { loading = false; });
  });
</script>
```

- [ ] **Step 2: Update template**

```svelte
<!-- Replace on:click with onclick -->
<!-- BEFORE -->
<button
  class="nav-button {activeChart === chart.id ? 'active' : ''}"
  on:click={() => activeChart = chart.id}
>

<!-- AFTER -->
<button
  class="nav-button {activeChart === chart.id ? 'active' : ''}"
  onclick={() => activeChart = chart.id}
>
```

```svelte
<!-- Replace store subscriptions -->
<!-- BEFORE -->
{:else if $companies.length > 0}
  <ESGIndustryAnalysis data={$companies} expanded={false} />
  <MarketCapCorrelation data={$companies} expanded={false} />
  <ScoreComparison data={$companies} expanded={false} />
  <StockPriceCorrelation data={$companies} priceData={priceDataRecord} expanded={false} />

<!-- AFTER -->
{:else if appState.companies.length > 0}
  <ESGIndustryAnalysis data={appState.companies} expanded={false} />
  <MarketCapCorrelation data={appState.companies} expanded={false} />
  <ScoreComparison data={appState.companies} expanded={false} />
  <StockPriceCorrelation data={appState.companies} priceData={priceDataRecord} expanded={false} />
```

---

## Task 16: Final verification

- [ ] **Step 1: Run full type check**

Run: `npm run check 2>&1`

Expected: 0 errors. If any errors remain, fix them before proceeding.

- [ ] **Step 2: Run production build**

Run: `npm run build 2>&1`

Expected: build completes with no errors. Vite output shows bundled chunks.

- [ ] **Step 3: Start dev server and smoke test**

Run: `npm run dev`

Open browser to `localhost:5173` and verify:
1. Dashboard loads without blank screen
2. "Loading data..." appears briefly, then charts are visible
3. Company search works — type "Apple", select AAPL, profile appears with stock chart and ESG scores
4. All four chart tabs (Industrial Score Breakdown, ESG vs Market Cap, Score Comparison, ESG vs Stock Price) render without errors
5. Industry dropdowns open and close

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "refactor: migrate codebase to Svelte 5 runes"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ All `writable` stores → `$state` in `state.svelte.ts`
- ✅ All `export let` → `$props()`
- ✅ All `$:` → `$derived` or `$effect`
- ✅ All `on:event` → `onevent`
- ✅ All `<slot />` → `{@render children()}`
- ✅ All `$$restProps` → spread from `$props()`
- ✅ `svelte-chartjs` kept as-is (Phase 3 concern)
- ✅ `FilterState` migrated as-is, not wired
- ✅ `<svelte:window on:click>` → `<svelte:window onclick>`
- ✅ `onMount` cleanup patterns → `$effect` with return

**Potential issues to watch:**
- `svelte-chartjs` v3 may not be Svelte 5 compatible. If `<Line>` component fails to render, the workaround is wrapping Chart.js directly in `$effect` with a canvas `bind:this`. The `StockPriceChart` component will need this fallback in that case.
- `appState.priceData` is a `Map` — the `$state` wrapper on a `Map` means mutations (`.set()`) won't be reactive. The `loadAllData` function assigns a new `Map` via `appState.priceData = ...` which is reactive. This is correct.
- `Set` state in analysis components: `selectedIndustries.delete(industry)` mutates in place without triggering reactivity. The pattern `selectedIndustries = new Set(selectedIndustries)` after mutation is carried over from Svelte 4 and still needed in Svelte 5 for the same reason.
