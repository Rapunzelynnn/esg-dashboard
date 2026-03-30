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
