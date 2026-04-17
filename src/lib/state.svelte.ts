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
  } satisfies FilterState
});
