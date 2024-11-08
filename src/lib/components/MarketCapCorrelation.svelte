<script lang="ts">
import { fade } from 'svelte/transition';
import type { 
  Company, 
  IndustryStats, 
  IndustryAccumulator,
  ProcessedCompanyData 
} from '$lib/types';


// Props
export let data: Company[] = [];
export let expanded = false;

// State management
let selectedIndustries = new Set<string>();
let searchTerm = '';
let selectedCompany: ProcessedCompanyData | null = null;
let hoveredPoint: ProcessedCompanyData | null = null;
let viewMode: 'absolute' | 'relative' = 'relative';

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

// Add console.log to check values
$: {
  Object.values(industryStats).forEach(stats => {
    const validCompanies = stats.companies.filter(c => 
      c.esgScores.total > 0 && !isNaN(c.esgScores.total)
    );
    
    // Calculate industry mean ESG score
    stats.avgESG = validCompanies.reduce((sum, c) => 
      sum + c.esgScores.total, 0) / validCompanies.length;
    
    // Calculate standard deviation
    const squaredDiffs = validCompanies.map(c => 
      Math.pow(c.esgScores.total - stats.avgESG, 2)
    );
    stats.stdDevESG = Math.sqrt(
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / validCompanies.length
    );

    console.log(`Industry ${stats.companies[0]?.industryName}:`, {
      avgESG: stats.avgESG,
      stdDevESG: stats.stdDevESG,
      companies: stats.companies.length
    });
  });
}

$: marketCapData = data
  .map(company => {
    const stats = industryStats[company.industryName];
    const relativeESG = stats.stdDevESG !== 0 
      ? (company.esgScores.total - stats.avgESG) / stats.stdDevESG 
      : 0;
    
    const processed = {
      ...company,
      relativeESG,
      isOutlier: Math.abs(relativeESG) > 2,
      industryAvg: stats.avgESG,
      industryStdDev: stats.stdDevESG
    };

    // Debug log
    console.log('Processed company:', {
      name: company.fullName,
      industryAvg: processed.industryAvg,
      relativeESG: processed.relativeESG
    });

    return processed;
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

// Dimensions and scales
$: height = expanded ? 600 : 400;
$: maxMarketCap = Math.max(...filteredData.map(d => d.marketCap));
$: maxScore = viewMode === 'absolute' ? 100 : 4; // 4 standard deviations for relative view
$: minScore = viewMode === 'absolute' ? 0 : -4;

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
        return `$${(value / 1_000_000_000).toFixed(2)} million`;
    }
    return `$${value.toFixed(2)}`;
}

function formatScore(company: any): string {
  if (viewMode === 'absolute') {
    return company.esgScore.toFixed(1);
  }
  return `${company.relativeESG.toFixed(2)} σ (${company.esgScore.toFixed(1)})`;
}

function handleChartClick() {
  selectedCompany = null;
}

function handlePointClick(company: ProcessedCompanyData, event: Event) {
  event.stopPropagation();
  selectedCompany = selectedCompany === company ? null : company;
}
</script>

<div class="w-full space-y-4">
  <!-- Header and Controls -->
  <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start">
    <h2 class="text-xl font-semibold">ESG Score vs Market Cap</h2>
    
    <!-- View Mode Toggle -->
    <div class="flex space-x-2">
      <button
        class="px-3 py-1 rounded-lg transition-all duration-200 {viewMode === 'absolute' ? 'bg-blue-500 text-white' : 'bg-gray-100'}"
        on:click={() => viewMode = 'absolute'}
      >
        Absolute Scores
      </button>
      <button
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

  <!-- Chart container -->
  <section 
    class="relative chart-area ml-12" 
    style="height: {height}px;"
    role="region"
    aria-label="ESG Score vs Market Cap Chart"
  >
    <button
      class="absolute inset-0 w-full h-full transparent-button"
      on:click={handleChartClick}
      on:keydown={(e) => {
        if (e.key === 'Escape') selectedCompany = null;
      }}
      aria-label="Clear selection"
    >
      <div class="absolute inset-0" role="presentation">
        <!-- Y-axis labels -->
        <div 
          class="absolute left-0 top-0 bottom-8 w-16"
          role="group"
          aria-label="Y-axis"
        >
          <!-- Y-axis scale labels -->
          <div class="absolute right-0 h-full" role="group" aria-label="Y-axis scale">
            {#if viewMode === 'absolute'}
              {#each [0, 20, 40, 60, 80, 100] as value}
                <span
                  class="absolute right-0 text-sm text-gray-600 pr-2"
                  style="bottom: {(value / maxScore) * 100}%"
                  role="text"
                >
                  {value}
                </span>
              {/each}
            {:else}
              {#each [-4, -2, 0, 2, 4] as value}
                <span
                  class="absolute right-0 text-sm text-gray-600 pr-2"
                  style="bottom: {((value - minScore) / (maxScore - minScore)) * 100}%"
                  role="text"
                >
                  {value}σ
                </span>
              {/each}
            {/if}
          </div>
        </div>
        
        <!-- Y-axis title - Moved outside the chart area -->
        <div 
          class="absolute text-sm text-gray-600"
          style="left: -3rem; top: 50%; transform: rotate(-90deg) translateX(-50%); transform-origin: left top;"
          role="text"
        >
          {viewMode === 'absolute' ? 'ESG Score' : 'ESG Score (Standard Deviations from Industry Mean)'}
        </div>

      <!-- Grid lines -->
      <div class="absolute left-16 right-0 top-0 bottom-8" aria-hidden="true">
        {#if viewMode === 'absolute'}
          {#each [20, 40, 60, 80] as value}
            <div
              class="absolute w-full border-t border-gray-200"
              style="bottom: {(value / maxScore) * 100}%"
            />
          {/each}
        {:else}
          {#each [-2, 0, 2] as value}
            <div
              class="absolute w-full border-t {value === 0 ? 'border-gray-400' : 'border-gray-200'}"
              style="bottom: {((value - minScore) / (maxScore - minScore)) * 100}%"
            />
          {/each}
        {/if}
      </div>

      <!-- Data points -->
      <div 
        class="absolute left-16 right-8 top-8 bottom-8" 
        role="group" 
        aria-label="Company data points"
      >
        {#each filteredData as company}
          {@const yValue = viewMode === 'absolute' ? company.esgScores.total : company.relativeESG}
          <button
            type="button"
            class="absolute rounded-full transition-all duration-200
              {hoveredPoint === company || selectedCompany === company 
                ? 'w-4 h-4 z-20' : 'w-2 h-2 z-10'}
              {company.isOutlier ? 'ring-2 ring-red-500' : ''}"
            style="
              left: {(company.marketCap / maxMarketCap) * 100}%;
              bottom: {((yValue - minScore) / (maxScore - minScore)) * 100}%;
              background-color: {colorScale.get(company.industryName)};
              transform: translate(-50%, -50%);
            "
            on:mouseenter={() => hoveredPoint = company}
            on:mouseleave={() => hoveredPoint = null}
            on:click|stopPropagation={(e) => handlePointClick(company, e)}
            on:keydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePointClick(company, e);
              }
            }}
            aria-label="{company.fullName}: ESG score {company.esgScores.total.toFixed(1)}, Market cap {formatMarketCap(company.marketCap)}"
            aria-expanded={selectedCompany === company}
          >
            {#if hoveredPoint === company || selectedCompany === company}
              <div
                class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                  bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72
                  text-left pointer-events-none"
                transition:fade
                role="tooltip"
                aria-live="polite"
              >
                <div class="font-bold">{company.fullName}</div>
                <div class="text-sm text-gray-500">({company.symbol})</div>
                <div class="text-sm text-gray-600">{company.industryName}</div>
                <div class="mt-2 space-y-1">
                  <div>ESG Score: <span class="font-semibold">
                    {company.esgScores.total.toFixed(1)}
                  </span></div>
                  {#if viewMode === 'relative'}
                    <div>Industry Z-Score: <span class="font-semibold">
                      {(company.relativeESG || 0).toFixed(2)}σ
                    </span></div>
                    <div>Industry Average: <span class="font-semibold">
                      {(company.industryAvg || 0).toFixed(1)}
                    </span></div>
                  {/if}
                  <div>Market Cap: <span class="font-semibold">
                    {formatMarketCap(company.marketCap)}
                  </span></div>
                  {#if company.isOutlier}
                    <div class="text-red-500 text-sm mt-1">
                      ⚠️ {company.relativeESG > 0 ? 'Significantly above' : 'Significantly below'} 
                      industry average
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- X-axis label -->
      <span 
        class="absolute bottom-0 left-16 right-0 text-center text-sm text-gray-600"
        role="text"
      >
        Market Cap (Billions USD)
      </span>
    </div>
  </button>
</section>

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
.transparent-button {
  background: transparent;
  border: none;
  cursor: default;
}

.transparent-button:focus {
  outline: none;
}

.transparent-button:focus-visible {
  outline: 2px solid #4F46E5;
  outline-offset: 2px;
}
</style>