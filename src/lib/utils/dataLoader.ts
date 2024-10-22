import Papa from 'papaparse';
import type { ESGData, PriceData } from '../types';

interface RawESGData {
	Symbol: string;
	'Full Name': string;
	'GICS Sector': string;
	'GICS Sub-Industry': string;
	industry_code: string;
	industry_name: string;
	data_availability: string;
	location: string;
	total_esg_score: string;
	environmental_score: string;
	environmental_mean: string;
	environmental_max: string;
	social_score: string;
	social_mean: string;
	social_max: string;
	governance_score: string;
	governance_mean: string;
	governance_max: string;
	percentile: string;
	ratingYear: string;
	ratingMonth: string;
	marketCap: string;
	beta: string;
	overallRisk: string;
	processed: string;
}

export async function loadESGData(url: string): Promise<ESGData[]> {
	const response = await fetch(url);
	const csv = await response.text();

	const { data } = Papa.parse<RawESGData>(csv, {
		header: true,
		skipEmptyLines: true,
		transform: (value: string) => {
			if (value === '') return null;
			return value;
		}
	});

	return data.map((row: RawESGData) => ({
		symbol: row.Symbol,
		fullName: row['Full Name'],
		gicsSector: row['GICS Sector'],
		gicsSubIndustry: row['GICS Sub-Industry'],
		industry_code: row.industry_code,
		industry_name: row.industry_name,
		data_availability: row.data_availability,
		location: row.location,
		total_esg_score: Number(row.total_esg_score),
		environmental_score: Number(row.environmental_score),
		environmental_mean: Number(row.environmental_mean),
		environmental_max: Number(row.environmental_max),
		social_score: Number(row.social_score),
		social_mean: Number(row.social_mean),
		social_max: Number(row.social_max),
		governance_score: Number(row.governance_score),
		governance_mean: Number(row.governance_mean),
		governance_max: Number(row.governance_max),
		percentile: Number(row.percentile),
		ratingYear: Number(row.ratingYear),
		ratingMonth: Number(row.ratingMonth),
		marketCap: Number(row.marketCap),
		beta: Number(row.beta),
		overallRisk: Number(row.overallRisk),
		processed: row.processed.toLowerCase() === 'true'
	}));
}

// If you're using price data, keep this. If not, you can remove it.
interface RawPriceData {
	Date: string;
	[key: string]: string; // This allows for dynamic stock symbol columns
}

export async function loadPriceData(url: string): Promise<PriceData[]> {
	const response = await fetch(url);
	const csv = await response.text();

	const { data } = Papa.parse<RawPriceData>(csv, {
		header: true,
		skipEmptyLines: true,
		transform: (value: string) => {
			if (value === '') return null;
			return value;
		}
	});

	return data.map((row: RawPriceData) => {
		// Create the base object with the date
		const baseObject: Partial<PriceData> = {
			date: new Date(row.Date)
		};

		// Add all other columns as number values
		Object.entries(row).forEach(([key, value]) => {
			if (key !== 'Date') {
				baseObject[key] = Number(value);
			}
		});

		return baseObject as PriceData;
	});
}
