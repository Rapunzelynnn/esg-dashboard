<script lang="ts">
    export let esgScores: {
        total: number;
        environmental: { score: number; mean: number; max: number };
        social: { score: number; mean: number; max: number };
        governance: { score: number; mean: number; max: number };
    };

    function formatScore(score: number): string {
        if (!score || isNaN(score)) return '0.0';
        return score.toFixed(1);
    }

    function getMeanPosition(score: number, max: number): string {
        if (!score || !max) return '0%';
        return `${(score / max) * 100}%`;
    }
</script>

<div class="p-6 bg-white rounded-lg">
    <h2 class="text-3xl font-bold mb-6">ESG Performance</h2>
    
    <!-- Total ESG Score -->
    <div class="mb-8">
        <div class="flex justify-between items-center mb-2">
            <span class="text-xl">Total ESG Score</span>
            <span class="text-2xl font-bold text-green-600">
                {formatScore(esgScores.total)}
            </span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
                class="h-full bg-green-500 rounded-full transition-all duration-300"
                style="width: {esgScores.total}%"
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
                        {formatScore(esgScores.environmental.score)}
                    </span>
                    <span class="text-sm text-gray-500">
                        Mean: {formatScore(esgScores.environmental.mean)} 
                        Max: {formatScore(esgScores.environmental.max)}
                    </span>
                </div>
            </div>
            <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                    class="absolute h-full bg-blue-500 transition-all duration-300"
                    style="width: {(esgScores.environmental.score / esgScores.environmental.max) * 100}%"
                />
                <!-- Mean Marker -->
                <svg 
                    class="absolute top-1/2 -translate-y-1/2" 
                    width="8" 
                    height="8" 
                    style="left: {getMeanPosition(esgScores.environmental.mean, esgScores.environmental.max)}"
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
                <span>{formatScore(esgScores.environmental.max)}</span>
            </div>
        </div>

        <!-- Social Score -->
        <div>
            <div class="flex justify-between items-center mb-2">
                <span class="text-lg text-gray-700">Social</span>
                <div class="flex items-center gap-2">
                    <span class="text-xl font-semibold">
                        {formatScore(esgScores.social.score)}
                    </span>
                    <span class="text-sm text-gray-500">
                        Mean: {formatScore(esgScores.social.mean)} 
                        Max: {formatScore(esgScores.social.max)}
                    </span>
                </div>
            </div>
            <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                    class="absolute h-full bg-purple-500 transition-all duration-300"
                    style="width: {(esgScores.social.score / esgScores.social.max) * 100}%"
                />
                <svg 
                    class="absolute top-1/2 -translate-y-1/2" 
                    width="8" 
                    height="8" 
                    style="left: {getMeanPosition(esgScores.social.mean, esgScores.social.max)}"
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
                <span>{formatScore(esgScores.social.max)}</span>
            </div>
        </div>

        <!-- Governance Score -->
        <div>
            <div class="flex justify-between items-center mb-2">
                <span class="text-lg text-gray-700">Governance</span>
                <div class="flex items-center gap-2">
                    <span class="text-xl font-semibold">
                        {formatScore(esgScores.governance.score)}
                    </span>
                    <span class="text-sm text-gray-500">
                        Mean: {formatScore(esgScores.governance.mean)} 
                        Max: {formatScore(esgScores.governance.max)}
                    </span>
                </div>
            </div>
            <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                    class="absolute h-full bg-orange-500 transition-all duration-300"
                    style="width: {(esgScores.governance.score / esgScores.governance.max) * 100}%"
                />
                <svg 
                    class="absolute top-1/2 -translate-y-1/2" 
                    width="8" 
                    height="8" 
                    style="left: {getMeanPosition(esgScores.governance.mean, esgScores.governance.max)}"
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
                <span>{formatScore(esgScores.governance.max)}</span>
            </div>
        </div>
    </div>
</div>