<script lang="ts">
	import { onMount } from 'svelte';
	import { esgData, priceData } from '$lib/stores';
	import { loadESGData, loadPriceData } from '$lib/utils/dataLoader';

	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			const [esgResult, priceResult] = await Promise.all([
				loadESGData('/processed_sp500_esg_data.csv'),
				loadPriceData('/sp500_price_data.csv')
			]);

			esgData.set(esgResult);
			priceData.set(priceResult);
			loading = false;
		} catch (e) {
			error = e.message;
			loading = false;
		}
	});
</script>

<main class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">ESG and Stock Performance Dashboard</h1>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<p>Loading data...</p>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
			<p>Error loading data: {error}</p>
		</div>
	{:else}
		<div class="grid gap-6">
			<div class="bg-white p-4 rounded-lg shadow">
				<h2 class="text-lg font-semibold mb-4">ESG Data Sample</h2>
				{#if $esgData.length > 0}
					<div class="overflow-x-auto">
						<table class="min-w-full">
							<thead>
								<tr class="bg-gray-50">
									<th class="px-4 py-2 text-left">Symbol</th>
									<th class="px-4 py-2 text-left">Company</th>
									<th class="px-4 py-2 text-left">Sector</th>
									<th class="px-4 py-2 text-right">ESG Score</th>
									<th class="px-4 py-2 text-right">Environmental</th>
									<th class="px-4 py-2 text-right">Social</th>
									<th class="px-4 py-2 text-right">Governance</th>
									<th class="px-4 py-2 text-right">Percentile</th>
								</tr>
							</thead>
							<tbody>
								{#each $esgData.slice(0, 5) as company}
									<tr class="hover:bg-gray-50">
										<td class="border px-4 py-2">{company.symbol}</td>
										<td class="border px-4 py-2">{company.fullName}</td>
										<td class="border px-4 py-2">{company.gicsSector}</td>
										<td class="border px-4 py-2 text-right">{company.total_esg_score.toFixed(1)}</td
										>
										<td class="border px-4 py-2 text-right"
											>{company.environmental_score.toFixed(1)}</td
										>
										<td class="border px-4 py-2 text-right">{company.social_score.toFixed(1)}</td>
										<td class="border px-4 py-2 text-right"
											>{company.governance_score.toFixed(1)}</td
										>
										<td class="border px-4 py-2 text-right">{company.percentile.toFixed(2)}%</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main>
