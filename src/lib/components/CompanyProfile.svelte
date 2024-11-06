<!-- $lib/components/CompanyProfile.svelte -->
<script lang="ts">
    import { selectedCompany } from '$lib/stores';
    import StockPriceChart from './StockPriceChart.svelte';
    import ESGScores from './ESGScores.svelte';

    const scoreRanges = [
        { label: 'Poor', color: 'bg-red-400' },
        { label: 'Fair', color: 'bg-yellow-400' },
        { label: 'Good', color: 'bg-emerald-400' },
        { label: 'Very Good', color: 'bg-sky-400' },
        { label: 'Excellent', color: 'bg-blue-600' }
    ];

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
</script>

{#if $selectedCompany}
    <div class="bg-white p-3 rounded-xl shadow-sm border-b">
        <div class="grid grid-cols-12 gap-4">
            <!-- Left Column -->
            <div class="col-span-3 flex flex-col h-full"> <!-- Added h-full -->
                <!-- Company Header -->
                <div class="mb-2">
                    <h2 class="text-xl font-bold text-gray-900 leading-tight">
                        {$selectedCompany?.fullName || 'No Name'}
                    </h2>
                    <div class="text-sm text-gray-600 leading-tight">
                        {$selectedCompany?.industryCode || 'No Code'} - {$selectedCompany?.industryName || 'No Industry'}
                    </div>
                    <div class="text-sm text-blue-600 font-semibold leading-tight">
                        {$selectedCompany?.symbol || 'No Symbol'}
                    </div>
                </div>

                <!-- Market Metrics -->
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <div class="text-xs text-gray-600">Market Cap</div>
                        <div class="text-base font-bold text-gray-900">
                            {formatMarketCap($selectedCompany.marketCap)}
                        </div>
                    </div>
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <div class="text-xs text-gray-600">Beta</div>
                        <div class="text-base font-bold text-gray-900">
                            {formatBeta($selectedCompany.beta)}
                        </div>
                    </div>
                </div>

                <!-- Stock Price Chart - Using flex-1 to fill remaining space -->
                <div class="flex-1 min-h-0 overflow-hidden">
                    <div class="h-full w-full"> <!-- Changed to h-full -->
                        <StockPriceChart symbol={$selectedCompany.symbol} />
                    </div>
                </div>
            </div>

            <!-- Right Column: ESG Performance -->
            <div class="col-span-9">
                <!-- ESG Header with Legend -->
                <div class="mb-4">
                    <div class="flex items-start justify-between mb-2">
                        <h2 class="text-xl font-bold leading-tight">ESG Performance</h2>
                    </div>
                </div>

                <!-- ESG Content Container -->
                <div class="flex gap-6 items-center">
                    <!-- Total Score Circle -->
                    <div class="flex-none">
                        <ESGScores esgScores={$selectedCompany.esgScores} showBreakdown={false} />
                    </div>
                    <!-- Breakdown Section -->
                    <div class="flex-1">
                        <!-- Rating Scale Legend - Now in breakdown section -->
                        <div class="bg-gray-50 rounded-lg p-1 mb-4">
                            <div class="text-sm text-gray-600">
                                <div class="flex items-center gap-1 mb-0.5">
                                    <svg width="10" height="6" viewBox="0 0 12 8" class="text-gray-600">
                                        <path d="M6 0L12 8H0L6 0Z" fill="currentColor"/>
                                    </svg>
                                    <span class="text-xs leading-none">Sector Average indicates the mean score across your industry</span>
                                </div>
                                <div class="grid grid-cols-5 gap-1">
                                    {#each scoreRanges as range}
                                        <div class="text-center">
                                            <div class={`h-1 rounded-full ${range.color} mb-0.5`}></div>
                                            <div class="text-xs leading-none">{range.label}</div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                        <!-- Breakdown Bars -->
                        <ESGScores esgScores={$selectedCompany.esgScores} showTotal={false} />
                    </div>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="text-center text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <div class="text-lg mb-2">No company selected</div>
        <div class="text-sm">Use the search bar above to find a company</div>
    </div>
{/if}

<!-- Update CompanyProfile.svelte -->
<style>
  /* Add these styles to your CompanyProfile component */
  :global(.company-profile-container) {
    min-height: 400px;
  }

  :global(.stock-chart-container) {
    min-height: 200px;
  }

  :global(.esg-scores-container) {
    min-height: 180px;
  }
</style>