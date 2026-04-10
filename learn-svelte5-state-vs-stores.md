# Session Learning Notes
<!-- Created by session-teacher skill -->
<!-- Open a new Claude Code session, share this file, and say "teach me about this session" -->

## Concepts in This Session
- Reactive State Management (the general concept)
- Svelte 4 Writable Stores vs Svelte 5 Runes ($state, $derived)
- Module-Level vs Component-Level State (architectural pattern)
- Derived State / Computed Values ($: reactive declarations vs $derived)

## The Goal
We are migrating the ESG Dashboard app from Svelte 4 to Svelte 5. The focus of this teaching session is one specific architectural shift: replacing Svelte 4's `writable()` store system with Svelte 5's runes-based state system. The concrete example is `CompanySearch.svelte`, a search component that reads a shared list of companies and writes back which company the user selected.

## What Happened — Full Timeline
- The app had a `src/lib/stores/index.ts` that exported multiple `writable()` stores — one for `companies`, one for `selectedCompany`, one for `priceDataStore`, one for `filterState`.
- Every component that needed shared data imported those stores by name and used the `$storeName` syntax (dollar-sign prefix) to read them reactively.
- `$: filteredCompanies = searchTerm ? $companies.filter(...)` used Svelte 4's reactive declaration syntax to auto-recompute a filtered list.
- When a user selected a company, the code called `selectedCompany.set(company)` — the store's `.set()` method.
- In the migration, `stores/index.ts` was deleted entirely and replaced with `src/lib/state.svelte.ts`, a module that holds one `appState` object using `$state()`.
- Components now import `appState` directly and read `appState.companies`, write `appState.selectedCompany = company` — no `.set()`, no `$` prefix for shared state.
- Local reactive variables inside components switched from `let searchTerm = ''` (plain variable) + `$: filteredCompanies = ...` (reactive declaration) to `let searchTerm = $state('')` and `let filteredCompanies = $derived(...)`.

## Key Error Messages or Symptoms
No errors were introduced by this migration — the session was a planned refactor. The pre-existing type errors in FilterPanel.svelte (`minESGScore` / `maxESGScore` not on FilterState type) were noted and left alone intentionally (scope rule: don't fix things you weren't asked to fix).

## Code That Changed

### Before (Svelte 4) — stores/index.ts
```typescript
import { writable } from 'svelte/store';
import type { Company, PriceData, FilterState } from '$lib/types';

export const companies = writable<Company[]>([]);
export const selectedCompany = writable<Company | null>(null);
export const priceDataStore = writable(new Map<string, PriceData[]>());
export const filterState = writable<FilterState>({ ... });
```

### Before (Svelte 4) — CompanySearch.svelte script block
```svelte
<script lang="ts">
  import { companies, selectedCompany } from '$lib/stores';
  import type { Company } from '$lib/types';

  let searchTerm = '';

  $: filteredCompanies = searchTerm
    ? $companies.filter((company) => { ... }).slice(0, 5)
    : [];

  function selectCompany(company: Company) {
    selectedCompany.set(company);   // <-- calling .set() on the store object
    searchTerm = '';
  }
</script>
```

### After (Svelte 5) — state.svelte.ts (replaces stores/index.ts)
```typescript
import type { Company, PriceData, FilterState } from '$lib/types';

export const appState = $state({
  companies: [] as Company[],
  selectedCompany: null as Company | null,
  priceData: new Map<string, PriceData[]>(),
  filterState: { ... } as FilterState
});
```

### After (Svelte 5) — CompanySearch.svelte script block
```svelte
<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { Company } from '$lib/types';

  let searchTerm = $state('');                   // <-- local reactive state

  let filteredCompanies = $derived(             // <-- auto-computed from searchTerm + appState
    searchTerm
      ? appState.companies.filter(...).slice(0, 5)
      : []
  );

  function selectCompany(company: Company) {
    appState.selectedCompany = company;          // <-- plain assignment, no .set()
    searchTerm = '';
  }
</script>
```

## Root Cause
Not a bug — a deliberate design change. Svelte 4 required a special "store" object type with `.subscribe()`, `.set()`, and `.update()` methods, and the `$` prefix syntax to auto-subscribe/unsubscribe in components. Svelte 5 introduces "runes" — compiler-understood keywords like `$state()` and `$derived()` — that let the compiler track reactivity directly from normal-looking variable assignments, eliminating the need for a separate store API.

## The Fix Explained
Two layers of change work together:

1. **Shared state**: Moved from many separate `writable()` exports to one `appState` object created with `$state()` in a `.svelte.ts` file. Components import `appState` and read/write its properties directly — the compiler makes those reads/writes reactive automatically.

2. **Local component state**: Moved from plain `let` variables (not reactive) + `$:` labels (reactive) to `$state()` for mutable local values and `$derived()` for computed values. The intent is now explicit and visible in the code.

## Failed Approaches (if any)
None in this session — the migration followed a pre-written plan with exact code provided. The one notable decision was to *not* fix a pre-existing type error in FilterPanel.svelte (FilterState missing minESGScore/maxESGScore fields) per the scope rule: fix only what you were asked to fix.

## Concepts to Teach (tutor notes)
- **Reactive State Management**: explain what "reactive" means — the UI automatically re-renders when data changes, you don't manually update the DOM
- **Svelte 4 Writable Stores**: stores are special objects with a publish/subscribe contract; the `$` prefix is syntactic sugar for auto-subscribing and auto-unsubscribing
- **Svelte 5 Runes ($state, $derived)**: runes are compiler magic — `$state()` and `$derived()` aren't functions you import, they're keywords the Svelte compiler understands and transforms
- **Module-Level vs Component-Level State**: the architectural question of "where does this data live?" — shared state (needed by multiple components) goes in a module; local UI state (only needed by one component) stays in the component
- **Derived State**: a value that is always computed from other state — never set directly, always recalculated when its dependencies change
