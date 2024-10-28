<script lang="ts">
	import { selectedCompany } from '$lib/stores';
	import StockPriceChart from './StockPriceChart.svelte';

	function formatMarketCap(value: number): string {
		if (!value || isNaN(value)) return '$0.00';
		if (value >= 1_000_000_000_000) {
			return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
		} else if (value >= 1_000_000_000) {
			return `$${(value / 1_000_000_000).toFixed(2)} billion`;
		} else if (value >= 1_000_000) {
			return `$${(value / 1_000_000).toFixed(2)} million`;
		}
		return `$${value.toFixed(2)}`;
	}

	function formatBeta(value: number): string {
		if (!value || isNaN(value)) return '0.00';
		return value.toFixed(2);
	}
</script>

{#if $selectedCompany}
	<div class="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
		<!-- Existing company info section -->
		<div class="flex items-start justify-between mb-6">
			<div>
				<h2 class="text-3xl font-bold mb-2 text-gray-900">{$selectedCompany.fullName}</h2>
				<div class="text-gray-600">
					<div class="text-lg">
						{$selectedCompany.industryCode} - {$selectedCompany.industryName}
					</div>
				</div>
			</div>
			<div class="text-xl font-semibold text-blue-600">
				{$selectedCompany.symbol}
			</div>
		</div>

		<!-- Market Cap and Beta section -->
		<div class="grid grid-cols-2 gap-6 mb-8">
			<div class="bg-gray-50 p-6 rounded-lg border border-gray-100">
				<div class="text-gray-600 text-sm mb-1">Market Cap</div>
				<div class="text-2xl font-bold text-gray-900">
					{formatMarketCap($selectedCompany.marketCap)}
				</div>
			</div>
			<div class="bg-gray-50 p-6 rounded-lg border border-gray-100">
				<div class="text-gray-600 text-sm mb-1">Beta</div>
				<div class="text-2xl font-bold text-gray-900">
					{formatBeta($selectedCompany.beta)}
				</div>
			</div>
		</div>

		<!-- Stock Price Chart section -->
		<div class="mt-8">
			<StockPriceChart symbol={$selectedCompany.symbol} />
		</div>
	</div>
{:else}
	<div
		class="text-center text-gray-600 bg-gray-50 p-8 rounded-xl max-w-2xl mx-auto border border-gray-200"
	>
		<div class="text-lg mb-2">No company selected</div>
		<div class="text-sm">Use the search bar above to find a company</div>
	</div>
{/if}
