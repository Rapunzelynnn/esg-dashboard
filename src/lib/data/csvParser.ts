import type { Company } from '$lib/types';

function safeParseFloat(value: string | null | undefined): number {
	if (value == null) return 0;
	const parsed = parseFloat(value);
	return isNaN(parsed) ? 0 : parsed;
}

function safeString(value: string | null | undefined): string {
	return value ?? '';
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
				symbol: safeString(getValue('symbol')),
				fullName: cleanCompanyName(safeString(getValue('fullname'))),
				industryCode: safeString(getValue('industry_code')),
				industryName: safeString(getValue('industry_name')),
				location: safeString(getValue('location')),
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
