<!-- $lib/components/CompanyProfile -->
<script lang="ts">
    import { selectedCompany } from '$lib/stores';
    import StockPriceChart from './StockPriceChart.svelte';
    import ESGScores from './ESGScores.svelte';

    function formatMarketCap(value: number): string {
        if (!value || isNaN(value)) return '$0.00';
        if (value >= 1_000_000_000_000) {
            return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
        } else if (value >= 1_000_000_000) {
            return `$${(value / 1_000_000_000).toFixed(2)} billion`;
        } else if (value >= 1_000_000) {
            return `$${(value / 1_000_000_000).toFixed(2)} million`;
        }
        return `$${value.toFixed(2)}`;
    }

    function formatBeta(value: number): string {
        if (!value || isNaN(value)) return '0.00';
        return value.toFixed(2);
    }

	function formatScore(score: number): string {
		if (!score || isNaN(score)) return '0.0';
		return score.toFixed(1);
	}

	// Calculate relative position for mean marker
    function getMeanPosition(score: number, max: number): string {
        if (!score || !max) return '0%';
        return `${(score / max) * 100}%`;
    }
	// Add type safety checks
    $: companyName = $selectedCompany?.fullName || 'Unknown Company';
    $: industryCode = $selectedCompany?.industryCode || '';
    $: industryName = $selectedCompany?.industryName || '';

    // Debug logging
    $: {
        if ($selectedCompany) {
            console.log('ESG Scores:', $selectedCompany.esgScores);
            console.log('Total Score:', $selectedCompany.esgScores.total);
            console.log('Environmental:', $selectedCompany.esgScores.environmental);
            console.log('Social:', $selectedCompany.esgScores.social);
            console.log('Governance:', $selectedCompany.esgScores.governance);
        }
    }
</script>

{#if $selectedCompany}
    <div class="bg-white p-6 rounded-xl shadow-sm">
        <div class="grid grid-cols-12 gap-8">
            <!-- Company Info and Stock Chart Column -->
            <div class="col-span-4"> <!-- Reduced from 5 to 4 columns -->
                <!-- Company Header -->
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-1">
                        {$selectedCompany?.fullName || 'No Name'}
                    </h2>
                    <div class="text-gray-600">
                        {$selectedCompany?.industryCode || 'No Code'} - {$selectedCompany?.industryName || 'No Industry'}
                    </div>
                    <div class="text-lg text-blue-600 font-semibold mt-1">
                        {$selectedCompany?.symbol || 'No Symbol'}
                    </div>
                </div>

                <!-- Market Metrics -->
                <div class="space-y-3 mb-6"> <!-- Changed to vertical layout -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="text-sm text-gray-600">Market Cap</div>
                        <div class="text-lg font-bold text-gray-900">
                            {formatMarketCap($selectedCompany.marketCap)}
                        </div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="text-sm text-gray-600">Beta</div>
                        <div class="text-lg font-bold text-gray-900">
                            {formatBeta($selectedCompany.beta)}
                        </div>
                    </div>
                </div>

                <!-- Stock Price Chart -->
                <div class="mt-6">
                    <StockPriceChart symbol={$selectedCompany.symbol} />
                </div>
            </div>

            <!-- ESG Scores Column -->
            <div class="col-span-8"> <!-- Increased from 7 to 8 columns -->
                <ESGScores esgScores={$selectedCompany.esgScores} />
            </div>
        </div>
    </div>
{:else}
    <div class="text-center text-gray-600 bg-gray-50 p-8 rounded-xl border border-gray-200">
        <div class="text-lg mb-2">No company selected</div>
        <div class="text-sm">Use the search bar above to find a company</div>
    </div>
{/if}