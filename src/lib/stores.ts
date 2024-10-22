import { writable } from 'svelte/store';
import type { ESGData, PriceData, FilterState } from './types';

// Create stores for our data
export const esgData = writable<ESGData[]>([]);
export const priceData = writable<PriceData[]>([]);

// Filter state store with corrected type for sortBy
export const filterState = writable<FilterState>({
	timeRange: [new Date(new Date().setFullYear(new Date().getFullYear() - 1)), new Date()],
	selectedSectors: [],
	selectedIndustries: [],
	selectedCompanies: [],
	locationFilter: [],
	esgScoreRange: [0, 100],
	dataAvailabilityFilter: [],
	sortBy: 'total_esg_score', // Changed to match the new field name
	sortDirection: 'desc'
});

// Selected company store
export const selectedCompany = writable<string | null>(null);
