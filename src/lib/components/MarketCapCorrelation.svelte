<!-- $lib/components/MarketCapCorrelation.svelte -->
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company, IndustryAccumulator, ProcessedCompanyData } from '$lib/types';
import { appState } from '$lib/state.svelte';

interface Props {
  data?: Company[];
  expanded?: boolean;
}
let { data = [], expanded = false }: Props = $props();

// State
let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let selectedCompany = $state<ProcessedCompanyData | null>(null);
let hoveredPoint = $state<ProcessedCompanyData | null>(null);
let viewMode = $state<'absolute' | 'relative'>('relative');
let showDropdown = $state(false);

// Industry categories and colors (identical to original — kept as const)
const categoryOrder = ['Information Technology','Communication Services','Financials','Industrials','Consumer Discretionary','Consumer Staples','Health Care','Energy','Materials','Utilities'];

const industryCategories = {
  'Information Technology': { base: '#2563EB', industries: [{ name: 'Software', shade: '#2563EB' },{ name: 'IT Services', shade: '#1D4ED8' },{ name: 'Computers & Peripherals and Office Electronics', shade: '#1E40AF' },{ name: 'Semiconductors & Semiconductor Equipment', shade: '#3B82F6' },{ name: 'Communications Equipment', shade: '#60A5FA' },{ name: 'Electronic Equipment, Instruments & Components', shade: '#2563EB' }] },
  'Communication Services': { base: '#EA580C', industries: [{ name: 'Interactive Media, Services & Home Entertainment', shade: '#EA580C' },{ name: 'Media, Movies & Entertainment', shade: '#C2410C' },{ name: 'Telecommunication Services', shade: '#9A3412' }] },
  'Financials': { base: '#059669', industries: [{ name: 'Banks', shade: '#059669' },{ name: 'Diversified Financial Services and Capital Markets', shade: '#047857' },{ name: 'Insurance', shade: '#065F46' },{ name: 'Real Estate Management & Development', shade: '#10B981' },{ name: 'Equity Real Estate Investment Trusts (REITs)', shade: '#34D399' }] },
  'Industrials': { base: '#DC2626', industries: [{ name: 'Aerospace & Defense', shade: '#DC2626' },{ name: 'Airlines', shade: '#B91C1C' },{ name: 'Building Products', shade: '#991B1B' },{ name: 'Machinery and Electrical Equipment', shade: '#EF4444' },{ name: 'Electrical Components & Equipment', shade: '#F87171' },{ name: 'Trading Companies & Distributors', shade: '#DC2626' },{ name: 'Professional Services', shade: '#B91C1C' },{ name: 'Commercial Services & Supplies', shade: '#991B1B' },{ name: 'Construction & Engineering', shade: '#EF4444' },{ name: 'Transportation and Transportation Infrastructure', shade: '#F87171' },{ name: 'Auto Components', shade: '#DC2626' }] },
  'Consumer Discretionary': { base: '#D97706', industries: [{ name: 'Automobiles', shade: '#D97706' },{ name: 'Retailing', shade: '#B45309' },{ name: 'Restaurants & Leisure Facilities', shade: '#92400E' },{ name: 'Hotels, Resorts & Cruise Lines', shade: '#F59E0B' },{ name: 'Leisure Equipment & Products and Consumer Electronics', shade: '#FBBF24' },{ name: 'Homebuilding', shade: '#D97706' },{ name: 'Textiles, Apparel & Luxury Goods', shade: '#B45309' },{ name: 'Casinos & Gaming', shade: '#92400E' },{ name: 'Household Durables', shade: '#F59E0B' }] },
  'Consumer Staples': { base: '#DB2777', industries: [{ name: 'Food Products', shade: '#DB2777' },{ name: 'Food & Staples Retailing', shade: '#BE185D' },{ name: 'Household Products', shade: '#9D174D' },{ name: 'Personal Products', shade: '#EC4899' },{ name: 'Beverages', shade: '#F472B6' },{ name: 'Tobacco', shade: '#DB2777' }] },
  'Health Care': { base: '#0284C7', industries: [{ name: 'Biotechnology', shade: '#0284C7' },{ name: 'Pharmaceuticals', shade: '#0369A1' },{ name: 'Health Care Equipment & Supplies', shade: '#075985' },{ name: 'Health Care Providers & Services', shade: '#0EA5E9' },{ name: 'Life Sciences Tools & Services', shade: '#38BDF8' }] },
  'Energy': { base: '#0D9488', industries: [{ name: 'Oil & Gas Upstream & Integrated', shade: '#0D9488' },{ name: 'Oil & Gas Storage & Transportation', shade: '#0F766E' },{ name: 'Oil & Gas Refining & Marketing', shade: '#115E59' },{ name: 'Energy Equipment & Services', shade: '#14B8A6' }] },
  'Materials': { base: '#65A30D', industries: [{ name: 'Chemicals', shade: '#65A30D' },{ name: 'Construction Materials', shade: '#4D7C0F' },{ name: 'Metals & Mining', shade: '#3F6212' },{ name: 'Containers & Packaging', shade: '#84CC16' },{ name: 'Steel', shade: '#A3E635' }] },
  'Utilities': { base: '#CA8A04', industries: [{ name: 'Electric Utilities', shade: '#CA8A04' },{ name: 'Gas Utilities', shade: '#A16207' },{ name: 'Multi and Water Utilities', shade: '#854D0E' }] }
};

// Derived
let industryStats = $derived(
  data.reduce((acc: IndustryAccumulator, company) => {
    if (!acc[company.industryName]) {
      acc[company.industryName] = { companies: [], avgESG: 0, avgMarketCap: 0, stdDevESG: 0 };
    }
    acc[company.industryName].companies.push(company);
    const stats = acc[company.industryName];
    const validCompanies = stats.companies.filter(c => c.esgScores?.total > 0 && !isNaN(c.esgScores.total));
    if (validCompanies.length > 0) {
      stats.avgESG = validCompanies.reduce((sum, c) => sum + c.esgScores.total, 0) / validCompanies.length;
      const squaredDiffs = validCompanies.map(c => Math.pow(c.esgScores.total - stats.avgESG, 2));
      stats.stdDevESG = Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / validCompanies.length);
      stats.avgMarketCap = validCompanies.reduce((sum, c) => sum + c.marketCap, 0) / validCompanies.length;
    }
    return acc;
  }, {} as IndustryAccumulator)
);

let marketCapData = $derived(
  data.map(company => {
    const stats = industryStats[company.industryName];
    const avgESG = stats?.avgESG || 0;
    const stdDevESG = stats?.stdDevESG || 1;
    const relativeESG = stdDevESG !== 0 ? (company.esgScores.total - avgESG) / stdDevESG : 0;
    return { ...company, relativeESG, isOutlier: Math.abs(relativeESG) > 2, industryAvg: avgESG, industryStdDev: stdDevESG };
  }).filter(d => d.marketCap > 0 && d.esgScores.total > 0)
);

let filteredData = $derived(
  marketCapData.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      company.symbol.toLowerCase().includes(searchLower) ||
      company.fullName.toLowerCase().includes(searchLower) ||
      company.industryName.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  })
);

let height = $derived(expanded ? 600 : 400);
let maxMarketCap = $derived(Math.max(...filteredData.map(d => d.marketCap)));
let maxScore = $derived(viewMode === 'absolute' ? 100 : 4);
let minScore = $derived(viewMode === 'absolute' ? 0 : -4);

let industries = $derived(
  [...new Set(marketCapData.map(d => d.industryName))].sort((a, b) => {
    const getCatForIndustry = (n: string) =>
      Object.entries(industryCategories).find(([_, cat]) => cat.industries.some(i => i.name === n))?.[0] ?? 'Uncategorized';
    const catA = getCatForIndustry(a);
    const catB = getCatForIndustry(b);
    if (catA !== catB) return categoryOrder.indexOf(catA) - categoryOrder.indexOf(catB);
    if (catA !== 'Uncategorized') {
      const cat = industryCategories[catA as keyof typeof industryCategories];
      if (cat) return cat.industries.findIndex(i => i.name === a) - cat.industries.findIndex(i => i.name === b);
    }
    return a.localeCompare(b);
  })
);

let colorScale = $derived(new Map(industries.map(industry => [industry, getIndustryColor(industry)])));

let relevantIndustries = $derived(new Set<string>((() => {
  if (!appState.selectedCompany) return [];
  const selectedCategory = Object.entries(industryCategories)
    .find(([_, cat]) => cat.industries.some(i => i.name === appState.selectedCompany!.industryName))?.[0];
  if (!selectedCategory) return [appState.selectedCompany.industryName];
  return industryCategories[selectedCategory as keyof typeof industryCategories].industries.map(i => i.name);
})()));

let xAxisTicks = $derived((() => {
  const maxValue = maxMarketCap / 1_000_000_000;
  if (maxValue <= 0) return [];
  let interval = maxValue > 1000 ? 200 : maxValue > 500 ? 100 : maxValue > 200 ? 50 : 20;
  const ticks = [];
  for (let i = 0; i <= maxValue; i += interval) ticks.push(i);
  return ticks;
})());

// Sync selected industries with global company
$effect(() => {
  if (appState.selectedCompany && industries.length > 0) {
    selectedIndustries = new Set([...relevantIndustries]);
  }
});

// Functions
function toggleIndustry(industry: string) {
  selectedIndustries = new Set(selectedIndustries);
  if (selectedIndustries.has(industry)) {
    if (industry === appState.selectedCompany?.industryName) return;
    selectedIndustries.delete(industry);
  } else {
    selectedIndustries.add(industry);
  }
}

function selectAll() { selectedIndustries = new Set(industries); }

function clearAll() {
  if (appState.selectedCompany) {
    selectedIndustries = new Set([appState.selectedCompany.industryName]);
  } else {
    selectedIndustries = new Set();
  }
}

function formatMarketCap(value: number): string {
  if (!value || isNaN(value)) return '$0.00';
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)} billion`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)} million`;
  return `$${value.toFixed(2)}`;
}

function handleChartClick() { selectedCompany = null; }

function handlePointClick(company: ProcessedCompanyData, event: Event) {
  event.stopPropagation();
  selectedCompany = selectedCompany === company ? null : company;
}

function getIndustryColor(industryName: string): string {
  for (const [_, cat] of Object.entries(industryCategories)) {
    const industry = cat.industries.find(i => i.name === industryName);
    if (industry) return industry.shade;
  }
  return '#94A3B8';
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

function formatXAxisLabel(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}T` : `${value}B`;
}
</script>

<svelte:window onclick={() => showDropdown = false} />


<div class="w-full space-y-4">
  <!-- Header and Controls -->
  <div class="flex flex-row justify-between items-center">
    <div class="flex items-center gap-4">
      <h2 class="text-xl font-semibold">ESG Score vs Market Cap</h2>
      
      <!-- View Mode Toggle -->
      <div class="flex space-x-2">
        <button
          class="px-3 py-1 rounded-lg transition-all duration-200 {viewMode === 'absolute' ? 'bg-blue-500 text-white' : 'bg-gray-100'}"
          onclick={() => viewMode = 'absolute'}
        >
          Absolute Scores
        </button>
        <button
          class="px-3 py-1 rounded-lg transition-all duration-200 {viewMode === 'relative' ? 'bg-blue-500 text-white' : 'bg-gray-100'}"
          onclick={() => viewMode = 'relative'}
        >
          Industry-Relative
        </button>
      </div>
    </div>
    
    <!-- Search -->
    <div class="w-[200px]">
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search company name, symbol, or industry..."
        class="w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>

  <!-- Industry Filters -->
  <div class="flex flex-col space-y-2">
    <!-- Control buttons and dropdown -->
    <div class="flex flex-wrap gap-2 items-center">
      <button 
        class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
        onclick={selectAll}
      >
        Select All
      </button>
      <button
        class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
        onclick={clearAll}
      >
        Clear All
      </button>
      
      <!-- Add the dropdown here -->
      <div class="relative">
        <button
          class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center gap-2"
          onclick={handleDropdownClick}
        >
          <span>More Industries</span>
          <span class="text-xs">▼</span>
        </button>

        {#if showDropdown}
          <div
            class="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50"
            role="menu"
            tabindex="-1"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
          >
            <div class="p-4 space-y-4">
              <!-- Search input -->
              <input
                type="text"
                bind:value={searchTerm}
                placeholder="Search industries..."
                class="w-full px-3 py-2 border rounded-lg text-sm"
              />

              <!-- Group industries by category -->
              {#each categoryOrder as category}
                {@const categoryIndustries = industries.filter(i => 
                  Object.entries(industryCategories).find(([cat, _]) => 
                    cat === category
                  )?.[1].industries.some(ci => ci.name === i)
                )}
                
                {#if categoryIndustries.length > 0}
                  <div class="space-y-2">
                    <div class="text-sm font-semibold text-gray-500">{category}</div>
                    <div class="space-y-1 pl-2">
                      {#each categoryIndustries as industry}
                        {#if industry.toLowerCase().includes(searchTerm.toLowerCase())}
                          <button
                            class="w-full px-2 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                            onclick={() => toggleIndustry(industry)}
                          >
                            <div class="flex items-center flex-1">
                              <div
                                class="w-2 h-2 rounded-full mr-2"
                                style="background-color: {colorScale.get(industry)}"
                              ></div>
                              <span>{industry}</span>
                            </div>
                            {#if selectedIndustries.has(industry)}
                              <span class="text-blue-500">✓</span>
                            {/if}
                          </button>
                        {/if}
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

  <!-- Selected industries display -->
  <div class="flex flex-wrap gap-2">
    {#each [...selectedIndustries] as industry}
      <button
        class="px-3 py-1 text-sm rounded-full transition-all duration-200
          bg-gray-800 text-white"
        onclick={() => toggleIndustry(industry)}
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
</div>



  <!-- Chart container -->
  <section
    class="relative chart-area ml-12"
    style="height: {height}px;"
    aria-label="ESG Score vs Market Cap Chart"
  >
    <div
      class="absolute inset-0 w-full h-full transparent-button"
      role="button"
      tabindex="0"
      onclick={handleChartClick}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') handleChartClick();
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
                >
                  {value}
                </span>
              {/each}
            {:else}
              {#each [-4, -2, 0, 2, 4] as value}
                <span
                  class="absolute right-0 text-sm text-gray-600 pr-2"
                  style="bottom: {((value - minScore) / (maxScore - minScore)) * 100}%"
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
        >
          {viewMode === 'absolute' ? 'ESG Score' : 'ESG Score (Standard Deviations from Industry Mean)'}
        </div>

        <!-- Add X-axis ticks here, before the X-axis label -->
        <div
          class="absolute left-16 right-8 bottom-8"
          role="group"
          aria-label="X-axis ticks"
        >
          {#each xAxisTicks as tick}
            <div
              class="absolute h-8"
              style="left: {(tick * 1_000_000_000 / maxMarketCap) * 100}%;"
            >
              <div class="h-2 w-px bg-gray-200"></div>
              <div class="text-xs text-gray-600 mt-1 -translate-x-1/2">
                {formatXAxisLabel(tick)}
              </div>
            </div>
          {/each}
        </div>

        <!-- X-axis label with adjusted bottom position -->
        <div
          class="absolute bottom-[-24px] left-16 right-0 text-center text-sm text-gray-600"
        >
          Market Cap (Billions USD)
        </div>


      <!-- Grid lines -->
      <div class="absolute left-16 right-0 top-0 bottom-8" aria-hidden="true">
        {#if viewMode === 'absolute'}
          {#each [20, 40, 60, 80] as value}
            <div
              class="absolute w-full border-t border-gray-200"
              style="bottom: {(value / maxScore) * 100}%"
            ></div>
          {/each}
        {:else}
          {#each [-2, 0, 2] as value}
            <div
              class="absolute w-full border-t {value === 0 ? 'border-gray-400' : 'border-gray-200'}"
              style="bottom: {((value - minScore) / (maxScore - minScore)) * 100}%"
            ></div>
          {/each}
        {/if}
      </div>

      <!-- Data points -->
      <div class="absolute left-16 right-8 top-8 bottom-8" role="group" aria-label="Company data points" style="z-index: 1;">
        {#each filteredData as company}
          {@const yValue = viewMode === 'absolute' ? company.esgScores.total : company.relativeESG}
          {@const isSelected = company.symbol === appState.selectedCompany?.symbol}
          
          <div class="absolute" style="
            left: {(company.marketCap / maxMarketCap) * 100}%;
            bottom: {((yValue - minScore) / (maxScore - minScore)) * 100}%;
            transform: translate(-50%, -50%);
            z-index: {hoveredPoint === company || selectedCompany === company ? 9999 : 1};
          ">
            <!-- Point button -->
            <button
              type="button"
              aria-label="{company.fullName} ({company.symbol})"
              class="point rounded-full transition-all duration-200
                {hoveredPoint === company || selectedCompany === company ? 'w-5 h-5 z-20' : 'w-2.5 h-2.5 z-10'}
                {company.isOutlier ? 'ring-2 ring-red-500' : ''}
                {isSelected ? 'selected-company' : ''}"
              style="
                background-color: {colorScale.get(company.industryName)};
                opacity: {appState.selectedCompany && !isSelected ? '0.6' : '1'};
                --point-color: {colorScale.get(company.industryName)};
                {isSelected ? `box-shadow: 0 0 0 2px white, 0 0 0 4px ${colorScale.get(company.industryName)}` : ''};
              "
              onmouseenter={() => hoveredPoint = company}
              onmouseleave={() => hoveredPoint = null}
              onclick={(e) => handlePointClick(company, e)}
            ></button>
            <!-- Tooltip -->
            {#if hoveredPoint === company || selectedCompany === company}
              <div
                class="company-tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                  border border-gray-200 rounded-lg shadow-lg p-4 w-72
                  text-left pointer-events-none bg-white"
                style="z-index: 9999;"
                transition:fade
                role="tooltip"
                aria-live="polite"
              >
                <div class="tooltip-content">
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
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

  <!-- Statistics Panel -->
  {#if filteredData.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Average ESG Score</div>
        <div class="font-semibold">
          {(filteredData.reduce((sum, co) => sum + co.esgScores.total, 0) / 
            filteredData.length).toFixed(1)}
        </div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Companies Shown</div>
        <div class="font-semibold">{filteredData.length}</div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Outliers</div>
        <div class="font-semibold">
          {filteredData.filter(co => co.isOutlier).length}
        </div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Industry Coverage</div>
        <div class="font-semibold">
          {selectedIndustries.size || industries.length} / {industries.length}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
.point {
  position: relative;
  transform-origin: center center;
  transition: all 0.2s ease-in-out;
}

.point.selected-company::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background-color: var(--point-color);
  animation: pulse-colored 2s infinite;
}

@keyframes pulse-colored {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  70% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

:global(.company-tooltip) {
  background-color: white !important;
  isolation: isolate;
}

.chart-area {
  position: relative;
  isolation: isolate;
}
</style>