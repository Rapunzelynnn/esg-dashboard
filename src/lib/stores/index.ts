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
