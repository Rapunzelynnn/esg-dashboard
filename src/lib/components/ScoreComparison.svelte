<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company } from '$lib/types';
import { Card, CardContent } from '$lib/components/ui/card';

export let data: Company[] = [];
export let expanded = false;

let hoveredCompany: Company | null = null;
let selectedIndustries = new Set<string>();
let searchTerm = '';
let selectedMetric: 'absolute' | 'relative' = 'absolute';

// Process data for visualization
$: processedData = data
  .filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      company.fullName.toLowerCase().includes(searchLower) ||
      company.symbol.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || 
      selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  });

// Calculate industry averages
$: industryAverages = data.reduce((acc, company) => {
  if (!acc[company.industryName]) {
    acc[company.industryName] = {
      envSum: 0,
      socSum: 0,
      govSum: 0,
      count: 0
    };
  }
  acc[company.industryName].envSum += company.esgScores.environmental.score;
  acc[company.industryName].socSum += company.esgScores.social.score;
  acc[company.industryName].govSum += company.esgScores.governance.score;
  acc[company.industryName].count += 1;
  return acc;
}, {} as Record<string, { envSum: number; socSum: number; govSum: number; count: number; }>);

// Get unique industries for color coding
$: industries = [...new Set(data.map(d => d.industryName))].sort();
$: colorScale = new Map(industries.map((industry, i) =>
  [industry, `hsl(${(i * 360) / industries.length}, 70%, 50%)`]
));

// Helper functions
function getBubbleSize(score: number): number {
  const minSize = 4;
  const maxSize = expanded ? 24 : 16;
  return minSize + (score / 100) * (maxSize - minSize);
}

function getRelativeScore(score: number, mean: number): number {
  return ((score - mean) / mean) * 100; // Percentage difference from mean
}

function formatScore(value: number, isRelative = false): string {
  return isRelative ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : value.toFixed(1);
}

// Add tick mark calculations
$: xAxisTicks = selectedMetric === 'absolute' 
  ? [0, 20, 40, 60, 80, 100]
  : [-50, -25, 0, 25, 50];

$: yAxisTicks = selectedMetric === 'absolute'
  ? [0, 20, 40, 60, 80, 100]
  : [-50, -25, 0, 25, 50];

function getTickPosition(tick: number): string {
  if (selectedMetric === 'absolute') {
    return `${tick}%`;
  } else {
    return `${tick + 50}%`; // Shift the -50 to +50 range to 0 to 100
  }
}

function getTickLabel(tick: number): string {
  if (selectedMetric === 'relative') {
    return tick > 0 ? `+${tick}%` : `${tick}%`;
  }
  return tick.toString();
}
</script>

<div class="w-full space-y-4">
  <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
    <div class="space-y-2">
      <h2 class="text-xl font-semibold">ESG Score Components Analysis</h2>
      <p class="text-sm text-gray-600">
        {selectedMetric === 'absolute' ? 
          'Environmental vs Social scores, bubble size represents Governance score' :
          'Scores compared to industry averages'}
      </p>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-2">
      <select
        bind:value={selectedMetric}
        class="px-3 py-1 border rounded-lg bg-white"
      >
        <option value="absolute">Absolute Scores</option>
        <option value="relative">Relative to Industry</option>
      </select>
      
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search companies..."
        class="px-3 py-1 border rounded-lg"
      />
    </div>
  </div>

  <!-- Industry Filters -->
  <div class="flex flex-wrap gap-2">
    {#each industries as industry}
      <button
        class="px-3 py-1 text-sm rounded-full transition-all duration-200
          {selectedIndustries.has(industry) ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
        on:click={() => {
          selectedIndustries = new Set(selectedIndustries);
          if (selectedIndustries.has(industry)) {
            selectedIndustries.delete(industry);
          } else {
            selectedIndustries.add(industry);
          }
        }}
      >
        <div class="flex items-center space-x-2">
          <div
            class="w-2 h-2 rounded-full"
            style="background-color: {colorScale.get(industry)}"
          ></div>
          <span>{industry}</span>
        </div>
      </button>
    {/each}
  </div>

  <!-- Chart Area -->
  <div class="relative" style="height: {expanded ? 600 : 400}px;">
    <div class="absolute inset-0">
      <!-- Axes and Grid -->
      <div class="absolute inset-x-16 inset-y-8 border-l border-b border-gray-200">
        <!-- Y-axis ticks and labels -->
        {#each yAxisTicks as tick}
          <div
            class="absolute left-0 w-full h-0 flex items-center"
            style="bottom: {getTickPosition(tick)}"
          >
            <!-- Tick label -->
            <div class="absolute -left-14 text-xs text-gray-600 w-12 text-right">
              {getTickLabel(tick)}
            </div>
            <!-- Grid line -->
            <div class="w-full border-t border-gray-100" />
          </div>
        {/each}

        <!-- X-axis ticks and labels -->
        {#each xAxisTicks as tick}
          <div
            class="absolute bottom-0 h-full w-0 flex justify-center"
            style="left: {getTickPosition(tick)}"
          >
            <!-- Tick label -->
            <div class="absolute -bottom-6 text-xs text-gray-600 transform -translate-x-1/2">
              {getTickLabel(tick)}
            </div>
            <!-- Grid line -->
            <div class="h-full border-l border-gray-100" />
          </div>
        {/each}
        
        <!-- Data points -->
        {#each processedData as company}
          {@const industryAvg = industryAverages[company.industryName]}
          {@const envScore = selectedMetric === 'absolute' ? 
            company.esgScores.environmental.score : 
            getRelativeScore(company.esgScores.environmental.score, industryAvg.envSum / industryAvg.count)}
          {@const socScore = selectedMetric === 'absolute' ? 
            company.esgScores.social.score : 
            getRelativeScore(company.esgScores.social.score, industryAvg.socSum / industryAvg.count)}
          {@const govScore = selectedMetric === 'absolute' ? 
            company.esgScores.governance.score : 
            getRelativeScore(company.esgScores.governance.score, industryAvg.govSum / industryAvg.count)}
          
          <button
            class="absolute rounded-full transition-all duration-200"
            style="
              left: {selectedMetric === 'absolute' ? (envScore) : (envScore + 50)}%;
              bottom: {selectedMetric === 'absolute' ? (socScore) : (socScore + 50)}%;
              width: {getBubbleSize(company.esgScores.governance.score)}px;
              height: {getBubbleSize(company.esgScores.governance.score)}px;
              background-color: {colorScale.get(company.industryName)};
              transform: translate(-50%, -50%);
              opacity: 0.7;
            "
            on:mouseenter={() => hoveredCompany = company}
            on:mouseleave={() => hoveredCompany = null}
          >
            {#if hoveredCompany === company}
              <div
                class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                  bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72
                  text-left pointer-events-none z-10"
                transition:fade
              >
                <div class="font-bold">{company.fullName}</div>
                <div class="text-sm text-gray-500">({company.symbol})</div>
                <div class="text-sm text-gray-600">{company.industryName}</div>
                <div class="mt-2 space-y-1">
                  <div>Environmental: 
                    <span class="font-semibold">
                      {formatScore(company.esgScores.environmental.score)}
                    </span>
                    {#if selectedMetric === 'relative'}
                      <span class="text-sm text-gray-500">
                        ({formatScore(envScore, true)} vs industry)
                      </span>
                    {/if}
                  </div>
                  <div>Social: 
                    <span class="font-semibold">
                      {formatScore(company.esgScores.social.score)}
                    </span>
                    {#if selectedMetric === 'relative'}
                      <span class="text-sm text-gray-500">
                        ({formatScore(socScore, true)} vs industry)
                      </span>
                    {/if}
                  </div>
                  <div>Governance: 
                    <span class="font-semibold">
                      {formatScore(company.esgScores.governance.score)}
                    </span>
                    {#if selectedMetric === 'relative'}
                      <span class="text-sm text-gray-500">
                        ({formatScore(govScore, true)} vs industry)
                      </span>
                    {/if}
                  </div>
                  <div class="text-sm text-gray-500 mt-2">
                    Beta: {company.beta.toFixed(2)}
                  </div>
                </div>
              </div>
            {/if}
          </button>
        {/each}
      </div>
      <!-- Enhanced Axis Labels -->
      <div class="absolute bottom-0 left-0 right-0 flex flex-col items-center">
        <div class="h-16"></div> <!-- Spacer for tick labels -->
        <div class="text-sm text-gray-600 font-medium">
          {#if selectedMetric === 'absolute'}
            Environmental Score
          {:else}
            Environmental Score (% vs Industry Average)
          {/if}
        </div>
    </div>
    <div class="absolute left-2 top-1/2 -rotate-90 text-sm text-gray-600 font-medium whitespace-nowrap">
      {#if selectedMetric === 'absolute'}
        Social Score
      {:else}
        Social Score (% vs Industry Average)
      {/if}
    </div>
    <!-- Legend for Governance Score -->
    <div class="absolute right-4 top-4 bg-white/80 p-2 rounded-lg shadow-sm">
      <div class="text-sm text-gray-600 font-medium">Bubble Size</div>
      <div class="text-xs text-gray-500">= Governance Score</div>
      <div class="flex items-center mt-1 space-x-2">
        <div class="w-2 h-2 rounded-full bg-gray-400"></div>
        <span class="text-xs">Low</span>
        <div class="w-4 h-4 rounded-full bg-gray-400"></div>
        <span class="text-xs">High</span>
      </div>
      </div>
    </div>
  </div>

  <!-- Statistics -->
  {#if processedData.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Selected Companies</div>
        <div class="font-semibold">{processedData.length}</div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Avg Environmental</div>
        <div class="font-semibold">
          {(processedData.reduce((sum, co) => sum + co.esgScores.environmental.score, 0) / 
            processedData.length).toFixed(1)}
        </div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Avg Social</div>
        <div class="font-semibold">
          {(processedData.reduce((sum, co) => sum + co.esgScores.social.score, 0) / 
            processedData.length).toFixed(1)}
        </div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Avg Governance</div>
        <div class="font-semibold">
          {(processedData.reduce((sum, co) => sum + co.esgScores.governance.score, 0) / 
            processedData.length).toFixed(1)}
        </div>
      </div>
    </div>
  {/if}
</div>