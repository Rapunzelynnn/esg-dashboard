<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company } from '$lib/types';

// Props
export let data: Company[] = [];
export let expanded = false;

// State management
let selectedIndustries = new Set<string>();
let searchTerm = '';
let selectedCompany: Company | null = null;
let hoveredPoint: Company | null = null;

// Reactive declarations
$: marketCapData = data
  .map(company => ({
    ...company,
    marketCap: company.marketCap,
    esgScore: company.esgScores.total,
    industryName: company.industryName,
    // Use fullName instead of companyName to match the interface
    fullName: company.fullName
  }))
  .filter(d => d.marketCap > 0 && d.esgScore > 0);

// Enhanced search to include company full names
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
$: maxScore = 100;

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
  return value >= 1000 
    ? `$${(value/1000).toFixed(1)}T` 
    : `$${value.toFixed(1)}B`;
}

function handlePointClick(company: Company) {
  selectedCompany = selectedCompany === company ? null : company;
}
</script>

<div class="w-full space-y-4">
  <!-- Header and Controls -->
  <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start">
    <!-- <h2 class="text-xl font-semibold">ESG Score vs Market Cap</h2> -->
    
    <!-- Search and Filters -->
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

  <!-- Chart Container -->
  <div class="relative" style="height: {height}px;">
    <div class="absolute inset-0">
      <!-- Y-axis labels -->
      <div class="absolute left-0 top-0 bottom-8 w-16">
        {#each [0, 20, 40, 60, 80, 100] as value}
          <div
            class="absolute right-0 text-sm text-gray-600 pr-2"
            style="bottom: {(value / maxScore) * 100}%"
          >
            {value}
          </div>
        {/each}
      </div>

      <!-- Grid lines -->
      <div class="absolute left-16 right-0 top-0 bottom-8">
        {#each [20, 40, 60, 80] as value}
          <div
            class="absolute w-full border-t border-gray-200"
            style="bottom: {(value / maxScore) * 100}%"
          />
        {/each}
      </div>

      <!-- Data points -->
      <div class="absolute left-16 right-8 top-8 bottom-8">
        {#each filteredData as company}
          <button
            class="absolute rounded-full transition-all duration-200
              {hoveredPoint === company || selectedCompany === company 
                ? 'w-4 h-4 z-20' : 'w-2 h-2 z-10'}"
            style="
              left: {(company.marketCap / maxMarketCap) * 100}%;
              bottom: {(company.esgScore / maxScore) * 100}%;
              background-color: {colorScale.get(company.industryName)};
              transform: translate(-50%, -50%);
            "
            on:mouseenter={() => hoveredPoint = company}
            on:mouseleave={() => hoveredPoint = null}
            on:click={() => handlePointClick(company)}
          >
            {#if hoveredPoint === company || selectedCompany === company}
              <div
                class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                  bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64
                  text-left pointer-events-none"
                transition:fade
              >
                <div class="font-bold">{company.fullName}</div>
                <div class="text-sm text-gray-500">({company.symbol})</div>
                <div class="text-sm text-gray-600">{company.industryName}</div>
                <div class="mt-2 space-y-1">
                  <div>ESG Score: <span class="font-semibold">
                    {company.esgScore.toFixed(1)}</span>
                  </div>
                  <div>Market Cap: <span class="font-semibold">
                    {formatMarketCap(company.marketCap)}</span>
                  </div>
                </div>
              </div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Axes labels -->
      <div class="absolute bottom-0 left-16 right-0 text-center text-sm text-gray-600">
        Market Cap (Billions USD)
      </div>
      <div class="absolute left-2 top-1/2 -rotate-90 text-sm text-gray-600 whitespace-nowrap">
        ESG Score
      </div>
    </div>
  </div>

  <!-- Statistics Panel -->
  {#if filteredData.length > 0}
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="font-semibold mb-2">Quick Stats</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div class="text-sm text-gray-600">Average ESG Score</div>
          <div class="font-semibold">
            {(filteredData.reduce((sum, co) => sum + co.esgScore, 0) / 
              filteredData.length).toFixed(1)}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Companies Shown</div>
          <div class="font-semibold">{filteredData.length}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Highest ESG Score</div>
          <div class="font-semibold">
            {Math.max(...filteredData.map(co => co.esgScore)).toFixed(1)}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Lowest ESG Score</div>
          <div class="font-semibold">
            {Math.min(...filteredData.map(co => co.esgScore)).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>