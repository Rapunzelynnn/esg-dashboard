import { writable } from 'svelte/store';
import type { Company, PriceData, FilterState } from '$lib/types';

// Stores
export const companies = writable<Company[]>([]);
export const selectedCompany = writable<Company | null>(null);

// Add this debug logging
$: console.log('Selected Company Data:', selectedCompany);


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

// Helper function to safely parse float values
function safeParseFloat(value: string): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}
// Helper function to clean company names
function cleanCompanyName(name: string): string {
    if (!name) return '';
    return name
        .trim()
        .replace(/\*\*/g, '') // Remove ** markers
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
        // Split by lines and remove empty lines and remove "**" markers
        const lines = csvText.split('\n')
            .filter((line) => line.trim())
            .map(line => line.replace(/\*\*/g, ''));
        
        // Get and validate headers
        const headerRow = lines[0].split(',').map((h) => h.trim());
        
        console.log('Original headers:', headerRow); // Debug log

        const headerIndexMap = new Map<string, number>();
        headerRow.forEach((header, index) => {
            // Clean up header name
            const cleanHeader = header
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '')
                .trim();
            headerIndexMap.set(cleanHeader, index);
        });

        console.log('Header mapping:', Object.fromEntries(headerIndexMap)); // Debug log

        // Process data lines
        return lines
            .slice(1)
            .map((line, lineIndex) => {
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
                        const index = headerIndexMap.get(header.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                        const value = index !== undefined && index < values.length ? values[index] : '';
                        if (!value && lineIndex === 0) {
                            console.warn(`No value found for header: ${header}`);
                        }
                        return value;
                    };

                    // Create company object
                    const company: Company = {
                        symbol: getValue('symbol'),
						fullName: cleanCompanyName(getValue('Full Name')),		
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

                    // Debug log for first few companies
                    if (lineIndex < 3) {
                        console.log(`Parsed company ${lineIndex + 1}:`, company);
                    }

                    return company;
                } catch (error) {
                    console.warn(`Error parsing line ${lineIndex + 2}:`, error);
                    return null;
                }
            })
            .filter((company): company is Company => company !== null);
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