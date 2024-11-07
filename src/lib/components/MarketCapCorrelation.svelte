<!-- $lib/components/MarketCapCorrelation.svelte -->
<script lang="ts">
import { fade } from 'svelte/transition';
import { onMount } from 'svelte';
import InteractiveWrapper from './InteractiveWrapper.svelte';
import type { 
  Company, 
  IndustryStats, 
  IndustryAccumulator,
  ProcessedCompanyData,
} from '$lib/types';

// Props
export let data: Company[] = [];
export let expanded = false;

// Reference to container for responsive sizing
let container: HTMLElement;
let containerWidth = 0;

// Chart dimensions with margins for axes
const margin = { top: 20, right: 30, bottom: 40, left: 60 };
$: chartWidth = containerWidth || 800;
$: chartHeight = expanded ? 600 : 400;
$: plotWidth = chartWidth - margin.left - margin.right;
$: plotHeight = chartHeight - margin.top - margin.bottom;

// Update container width on mount and resize
onMount(() => {
  const updateWidth = () => {
    if (container) {
      containerWidth = container.offsetWidth;
    }
  };
  
  updateWidth();
  window.addEventListener('resize', updateWidth);
  return () => window.removeEventListener('resize', updateWidth);
});

// State management
let selectedIndustries = new Set<string>();
let searchTerm = '';
let selectedCompany: ProcessedCompanyData | null = null;
let hoveredPoint: ProcessedCompanyData | null = null;
type ViewMode = 'absolute' | 'relative';
let viewMode: ViewMode = 'relative';

// Process data for industry stats
$: industryStats = data.reduce((acc: IndustryAccumulator, company) => {
  if (!acc[company.industryName]) {
    acc[company.industryName] = {
      companies: [],
      avgESG: 0,
      avgMarketCap: 0,
      stdDevESG: 0
    };
  }
  acc[company.industryName].companies.push(company);
  return acc;
}, {} as IndustryAccumulator);

$: marketCapData = data
  .map(company => {
    const stats = industryStats[company.industryName];
    const relativeESG = stats.stdDevESG !== 0 
      ? (company.esgScores.total - stats.avgESG) / stats.stdDevESG 
      : 0;
    
    return {
      ...company,
      relativeESG,
      isOutlier: Math.abs(relativeESG) > 2,
      industryAvg: stats.avgESG,
      industryStdDev: stats.stdDevESG
    };
  })
  .filter(d => d.marketCap > 0 && d.esgScores.total > 0);

// Filtering logic
$: filteredData = marketCapData.filter(company => {
  const searchLower = searchTerm.toLowerCase();
  const matchesSearch = searchTerm === '' || 
    company.symbol.toLowerCase().includes(searchLower) ||
    company.fullName.toLowerCase().includes(searchLower) ||
    company.industryName.toLowerCase().includes(searchLower);
  const matchesIndustry = selectedIndustries.size === 0 || 
    selectedIndustries.has(company.industryName);
  return matchesSearch && matchesIndustry;
});

// Get unique industries for color coding
$: industries = [...new Set(marketCapData.map(d => d.industryName))].sort();
$: colorScale = new Map(industries.map((industry, i) =>
  [industry, `hsl(${(i * 360) / industries.length}, 70%, 50%)`]
));

// Helper functions
function toggleIndustry(industry: string) {
  selectedIndustries = new Set(selectedIndustries);
  if (selectedIndustries.has(industry)) {
    selectedIndustries.delete(industry);
  } else {
    selectedIndustries.add(industry);
  }
}

function formatMarketCap(value: number): string {
  if (!value || isNaN(value)) return '$0.00';
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
  } else if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)} billion`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)} million`;
  }
  return `$${value.toFixed(2)}`;
}

// Dimensions and scales
$: maxMarketCap = Math.max(...filteredData.map(d => d.marketCap));
$: maxScore = viewMode === 'absolute' ? 100 : 4;
$: minScore = viewMode === 'absolute' ? 0 : -4;

// Transform coordinates function
function transformCoordinates(marketCap: number, score: number) {
  const x = (marketCap / maxMarketCap) * plotWidth;
  const y = (viewMode === 'absolute'
    ? score / maxScore
    : (score - minScore) / (maxScore - minScore)) * plotHeight;
    
  return {
    x: margin.left + x,
    y: plotHeight - y + margin.top
  };
}

function handleTransform(event: CustomEvent<{ scale: number; x: number; y: number }>) {
  // Optional: Add any additional transform handling if needed
}

function getPerformanceIndicator(relativeESG: number): string {
  if (relativeESG > 2) return 'Significantly Above Average';
  if (relativeESG > 1) return 'Above Average';
  if (relativeESG < -2) return 'Significantly Below Average';
  if (relativeESG < -1) return 'Below Average';
  return 'Average';
}

function getPerformanceColor(relativeESG: number): string {
  if (Math.abs(relativeESG) > 2) return 'text-red-600';
  if (Math.abs(relativeESG) > 1) return 'text-orange-500';
  return 'text-green-600';
}

function getScaledPosition(x: number, y: number, zoomLevel: number, panX: number, panY: number) {
  return {
    x: (x * zoomLevel) + panX,
    y: (y * zoomLevel) + panY,
  };
}

</script>

<div class="w-full space-y-4" bind:this={container}>
  <!-- Header and Controls -->
  <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start">
    <h2 class="text-xl font-semibold">ESG Score vs Market Cap</h2>
    
    <!-- View Mode Toggle -->
    <div class="flex space-x-2">
      <button
        type="button"
        class="px-3 py-1 rounded-lg transition-all duration-200 {viewMode === 'absolute' ? 'bg-blue-500 text-white' : 'bg-gray-100'}"
        on:click={() => viewMode = 'absolute'}
      >
        Absolute Scores
      </button>
      <button
        type="button"
        class="px-3 py-1 rounded-lg transition-all duration-200 {viewMode === 'relative' ? 'bg-blue-500 text-white' : 'bg-gray-100'}"
        on:click={() => viewMode = 'relative'}
      >
        Industry-Relative
      </button>
    </div>
    
    <!-- Search -->
    <div class="flex-1 w-full sm:w-auto">
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search company name, symbol, or industry..."
        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>

  <!-- Industry Filters -->
  <div class="flex flex-wrap gap-2">
    {#each industries as industry}
      <button
        type="button"
        class="px-3 py-1 text-sm rounded-full transition-all duration-200
          {selectedIndustries.has(industry) 
            ? 'bg-gray-800 text-white' 
            : 'bg-gray-100 hover:bg-gray-200'}"
        on:click={() => toggleIndustry(industry)}
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

  <!-- Chart Container -->
  <InteractiveWrapper
    width={chartWidth}
    height={chartHeight}
    enableZoom={true}
    enablePan={true}
    minZoom={0.5}
    maxZoom={5}
    on:transform={handleTransform}
    let:zoomLevel
    let:panX
    let:panY
  >
    <!-- Main chart container that moves with pan/zoom -->
    <div 
      class="absolute inset-0"
      style="transform: scale({zoomLevel}) translate({panX/zoomLevel}px, {panY/zoomLevel}px);"
    >
      <!-- Grid lines and axis labels that move with content -->
      <div class="absolute inset-0" aria-hidden="true">
        <!-- Y-axis lines -->
        {#each Array(11) as _, i}
          <div 
            class="absolute w-full border-t border-gray-100"
            style="top: {margin.top + (i * plotHeight / 10)}px"
          />
        {/each}
        <!-- X-axis lines -->
        {#each Array(11) as _, i}
          <div 
            class="absolute h-full border-l border-gray-100"
            style="left: {margin.left + (i * plotWidth / 10)}px"
          />
        {/each}
      </div>

      <!-- Data points -->
      {#each filteredData as company}
        {@const coords = transformCoordinates(
          company.marketCap,
          viewMode === 'absolute' ? company.esgScores.total : company.relativeESG
        )}
        <button
          type="button"
          class="absolute rounded-full transition-all duration-200
            {hoveredPoint === company || selectedCompany === company 
              ? 'w-4 h-4 z-20' : 'w-2 h-2 z-10'}
            {company.isOutlier ? 'ring-2 ring-red-500' : ''}"
          style="
            left: {coords.x}px;
            top: {coords.y}px;
            background-color: {colorScale.get(company.industryName)};
            transform: translate(-50%, -50%);
          "
          on:mouseenter={() => hoveredPoint = company}
          on:mouseleave={() => hoveredPoint = null}
          on:click={() => selectedCompany = selectedCompany === company ? null : company}
        >
          <span class="sr-only">
            {company.fullName} - ESG Score: {company.esgScores.total}
          </span>
        </button>

        <!-- Company Card Popup -->
        {#if hoveredPoint === company || selectedCompany === company}
          {@const popupPosition = getScaledPosition(coords.x, coords.y, zoomLevel, panX, panY)}
          <div
            class="absolute z-30 pointer-events-none"
            style="
              left: {popupPosition.x}px;
              top: {popupPosition.y}px;
              transform: translate(-50%, -100%) translateY(-12px) scale({1/zoomLevel});
              transform-origin: bottom center;
              {popupPosition.y < 100 ? 'top: auto; bottom: 0; transform: translate(-50%, 100%) translateY(12px) scale(${1/zoomLevel});' : ''}
              {popupPosition.x < 200 ? 'left: 200px;' : popupPosition.x > chartWidth - 200 ? 'left: ${chartWidth - 200}px;' : ''}
            "
            transition:fade
          >
            <div class="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
              <div class="font-bold text-lg">{company.fullName}</div>
              <div class="text-sm text-gray-500">({company.symbol})</div>
              <div class="text-sm text-gray-600">{company.industryName}</div>
              
              <div class="mt-3 space-y-2">
                <div>
                  <span class="text-gray-600">ESG Score:</span>
                  <span class="font-semibold ml-2">
                    {company.esgScores.total.toFixed(1)}
                  </span>
                </div>

                <div>
                  <span class="text-gray-600">Market Cap:</span>
                  <span class="font-semibold ml-2">
                    {formatMarketCap(company.marketCap)}
                  </span>
                </div>

                {#if viewMode === 'relative'}
                  <div class="pt-2 border-t">
                    <div>
                      <span class="text-gray-600">Industry Average:</span>
                      <span class="font-semibold ml-2">
                        {company.industryAvg.toFixed(1)}
                      </span>
                    </div>
                    
                    <div>
                      <span class="text-gray-600">Standard Deviation:</span>
                      <span class="font-semibold ml-2">
                        {company.industryStdDev.toFixed(2)}
                      </span>
                    </div>
                    
                    <div>
                      <span class="text-gray-600">Z-Score:</span>
                      <span class="font-semibold ml-2">
                        {company.relativeESG.toFixed(2)}σ
                      </span>
                    </div>

                    <div class="mt-2">
                      <span class="text-gray-600">Performance:</span>
                      <span class="font-semibold ml-2 {getPerformanceColor(company.relativeESG)}">
                        {getPerformanceIndicator(company.relativeESG)}
                      </span>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </div>

    <!-- Fixed Axes Labels -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Y-axis labels -->
      <div class="absolute left-0 top-0 bottom-0">
        {#if viewMode === 'absolute'}
          {#each [0, 20, 40, 60, 80, 100] as value}
            <div
              class="absolute text-sm text-gray-600"
              style="
                left: {margin.left - 8}px;
                top: {plotHeight - (value / 100) * plotHeight + margin.top}px;
                transform: translateY(-50%);
              "
            >
              {value}
            </div>
          {/each}
        {:else}
          {#each [-4, -2, 0, 2, 4] as value}
            <div
              class="absolute text-sm text-gray-600"
              style="
                left: {margin.left - 8}px;
                top: {plotHeight - ((value - minScore) / (maxScore - minScore)) * plotHeight + margin.top}px;
                transform: translateY(-50%);
              "
            >
              {value}σ
            </div>
          {/each}
        {/if}
      </div>

      <!-- Axis Titles -->
      <div 
        class="absolute text-sm font-semibold text-gray-600"
        style="left: {margin.left}px; top: {margin.top - 24}px;"
      >
        {viewMode === 'absolute' ? 'ESG Score' : 'ESG Score (σ from Industry Mean)'}
      </div>
      <div 
        class="absolute text-sm font-semibold text-gray-600"
        style="left: {margin.left + plotWidth / 2}px; bottom: {margin.bottom - 8}px;"
      >
        Market Cap (Billions USD)
      </div>
    </div>
  </InteractiveWrapper>


  <!-- Statistics Panel -->
  {#if filteredData.length > 0}
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="font-semibold mb-2">Quick Stats</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div class="text-sm text-gray-600">Average ESG Score</div>
          <div class="font-semibold">
            {(filteredData.reduce((sum, co) => sum + co.esgScores.total, 0) / 
              filteredData.length).toFixed(1)}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Companies Shown</div>
          <div class="font-semibold">{filteredData.length}</div>
          </div>
        <div>
          <div class="text-sm text-gray-600">Outliers</div>
          <div class="font-semibold">
            {filteredData.filter(co => co.isOutlier).length}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Industry Coverage</div>
          <div class="font-semibold">
            {selectedIndustries.size || industries.length} / {industries.length}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .grid-lines {
    pointer-events: none;
  }

  button {
    -webkit-appearance: none;
    appearance: none;
  }

  button:focus-visible {
    outline: 2px solid #4F46E5;
    outline-offset: 2px;
  }
</style>