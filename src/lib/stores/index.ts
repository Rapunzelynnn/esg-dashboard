// lib/stores/index.ts
import { writable } from 'svelte/store';
import type { Company, ESGData, PriceData, FilterState } from '../types';

// Company data and selection stores
export const companies = writable<Company[]>([]);
export const selectedCompany = writable<Company | null>(null);
// ESG and Price data stores
export const esgDataStore = writable<ESGData[]>([]);
export const priceDataStore = writable<PriceData[]>([]);

// Filter state store
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

// Data loading and parsing functions
export function parseCSV(csvText: string): Company[] {
	const lines = csvText.split('\n');

	// Log the first few lines to check the data structure
	console.log('First few lines:', lines.slice(0, 3));

	return lines
		.slice(1) // Skip header row
		.filter((line) => line.trim() !== '')
		.map((line) => {
			// First split by quotes to protect comma-containing fields
			const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
			const values = (line.match(pattern) || []).map((value) =>
				value.replace(/^"(.*)"$/, '$1').trim()
			);

			// Log AAPL raw data
			if (values[0] === 'AAPL') {
				console.log('Raw AAPL data:', values);
			}

			const company: Company = {
				symbol: values[0],
				fullName: values[1] || `${values[0]} Inc.`, // Fallback if full name is missing
				industryCode: values[4],
				industryName: values[5],
				location: values[7],
				marketCap: parseFloat(values[21]),
				beta: parseFloat(values[22]),
				esgScores: {
					total: parseFloat(values[8]),
					environmental: {
						score: parseFloat(values[9]),
						mean: parseFloat(values[10]),
						max: parseFloat(values[11])
					},
					social: {
						score: parseFloat(values[12]),
						mean: parseFloat(values[13]),
						max: parseFloat(values[14])
					},
					governance: {
						score: parseFloat(values[15]),
						mean: parseFloat(values[16]),
						max: parseFloat(values[17])
					},
					percentile: parseFloat(values[18]),
					ratingYear: parseFloat(values[19]),
					ratingMonth: parseFloat(values[20])
				}
			};

			// Debug logging for AAPL
			// Log parsed AAPL data
			if (company.symbol === 'AAPL') {
				console.log('Parsed AAPL:', company);
			}

			return company;
		});
}

export async function loadCompanyData() {
	try {
		const response = await fetch('/processed_sp500_esg_data.csv');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const csvText = await response.text();
		// In your loadCompanyData function
		const parsedCompanies = parseCSV(csvText);
		console.log('First few companies:', parsedCompanies.slice(0, 3)); // Show first 3 companies
		companies.set(parsedCompanies);
	} catch (error) {
		console.error('Error loading company data:', error);
		companies.set([]);
	}
}
