// src/lib/data/index.ts
import { appState } from '$lib/state.svelte';
import { parseCSV } from './csvParser';
import { parseAllPriceData } from './priceLoader';

export async function loadAllData(): Promise<void> {
	const [esgRes, priceRes] = await Promise.all([
		fetch('/processed_sp500_esg_data.csv'),
		fetch('/processed_sp500_price_data.csv')
	]);

	if (!esgRes.ok) throw new Error(`Failed to fetch ESG data: ${esgRes.status}`);
	if (!priceRes.ok) throw new Error(`Failed to fetch price data: ${priceRes.status}`);

	const [esgText, priceText] = await Promise.all([esgRes.text(), priceRes.text()]);

	appState.companies = parseCSV(esgText);
	appState.priceData = parseAllPriceData(priceText);
}
