<script lang="ts">
    import { writable } from 'svelte/store';
    
    export let esgScores: {
        total: number;
        environmental: { score: number; mean: number; max: number };
        social: { score: number; mean: number; max: number };
        governance: { score: number; mean: number; max: number };
    };

    type CategoryKey = 'environmental' | 'social' | 'governance';
    const categories: CategoryKey[] = ['environmental', 'social', 'governance'];

    interface ScoreRange {
        min: number;
        max: number;
        label: string;
        color: string;
        description: string;
    }

    const scoreRanges: ScoreRange[] = [
        {
            min: 80,
            max: 100,
            label: 'Excellent',
            color: 'bg-blue-500',  
            description: 'Significantly above industry average, demonstrating leadership'
        },
        {
            min: 65,
            max: 79.99,
            label: 'Very Good',
            color: 'bg-cyan-500', 
            description: 'Above industry average, showing strong performance'
        },
        {
            min: 50,
            max: 64.99,
            label: 'Good',
            color: 'bg-teal-500',     
            description: 'Around industry average, meeting standards'
        },
        {
            min: 35,
            max: 49.99,
            label: 'Fair',
            color: 'bg-amber-500',    
            description: 'Below industry average, improvement needed'
        },
        {
            min: 0,
            max: 34.99,
            label: 'Poor',
            color: 'bg-red-500',     
            description: 'Significantly below industry average'
        }
    ];

    // Added missing formatScore function
    function formatScore(score: number): string {
        if (!score || isNaN(score)) return '0.0';
        return score.toFixed(1);
    }

    // Added missing getMeanPosition function
    function getMeanPosition(score: number, max: number): string {
        if (!score || !max) return '0%';
        return `${(score / max) * 100}%`;
    }

    // Added missing getCategoryLabel function
    function getCategoryLabel(category: CategoryKey): string {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    function getScoreRating(score: number, mean: number, max: number): ScoreRange {
        // Calculate how far above or below the mean the score is
        const meanPercentage = (mean / max) * 100;
        const scorePercentage = (score / max) * 100;
        
        // Calculate relative position compared to industry mean
        const relativePosition = ((scorePercentage - meanPercentage) / meanPercentage) * 100;

        // Assign ratings based on relative position to industry mean
        if (relativePosition >= 50) { // 50% or more above mean
            return scoreRanges[0]; // Excellent
        } else if (relativePosition >= 20) { // 20-49% above mean
            return scoreRanges[1]; // Very Good
        } else if (relativePosition >= -20) { // Within 20% of mean
            return scoreRanges[2]; // Good
        } else if (relativePosition >= -50) { // 20-50% below mean
            return scoreRanges[3]; // Fair
        } else { // More than 50% below mean
            return scoreRanges[4]; // Poor
        }
    }

    function getScoreColor(score: number, mean: number, max: number): string {
        return getScoreRating(score, mean, max).color;
    }

    function getScoreStatus(score: number, mean: number, max: number): string {
        const scorePercentage = (score / max) * 100;
        const meanPercentage = (mean / max) * 100;
        const difference = scorePercentage - meanPercentage;
        
        if (difference > 0) {
            return `${difference.toFixed(1)}% above industry average`;
        } else if (difference < 0) {
            return `${Math.abs(difference).toFixed(1)}% below industry average`;
        }
        return 'At industry average';
    }
</script>

<div class="p-6 bg-white rounded-lg">
    <h1 class="text-4xl font-bold mb-8">ESG Performance</h1>
    
    <div class="grid grid-cols-[180px_1fr] gap-8">
        <!-- Total Score Circle -->
        <div class="relative w-40 h-40">
            <svg 
                viewBox="0 0 120 120" 
                class="w-full h-full transform -rotate-90"
                style="overflow: visible"
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
                    style="stroke-dasharray: {esgScores.total * 3.39}, 339"
                />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div class="text-4xl font-bold text-gray-900">
                    {formatScore(esgScores.total)}
                </div>
                <div class="text-sm text-gray-500 mt-1">Total Score</div>
            </div>
        </div>

        <!-- ESG Breakdowns -->
        <div class="space-y-8">
            {#each categories as category}
                {@const categoryData = esgScores[category]}
                {@const rating = getScoreRating(
                    categoryData.score,
                    categoryData.mean,
                    categoryData.max
                )}
                {@const status = getScoreStatus(
                    categoryData.score,
                    categoryData.mean,
                    categoryData.max
                )}
                <div class="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-2xl text-gray-700">{getCategoryLabel(category)}</span>
                        <div class="text-right">
                            <span class="text-3xl font-bold">
                                {formatScore(categoryData.score)}
                            </span>
                            <div class="text-sm text-gray-500">{rating.label}</div>
                            <div class="text-xs text-gray-500">{status}</div>
                        </div>
                    </div>
                    <div class="relative">
                        <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                class="h-full transition-all duration-300 rounded-full {getScoreColor(categoryData.score, categoryData.mean, categoryData.max)}"
                                style="width: {(categoryData.score / categoryData.max) * 100}%"
                            />
                        </div>
                        
                        <!-- Mean Marker -->
                        <div 
                            class="absolute top-0 -mt-1"
                            style="left: {getMeanPosition(categoryData.mean, categoryData.max)}; transform: translateX(-50%)"
                        >
                            <div class="flex flex-col items-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" class="text-gray-600">
                                    <path d="M12 2L20 18H4L12 2Z" fill="currentColor"/>
                                </svg>
                                <span class="text-sm text-gray-600 mt-1">
                                    Sector Avg: {formatScore(categoryData.mean)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Scale Labels -->
                    <div class="flex justify-between mt-2 text-sm text-gray-500">
                        <span>0</span>
                        <span>Max: {formatScore(categoryData.max)}</span>
                    </div>

                    <!-- Rating Description -->
                    <div class="mt-2 text-sm text-gray-600">
                        {rating.description}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Legend -->
    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
        <div class="text-sm text-gray-600">
            <div class="flex items-center gap-2 mb-4">
                <svg width="16" height="16" viewBox="0 0 16 16" class="text-gray-600 fill-current">
                    <path d="M8 2L14 12H2L8 2Z"/>
                </svg>
                <span>Sector Average indicates the mean score across your industry</span>
            </div>
            
            <div class="flex items-start justify-between gap-2">
                {#each scoreRanges.slice().reverse() as range}
                    <div class="flex-1 text-center">
                        <div class={`h-2 rounded-full ${range.color} mb-2`}></div>
                        <div class="text-xs text-gray-600">{range.label}</div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>