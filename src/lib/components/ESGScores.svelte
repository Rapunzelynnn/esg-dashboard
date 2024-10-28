<script lang="ts">
    export let selectedCompany: {
        total_esg_score: number;
        environmental_score: number;
        environmental_mean: number;
        environmental_max: number;
        social_score: number;
        social_mean: number;
        social_max: number;
        governance_score: number;
        governance_mean: number;
        governance_max: number;
        percentile: number;
    };
	function formatScore(score: number): string {
        return Number(score).toFixed(1);
    }

    // Helper function to calculate width percentage
    function calculateWidth(score: number, max: number = 100): number {
        return Math.min((score / max) * 100, 100);
    }
</script>

<!-- ESG Scores section -->
<div class="mt-8">
    <h3 class="text-xl font-semibold mb-4">ESG Performance</h3>
    
    <!-- Total ESG Score -->
    <div class="mb-6">
        <div class="flex justify-between items-baseline mb-2">
            <span class="text-lg font-medium">Total ESG Score</span>
            <span class="text-2xl font-bold text-green-600">
                {formatScore(selectedCompany.total_esg_score)}
            </span>
        </div>
        <div class="relative h-3 bg-gray-200 rounded-full">
            <div 
                class="absolute h-full bg-green-500 rounded-full transition-all duration-300"
                style="width: {calculateWidth(selectedCompany.total_esg_score)}%"
            />
        </div>
    </div>

    <!-- Individual Scores -->
    <div class="space-y-4">
        <!-- Environmental Score -->
        <div>
            <div class="flex justify-between items-baseline mb-2">
                <span class="text-gray-600">Environmental</span>
                <div class="flex items-center gap-2">
                    <span class="text-lg font-semibold">
                        {formatScore(selectedCompany.environmental_score)}
                    </span>
                    <span class="text-sm text-gray-500">
                        Sector Avg: {formatScore(selectedCompany.environmental_mean)}
                    </span>
                </div>
            </div>
            <div class="relative h-2 bg-gray-200 rounded-full">
                <div 
                    class="absolute h-full bg-blue-500 rounded-full transition-all duration-300"
                    style="width: {calculateWidth(selectedCompany.environmental_score, selectedCompany.environmental_max)}%"
                />
                <div 
                    class="absolute h-full w-1 bg-gray-500 transform -translate-x-1/2 transition-all duration-300"
                    style="left: {calculateWidth(selectedCompany.environmental_mean, selectedCompany.environmental_max)}%"
                />
            </div>
        </div>

        <!-- Social Score -->
        <div>
            <div class="flex justify-between items-baseline mb-2">
                <span class="text-gray-600">Social</span>
                <div class="flex items-center gap-2">
                    <span class="text-lg font-semibold">
                        {formatScore(selectedCompany.social_score)}
                    </span>
                    <span class="text-sm text-gray-500">
                        Sector Avg: {formatScore(selectedCompany.social_mean)}
                    </span>
                </div>
            </div>
            <div class="relative h-2 bg-gray-200 rounded-full">
                <div 
                    class="absolute h-full bg-purple-500 rounded-full transition-all duration-300"
                    style="width: {calculateWidth(selectedCompany.social_score, selectedCompany.social_max)}%"
                />
                <div 
                    class="absolute h-full w-1 bg-gray-500 transform -translate-x-1/2 transition-all duration-300"
                    style="left: {calculateWidth(selectedCompany.social_mean, selectedCompany.social_max)}%"
                />
            </div>
        </div>

        <!-- Governance Score -->
        <div>
            <div class="flex justify-between items-baseline mb-2">
                <span class="text-gray-600">Governance</span>
                <div class="flex items-center gap-2">
                    <span class="text-lg font-semibold">
                        {formatScore(selectedCompany.governance_score)}
                    </span>
                    <span class="text-sm text-gray-500">
                        Sector Avg: {formatScore(selectedCompany.governance_mean)}
                    </span>
                </div>
            </div>
            <div class="relative h-2 bg-gray-200 rounded-full">
                <div 
                    class="absolute h-full bg-orange-500 rounded-full transition-all duration-300"
                    style="width: {calculateWidth(selectedCompany.governance_score, selectedCompany.governance_max)}%"
                />
                <div 
                    class="absolute h-full w-1 bg-gray-500 transform -translate-x-1/2 transition-all duration-300"
                    style="left: {calculateWidth(selectedCompany.governance_mean, selectedCompany.governance_max)}%"
                />
            </div>
        </div>
    </div>

    <!-- Percentile Ranking -->
    <div class="mt-6">
        <div class="flex items-center justify-between mb-2">
            <span class="text-gray-600">ESG Percentile Ranking</span>
            <span class="text-lg font-semibold">{selectedCompany.percentile}%</span>
        </div>
        <div class="relative h-2 bg-gray-200 rounded-full">
            <div 
                class="absolute h-full bg-green-500 rounded-full transition-all duration-300"
                style="width: {selectedCompany.percentile}%"
            />
        </div>
    </div>
</div>