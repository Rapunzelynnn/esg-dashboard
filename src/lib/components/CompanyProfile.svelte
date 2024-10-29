<script lang="ts">
    import type { ESGData } from '$lib/types';
    import { selectedCompany } from '$lib/stores';
    import StockPriceChart from './StockPriceChart.svelte';
    import ESGScores from './ESGScores.svelte';
    import { Diamond } from 'lucide-svelte';

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
    <div class="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
        <!-- Company Info Section -->
		<div class="flex items-start justify-between mb-6">
			<div>
				<h2 class="text-3xl font-bold mb-2 text-gray-900">
					{$selectedCompany?.fullName || 'No Name'} <!-- Added fallback -->
				</h2>
				<div class="text-gray-600">
					<div class="text-lg">
						{$selectedCompany?.industryCode || 'No Code'} - {$selectedCompany?.industryName || 'No Industry'} <!-- Added fallbacks -->
					</div>
					<!-- Add debug info temporarily -->
					<div class="text-sm text-red-500">
						Debug: {JSON.stringify($selectedCompany, null, 2)}
					</div>
				</div>
			</div>
			<div class="text-xl font-semibold text-blue-600">
				{$selectedCompany?.symbol || 'No Symbol'}
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
                        {formatScore($selectedCompany.esgScores.total)}
                    </span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-green-500 rounded-full transition-all duration-300"
                        style="width: {$selectedCompany.esgScores.total}%"
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
                                {formatScore($selectedCompany.esgScores.environmental.score)}
                            </span>
                            <span class="text-sm text-gray-500">
                                Mean: {formatScore($selectedCompany.esgScores.environmental.mean)} 
                                Max: {formatScore($selectedCompany.esgScores.environmental.max)}
                            </span>
                        </div>
                    </div>
					<div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
						<div 
							class="absolute h-full bg-blue-500 transition-all duration-300"
							style="width: {($selectedCompany.esgScores.environmental.score / $selectedCompany.esgScores.environmental.max) * 100}%"
						/>
						<!-- Mean Marker -->
						<svg 
							class="absolute top-1/2 -translate-y-1/2" 
							width="8" 
							height="8" 
							style="left: {getMeanPosition($selectedCompany.esgScores.environmental.mean, $selectedCompany.esgScores.environmental.max)}"
						>
							<path 
								d="M4 0L8 4L4 8L0 4Z" 
								fill="currentColor" 
								class="text-gray-600"
							/>
						</svg>
					</div>
					<div class="flex justify-between mt-1 text-xs text-gray-500">
						<span>0</span>
						<span>{formatScore($selectedCompany.esgScores.environmental.max)}</span>
					</div>
				</div>

                <!-- Social Score -->
				<div>
					<div class="flex justify-between items-center mb-2">
						<span class="text-lg text-gray-700">Social</span>
						<div class="flex items-center gap-2">
							<span class="text-xl font-semibold">
								{formatScore($selectedCompany.esgScores.social.score)}
							</span>
							<span class="text-sm text-gray-500">
								Mean: {formatScore($selectedCompany.esgScores.social.mean)} 
								Max: {formatScore($selectedCompany.esgScores.social.max)}
							</span>
						</div>
					</div>
					<div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
						<div 
							class="absolute h-full bg-purple-500 transition-all duration-300"
							style="width: {($selectedCompany.esgScores.social.score / $selectedCompany.esgScores.social.max) * 100}%"
						/>
						<!-- Mean Marker -->
						<svg 
							class="absolute top-1/2 -translate-y-1/2" 
							width="8" 
							height="8" 
							style="left: {getMeanPosition($selectedCompany.esgScores.social.mean, $selectedCompany.esgScores.social.max)}"
						>
							<path 
								d="M4 0L8 4L4 8L0 4Z" 
								fill="currentColor" 
								class="text-gray-600"
							/>
						</svg>
					</div>
					<div class="flex justify-between mt-1 text-xs text-gray-500">
						<span>0</span>
						<span>{formatScore($selectedCompany.esgScores.social.max)}</span>
					</div>
				</div>

                <!-- Governance Score -->
				<div>
					<div class="flex justify-between items-center mb-2">
						<span class="text-lg text-gray-700">Governance</span>
						<div class="flex items-center gap-2">
							<span class="text-xl font-semibold">
								{formatScore($selectedCompany.esgScores.governance.score)}
							</span>
							<span class="text-sm text-gray-500">
								Mean: {formatScore($selectedCompany.esgScores.governance.mean)} 
								Max: {formatScore($selectedCompany.esgScores.governance.max)}
							</span>
						</div>
					</div>
					<div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
						<div 
							class="absolute h-full bg-orange-500 transition-all duration-300"
							style="width: {($selectedCompany.esgScores.governance.score / $selectedCompany.esgScores.governance.max) * 100}%"
						/>
						<!-- Mean Marker -->
						<svg 
							class="absolute top-1/2 -translate-y-1/2" 
							width="8" 
							height="8" 
							style="left: {getMeanPosition($selectedCompany.esgScores.governance.mean, $selectedCompany.esgScores.governance.max)}"
						>
							<path 
								d="M4 0L8 4L4 8L0 4Z" 
								fill="currentColor" 
								class="text-gray-600"
							/>
						</svg>
					</div>
					<div class="flex justify-between mt-1 text-xs text-gray-500">
						<span>0</span>
						<span>{formatScore($selectedCompany.esgScores.governance.max)}</span>
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