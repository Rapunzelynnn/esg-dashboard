<!-- $lib/components/CompanyProfile -->
<script lang="ts">
    // Previous imports and helper functions remain the same
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

    function formatScore(score: number): string {
        if (!score || isNaN(score)) return '0.0';
        return score.toFixed(1);
    }
</script>

<!-- Previous script section remains the same -->

{#if $selectedCompany}
    <div class="bg-white p-4 rounded-xl shadow-sm"> <!-- Reduced padding from p-6 to p-4 -->
        <div class="grid grid-cols-12 gap-6"> <!-- Reduced gap from gap-8 to gap-6 -->
            <!-- Left Column -->
            <div class="col-span-4">
                <!-- Company Header - reduced margins -->
                <div class="mb-3"> <!-- Reduced from mb-4 -->
                    <h2 class="text-2xl font-bold text-gray-900 mb-0.5"> <!-- Reduced from mb-1 -->
                        {$selectedCompany?.fullName || 'No Name'}
                    </h2>
                    <div class="text-gray-600">
                        {$selectedCompany?.industryCode || 'No Code'} - {$selectedCompany?.industryName || 'No Industry'}
                    </div>
                    <div class="text-lg text-blue-600 font-semibold mt-0.5"> <!-- Reduced from mt-1 -->
                        {$selectedCompany?.symbol || 'No Symbol'}
                    </div>
                </div>

                <!-- Market Metrics -->
                <div class="grid grid-cols-2 gap-3 mb-3"> <!-- Reduced gaps and margins -->
                    <div class="bg-gray-50 p-3 rounded-lg"> <!-- Reduced padding from p-4 -->
                        <div class="text-sm text-gray-600">Market Cap</div>
                        <div class="text-lg font-bold text-gray-900">
                            {formatMarketCap($selectedCompany.marketCap)}
                        </div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <div class="text-sm text-gray-600">Beta</div>
                        <div class="text-lg font-bold text-gray-900">
                            {formatBeta($selectedCompany.beta)}
                        </div>
                    </div>
                </div>

                <!-- Stock Price Chart - adjusted to fill space -->
                <div class="h-[200px]"> <!-- Fixed height to match content -->
                    <StockPriceChart symbol={$selectedCompany.symbol} />
                </div>
            </div>

            <!-- Right Column: ESG Performance -->
            <div class="col-span-8">
                <!-- ESG Header with Legend -->
                <div class="flex items-start justify-between mb-3"> <!-- Reduced from mb-4 -->
                    <h2 class="text-2xl font-bold">ESG Performance</h2>
                    <!-- Rating Scale Legend -->
                    <div class="bg-gray-50 rounded-lg p-2" style="width: 65%;"> <!-- Reduced padding -->
                        <div class="text-sm text-gray-600">
                            <div class="flex items-center gap-2 mb-1"> <!-- Reduced margin -->
                                <svg width="12" height="8" viewBox="0 0 12 8" class="text-gray-600">
                                    <path d="M6 0L12 8H0L6 0Z" fill="currentColor"/>
                                </svg>
                                <span class="text-xs">Sector Average indicates the mean score across your industry</span>
                            </div>
                            <div class="grid grid-cols-5 gap-1">
                                {#each scoreRanges as range}
                                    <div class="text-center">
                                        <div class={`h-1.5 rounded-full ${range.color} mb-0.5`}></div> <!-- Reduced height -->
                                        <div class="text-xs">{range.label}</div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ESG Content Container -->
                <div class="flex gap-6 items-center"> <!-- Reduced gap from gap-8 -->
                    <!-- Total Score Circle -->
                    <div class="w-48"> <!-- Reduced from w-52 -->
                        <div class="relative w-48 h-48"> <!-- Reduced size -->
                            <svg 
                                viewBox="0 0 120 120" 
                                class="w-full h-full transform -rotate-90"
                            >
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    stroke="#E5E7EB"
                                    stroke-width="6"
                                    fill="none"
                                    class="opacity-25"
                                />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    stroke="#22C55E"
                                    stroke-width="6"
                                    fill="none"
                                    stroke-linecap="round"
                                    style="stroke-dasharray: {$selectedCompany.esgScores.total * 3.39}, 339"
                                />
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <div class="text-5xl font-bold"> <!-- Reduced from text-6xl -->
                                    {formatScore($selectedCompany.esgScores.total)}
                                </div>
                                <div class="text-gray-500 mt-1 text-base">Total Score</div> <!-- Reduced size -->
                            </div>
                        </div>
                    </div>

                    <!-- ESG Scores Detail -->
                    <div class="flex-1">
                        <ESGScores esgScores={$selectedCompany.esgScores} />
                    </div>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="text-center text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-200"> <!-- Reduced padding -->
        <div class="text-lg mb-2">No company selected</div>
        <div class="text-sm">Use the search bar above to find a company</div>
    </div>
{/if}