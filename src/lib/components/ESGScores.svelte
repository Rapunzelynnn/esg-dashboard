<script lang="ts">
    import { writable } from 'svelte/store';
    
    export let esgScores: {
        total: number;
        environmental: { score: number; mean: number; max: number };
        social: { score: number; mean: number; max: number };
        governance: { score: number; mean: number; max: number };
    };
    export let showTotal = true;
    export let showBreakdown = true;

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

    function formatScore(score: number): string {
        if (!score || isNaN(score)) return '0.0';
        return score.toFixed(1);
    }

    function getMeanPosition(score: number, max: number): string {
        if (!score || !max) return '0%';
        return `${(score / max) * 100}%`;
    }

    function getCategoryLabel(category: CategoryKey): string {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    function getScoreRating(score: number, mean: number, max: number): ScoreRange {
        const meanPercentage = (mean / max) * 100;
        const scorePercentage = (score / max) * 100;
        const relativePosition = ((scorePercentage - meanPercentage) / meanPercentage) * 100;

        if (relativePosition >= 50) return scoreRanges[0];
        else if (relativePosition >= 20) return scoreRanges[1];
        else if (relativePosition >= -20) return scoreRanges[2];
        else if (relativePosition >= -50) return scoreRanges[3];
        else return scoreRanges[4];
    }

    function getScoreColor(score: number, mean: number, max: number): string {
        return getScoreRating(score, mean, max).color;
    }

    function getScoreStatus(score: number, mean: number): string {
        const difference = ((score - mean) / mean * 100).toFixed(1);
        const direction = score > mean ? 'above' : 'below';
        return `${Math.abs(Number(difference))}% ${direction} industry average`;
    }

    let activeTooltip = writable<string | null>(null);
</script>

{#if showTotal}
<!-- Total Score Circle - Larger size with no extra spacing -->
<div class="w-56 h-56"> <!-- Increased size, removed extra margins -->
    <div class="relative w-full h-full">
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
                style="stroke-dasharray: {esgScores.total * 3.39}, 339"
            />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-5xl font-bold leading-none">
                {formatScore(esgScores.total)}
            </div>
            <div class="text-base text-gray-500 leading-tight mt-1">Total Score</div>
        </div>
    </div>
</div>
{/if}

{#if showBreakdown}
<div class="space-y-5">
    {#each categories as category}
        {@const categoryData = esgScores[category]}
        {@const rating = getScoreRating(categoryData.score, categoryData.mean, categoryData.max)}
        <div class="space-y-2">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-base font-medium">{getCategoryLabel(category)}</span>
                </div>
                <div class="text-right">
                    <div class="flex items-center gap-2">
                        <span class="text-xl font-bold">{formatScore(categoryData.score)}</span>
                        <span class="text-sm text-gray-500">{rating.label}</span>
                    </div>
                    <div class="text-xs text-gray-500">
                        {getScoreStatus(categoryData.score, categoryData.mean)}
                    </div>
                </div>
            </div>
            
            <div class="group relative">
                <!-- Score Bar Container -->
                <div class="relative group">
                    <!-- Progressbar -->
                    <div
                        role="progressbar"
                        aria-label="{getCategoryLabel(category)} score"
                        aria-valuenow={categoryData.score}
                        aria-valuemin="0"
                        aria-valuemax={categoryData.max}
                        class="h-3 bg-gray-100 rounded-full overflow-hidden transition-all duration-200 group-hover:h-4"
                    >
                        <div
                            class="h-full rounded-full {getScoreColor(categoryData.score, categoryData.mean, categoryData.max)} transition-all duration-200"
                            style="width: {(categoryData.score / categoryData.max) * 100}%"
                        />
                    </div>

                    <!-- Invisible button for interaction -->
                    <button
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Show details for {getCategoryLabel(category)} score"
                        on:mouseenter={() => $activeTooltip = category}
                        on:mouseleave={() => $activeTooltip = null}
                        on:focus={() => $activeTooltip = category}
                        on:blur={() => $activeTooltip = null}
                    />
                </div>

                <!-- Sector Average Marker -->
                <div 
                    class="absolute top-0 -mt-0.5 transition-all duration-200 group-hover:-mt-1"
                    style="left: {getMeanPosition(categoryData.mean, categoryData.max)}; transform: translateX(-50%)"
                >
                    <div class="flex flex-col items-center">
                        <svg width="12" height="6" viewBox="0 0 12 6" class="text-gray-600">
                            <path d="M6 0L12 6H0L6 0Z" fill="currentColor"/>
                        </svg>
                    </div>
                </div>

                <!-- Hover Tooltip -->
                {#if $activeTooltip === category}
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        {rating.description}
                    </div>
                {/if}
            </div>
            
            <div class="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>Sector Avg: {formatScore(categoryData.mean)}</span>
                <span>Max: {formatScore(categoryData.max)}</span>
            </div>
        </div>
    {/each}
</div>
{/if}