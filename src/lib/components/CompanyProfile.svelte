<!-- $lib/components/CompanyProfile.svelte -->
<script lang="ts">
    import { appState } from '$lib/state.svelte';
    import StockPriceChart from './StockPriceChart.svelte';
    import ESGScores from './ESGScores.svelte';

    interface Props { loading?: boolean; }
    let { loading = false }: Props = $props();

    const scoreRanges = [
        { label: 'Poor', color: 'bg-red-500' },
        { label: 'Fair', color: 'bg-amber-500' },
        { label: 'Good', color: 'bg-teal-500' },
        { label: 'Very Good', color: 'bg-cyan-500' },
        { label: 'Excellent', color: 'bg-blue-500' }
    ];

    function formatMarketCap(value: number): string {
        if (!value || isNaN(value)) return '$0.00';
        if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
        if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)} billion`;
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)} million`;
        return `$${value.toFixed(2)}`;
    }

    function formatBeta(value: number): string {
        if (!value || isNaN(value)) return '0.00';
        return value.toFixed(2);
    }
</script>

{#if loading}
    <div class="flex items-center justify-center bg-gray-50 p-6 rounded-xl border border-gray-200 h-24">
        <svg class="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="ml-2 text-sm text-gray-500">Loading data…</span>
    </div>
{:else if appState.selectedCompany}
    <div class="bg-white p-3 rounded-xl shadow-sm border-b">
        <div class="grid grid-cols-12 gap-4">
            <!-- Left Column: Company info + StockPriceChart -->
            <div class="col-span-3 flex flex-col h-full">
                <div class="mb-2">
                    <h2 class="text-xl font-bold text-gray-900 leading-tight">
                        {appState.selectedCompany?.fullName || 'No Name'}
                    </h2>
                    <div class="text-sm text-gray-600 leading-tight">
                        {appState.selectedCompany?.industryCode || 'No Code'} - {appState.selectedCompany?.industryName || 'No Industry'}
                    </div>
                    <div class="text-sm text-blue-600 font-semibold leading-tight">
                        {appState.selectedCompany?.symbol || 'No Symbol'}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <div class="text-xs text-gray-600">Market Cap</div>
                        <div class="text-base font-bold text-gray-900">
                            {formatMarketCap(appState.selectedCompany.marketCap)}
                        </div>
                    </div>
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <div class="text-xs text-gray-600">Beta</div>
                        <div class="text-base font-bold text-gray-900">
                            {formatBeta(appState.selectedCompany.beta)}
                        </div>
                    </div>
                </div>
                <div class="flex-1 min-h-0 overflow-hidden">
                    <div class="h-full w-full">
                        <StockPriceChart symbol={appState.selectedCompany.symbol} />
                    </div>
                </div>
            </div>

            <!-- Right Column: ESG Performance with circle + breakdown -->
            <div class="col-span-9">
                <div class="mb-4">
                    <h2 class="text-xl font-bold leading-tight">ESG Performance</h2>
                </div>
                <div class="flex gap-6 items-center">
                    <!-- Total Score Circle -->
                    <div class="flex-none">
                        <ESGScores esgScores={appState.selectedCompany.esgScores} showBreakdown={false} />
                    </div>
                    <!-- Legend + Breakdown Bars -->
                    <div class="flex-1">
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
                        <ESGScores esgScores={appState.selectedCompany.esgScores} showTotal={false} />
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