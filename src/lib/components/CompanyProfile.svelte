<script lang="ts">
    import type { Company } from '$lib/types';
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
        return score?.toFixed(1) || '0.0';
    }

    function calculateTotalScore(scores: any): number {
        if (!scores) return 0;
        const { environmental, social, governance } = scores;
        return ((environmental?.score || 0) + (social?.score || 0) + (governance?.score || 0)) / 3;
    }

    // Debug logging with proper reactive statements
    $: {
        if ($selectedCompany) {
            console.log('Selected Company:', $selectedCompany);
            console.log('ESG Scores:', $selectedCompany.esgScores);
            console.log('Environmental Score:', $selectedCompany.esgScores?.environmental?.score);
            console.log('Social Score:', $selectedCompany.esgScores?.social?.score);
            console.log('Governance Score:', $selectedCompany.esgScores?.governance?.score);
            console.log('Calculated Total Score:', calculateTotalScore($selectedCompany.esgScores));
        }
    }

    // Reactive total score calculation
    $: totalScore = $selectedCompany ? calculateTotalScore($selectedCompany.esgScores) : 0;
</script>

{#if $selectedCompany}
    <div class="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
        <!-- Company Info Section -->
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

        <!-- Market Cap and Beta Section -->
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

        <!-- Stock Price Chart Section -->
        <div class="mt-8">
            <StockPriceChart symbol={$selectedCompany.symbol} />
        </div>

        <!-- ESG Scores Section -->
        <div class="mt-8 p-6 bg-white rounded-lg">
            <h2 class="text-3xl font-bold mb-6">ESG Performance</h2>
            
            <!-- Total ESG Score -->
            <div class="mb-8">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xl">Total ESG Score</span>
                    <span class="text-2xl font-bold text-green-600">
                        {formatScore(totalScore)}
                    </span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-green-500 rounded-full transition-all duration-300"
                        style="width: {totalScore}%"
                    />
                </div>
            </div>

            <!-- Individual Scores -->
            <div class="space-y-6">
                <!-- Environmental Score -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-lg text-gray-700">Environmental</span>
                        <div class="flex items-center gap-2">
                            <span class="text-xl font-semibold">
                                {formatScore($selectedCompany.esgScores?.environmental?.score)}
                            </span>
                            <span class="text-sm text-gray-500">
                                Sector Avg: {formatScore($selectedCompany.esgScores?.environmental?.mean)}
                            </span>
                        </div>
                    </div>
                    <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            class="absolute h-full bg-blue-500 transition-all duration-300"
                            style="width: {$selectedCompany.esgScores?.environmental?.score || 0}%"
                        />
                    </div>
                </div>

                <!-- Social Score -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-lg text-gray-700">Social</span>
                        <div class="flex items-center gap-2">
                            <span class="text-xl font-semibold">
                                {formatScore($selectedCompany.esgScores?.social?.score)}
                            </span>
                            <span class="text-sm text-gray-500">
                                Sector Avg: {formatScore($selectedCompany.esgScores?.social?.mean)}
                            </span>
                        </div>
                    </div>
                    <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            class="absolute h-full bg-purple-500 transition-all duration-300"
                            style="width: {$selectedCompany.esgScores?.social?.score || 0}%"
                        />
                    </div>
                </div>

                <!-- Governance Score -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-lg text-gray-700">Governance</span>
                        <div class="flex items-center gap-2">
                            <span class="text-xl font-semibold">
                                {formatScore($selectedCompany.esgScores?.governance?.score)}
                            </span>
                            <span class="text-sm text-gray-500">
                                Sector Avg: {formatScore($selectedCompany.esgScores?.governance?.mean)}
                            </span>
                        </div>
                    </div>
                    <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            class="absolute h-full bg-orange-500 transition-all duration-300"
                            style="width: {$selectedCompany.esgScores?.governance?.score || 0}%"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="text-center text-gray-600 bg-gray-50 p-8 rounded-xl max-w-2xl mx-auto border border-gray-200">
        <div class="text-lg mb-2">No company selected</div>
        <div class="text-sm">Use the search bar above to find a company</div>
    </div>
{/if}