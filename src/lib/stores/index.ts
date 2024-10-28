import { writable } from 'svelte/store';
import type { Company, ESGData, PriceData, FilterState } from '$lib/types';

// Stores
export const companies = writable<Company[]>([]);
export const selectedCompany = writable<Company | null>(null);
export const esgDataStore = writable<ESGData[]>([]);

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
// Price data store with type
export const priceDataStore = writable(new Map<string, PriceData[]>());
interface RawPriceData {
    symbol: string;
    date: string;
    price: number;
}

// Helper function to safely parse number
function safeParseFloat(value: string): number {
	const parsed = parseFloat(value);
	return isNaN(parsed) ? 0 : parsed;
}
// Helper function to clean company names
function cleanCompanyName(name: string): string {
	if (!name) return '';
	return name
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/\s*,\s*/g, ', ')
		.replace(/\s*\.\s*/g, '.')
		.replace(/Inc$/, 'Inc.')
		.replace(/Corp$/, 'Corp.')
		.replace(/\s+Inc\.$/, ' Inc.')
		.replace(/\s+Corp\.$/, ' Corp.');
}

// CSV parsing function
export function parseCSV(csvText: string): Company[] {
	try {
		// Split by lines and remove empty lines
		const lines = csvText.split('\n').filter((line) => line.trim());

		// Get and validate headers
		const headerRow = lines[0].split(',').map((h) => h.trim());
		const requiredHeaders = [
			'symbol',
			'fullName',
			'industryCode',
			'industryName',
			'location',
			'esgScore',
			'environmentalScore',
			'socialScore',
			'governanceScore',
			'marketCap',
			'beta'
		];

		// Validate that all required headers are present
		const headerIndexMap = new Map<string, number>();
		requiredHeaders.forEach((reqHeader) => {
			const index = headerRow.findIndex(
				(h) => h.toLowerCase().replace(/[^a-z0-9]/g, '') === reqHeader.toLowerCase()
			);
			if (index !== -1) {
				headerIndexMap.set(reqHeader, index);
			}
		});

		// Process data lines
		return lines
			.slice(1)
			.map((line, index) => {
				try {
					// Handle quoted values properly
					const values: string[] = [];
					let currentValue = '';
					let insideQuotes = false;

					for (let i = 0; i < line.length; i++) {
						const char = line[i];

						if (char === '"') {
							insideQuotes = !insideQuotes;
						} else if (char === ',' && !insideQuotes) {
							values.push(currentValue.trim().replace(/^"|"$/g, ''));
							currentValue = '';
						} else {
							currentValue += char;
						}
					}
					values.push(currentValue.trim().replace(/^"|"$/g, '')); // Push the last value

					// Get values using header map
					const getValue = (header: string): string => {
						const index = headerIndexMap.get(header);
						return index !== undefined && index < values.length ? values[index] : '';
					};

					// Create company object
					const company: Company = {
						symbol: getValue('symbol'),
						fullName: cleanCompanyName(getValue('fullName') || `${getValue('symbol')} Inc.`),
						industryCode: getValue('industryCode'),
						industryName: getValue('industryName'),
						location: getValue('location'),
						marketCap: safeParseFloat(getValue('marketCap')),
						beta: safeParseFloat(getValue('beta')),
						esgScores: {
							total: safeParseFloat(getValue('esgScore')),
							environmental: {
								score: safeParseFloat(getValue('environmentalScore')),
								mean: safeParseFloat(getValue('environmentalMean')),
								max: safeParseFloat(getValue('environmentalMax'))
							},
							social: {
								score: safeParseFloat(getValue('socialScore')),
								mean: safeParseFloat(getValue('socialMean')),
								max: safeParseFloat(getValue('socialMax'))
							},
							governance: {
								score: safeParseFloat(getValue('governanceScore')),
								mean: safeParseFloat(getValue('governanceMean')),
								max: safeParseFloat(getValue('governanceMax'))
							},
							percentile: safeParseFloat(getValue('percentile')),
							ratingYear: safeParseFloat(getValue('ratingYear')),
							ratingMonth: safeParseFloat(getValue('ratingMonth'))
						}
					};

					return company;
				} catch (error) {
					console.warn(`Error parsing line ${index + 2}:`, error);
					return null;
				}
			})
			.filter((company): company is Company => company !== null); // Remove null entries
	} catch (error) {
		console.error('Error parsing CSV:', error);
		return [];
	}
}

// Data loading function
export async function loadCompanyData() {
	try {
		const response = await fetch('/processed_sp500_esg_data.csv');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const csvText = await response.text();
		if (!csvText.trim()) {
			throw new Error('CSV file is empty');
		}

		const parsedCompanies = parseCSV(csvText);
		if (parsedCompanies.length === 0) {
			throw new Error('No valid companies parsed from CSV');
		}

		console.log('First few companies:', parsedCompanies.slice(0, 3));
		companies.set(parsedCompanies);
	} catch (error) {
		console.error('Error loading company data:', error);
		companies.set([]);
	}
}

// Add this function to load price data
export async function loadPriceData(symbol: string) {
    try {
        console.log('Loading data for symbol:', symbol);
        const response = await fetch('/processed_sp500_price_data.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        const rows = text.trim().split('\n');
        
        // Get headers to find column index for the symbol
        const headers = rows[0].split(',');
        const symbolIndex = headers.findIndex(header => header.trim() === symbol);
        
        if (symbolIndex === -1) {
            console.log(`Symbol ${symbol} not found in CSV headers:`, headers);
            throw new Error(`No data found for symbol ${symbol}`);
        }

        // Parse the data for this symbol
        const data: PriceData[] = rows
            .slice(1) // Skip header row
            .map(row => {
                const columns = row.split(',');
                return {
                    date: columns[0].trim(), // Date is first column
                    price: parseFloat(columns[symbolIndex].trim())
                };
            })
            .filter(item => !isNaN(item.price));

        priceDataStore.update(store => {
            const newStore = new Map(store);
            newStore.set(symbol, data);
            return newStore;
        });

        return data;
    } catch (error) {
        console.error('Error loading price data:', error);
        priceDataStore.update(store => {
            const newStore = new Map(store);
            newStore.set(symbol, []);
            return newStore;
        });
        throw error; // Re-throw to handle in component
    }
}