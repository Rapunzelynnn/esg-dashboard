<!-- $lib/components/ScoreComparison.svelte -->
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company } from '$lib/types';
import { appState } from '$lib/state.svelte';

interface Props {
  data?: Company[];
  expanded?: boolean;
}
let { data = [], expanded = false }: Props = $props();

// State
let hoveredCompany = $state<Company | null>(null);
let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let selectedMetric = $state<'absolute' | 'relative'>('absolute');
let showDropdown = $state(false);

// Industry data (identical const objects — copy from original)
interface IndustryInfo { name: string; shade: string; }
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
let categorizedIndustries = $derived(
  new Set(Object.values(industryCategories).flatMap(cat => cat.industries.map(i => i.name)))
);

let industries = $derived(
  [...new Set(data.map(d => d.industryName))]
    .filter(industry => categorizedIndustries.has(industry))
    .sort((a, b) => {
      const getCatForIndustry = (n: string) =>
        Object.entries(industryCategories).find(([_, cat]) => cat.industries.some(i => i.name === n))?.[0] ?? '';
      const catA = getCatForIndustry(a);
      const catB = getCatForIndustry(b);
      if (catA !== catB) return categoryOrder.indexOf(catA) - categoryOrder.indexOf(catB);
      const cat = industryCategories[catA as keyof typeof industryCategories];
      if (cat) return cat.industries.findIndex(i => i.name === a) - cat.industries.findIndex(i => i.name === b);
      return a.localeCompare(b);
    })
);

let currentCategory = $derived(
  appState.selectedCompany
    ? Object.entries(industryCategories).find(([_, cat]) =>
        cat.industries.some(i => i.name === appState.selectedCompany?.industryName)
      )?.[0]
    : null
);

let relevantIndustries = $derived(new Set<string>((() => {
  if (!appState.selectedCompany) return industries;
  if (!currentCategory) return [appState.selectedCompany.industryName];
  return industryCategories[currentCategory as keyof typeof industryCategories]
    .industries.map(i => i.name).filter(name => industries.includes(name));
})()));

let processedData = $derived(
  data.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      company.fullName.toLowerCase().includes(searchLower) ||
      company.symbol.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  })
);

let colorScale = $derived(new Map(industries.map(industry => [industry, getIndustryColor(industry)])));

let xAxisTicks = $derived(selectedMetric === 'absolute' ? [0, 20, 40, 60, 80, 100] : [-50, -25, 0, 25, 50]);
let yAxisTicks = $derived(selectedMetric === 'absolute' ? [0, 20, 40, 60, 80, 100] : [-50, -25, 0, 25, 50]);

// Sync with global company selection
$effect(() => {
  if (appState.selectedCompany) {
    const relatedInds = [...relevantIndustries];
    if (relatedInds.length > 0) selectedIndustries = new Set(relatedInds);
  }
});

// Replace onMount click-outside with $effect
$effect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (showDropdown) {
      const dropdown = document.querySelector('.industry-dropdown');
      if (!dropdown?.contains(event.target as Node)) showDropdown = false;
    }
  };
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
});

// Functions
function toggleIndustry(industry: string) {
  selectedIndustries = new Set(selectedIndustries);
  if (selectedIndustries.has(industry)) {
    if (appState.selectedCompany?.industryName === industry) return;
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

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

function getIndustryColor(industryName: string): string {
  for (const [_, cat] of Object.entries(industryCategories)) {
    const industry = cat.industries.find(i => i.name === industryName);
    if (industry) return industry.shade;
  }
  return '#94A3B8';
}

function getBubbleSize(score: number): number {
  const minSize = 6;
  const maxSize = expanded ? 32 : 24;
  if (score < 20) return minSize;
  if (score < 40) return minSize + 6;
  if (score < 60) return minSize + 12;
  if (score < 80) return minSize + 18;
  return maxSize;
}

function getTickPosition(tick: number): string {
  return selectedMetric === 'absolute' ? `${tick}%` : `${tick + 50}%`;
}

function getTickLabel(tick: number): string {
  return selectedMetric === 'relative' ? (tick > 0 ? `+${tick}%` : `${tick}%`) : tick.toString();
}

function isSelectedCompany(company: Company): boolean {
  return appState.selectedCompany?.symbol === company.symbol;
}
</script>

<div class="w-full space-y-4">
  <!-- Header Section -->
  <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
    <div class="space-y-2">
      <h2 class="text-xl font-semibold">ESG Score Components Analysis</h2>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-2">      
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search companies..."
        class="px-3 py-1 border rounded-lg"
      />
    </div>
  </div>

  <!-- Industry Filters Dropdown -->
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
      
      <!-- Dropdown button -->
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
            class="industry-dropdown absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50"
            onclick={(e) => e.stopPropagation()}
            role="menu"
            tabindex="-1"
            onkeydown={() => {}}
          >
            <div class="p-4 space-y-4">
              <input
                type="text"
                bind:value={searchTerm}
                placeholder="Search industries..."
                class="w-full px-3 py-2 border rounded-lg text-sm"
              />

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
          class="px-3 py-1 text-sm rounded-full transition-all duration-200 flex items-center space-x-2
            bg-gray-800 text-white hover:bg-gray-700
            {appState.selectedCompany?.industryName === industry ? 'ring-2 ring-blue-500' : ''}"
          onclick={() => toggleIndustry(industry)}
        >
          <div
            class="w-2 h-2 rounded-full"
            style="background-color: {colorScale.get(industry)}"
          ></div>
          <span>{industry}</span>
          <span class="text-xs ml-1">×</span>
        </button>
      {/each}
    </div>
  </div>
  <div class="relative" style="height: {expanded ? 600 : 400}px;">
    <div class="absolute inset-0">
      <!-- Main chart area with grid -->
      <div class="absolute inset-x-16 inset-y-8 border-l border-b border-gray-200">
        <!-- Grid lines -->
        {#each [20, 40, 60, 80] as tick}
          <div
            class="absolute w-full border-t border-gray-100"
            style="bottom: {tick}%"
          />
          <div
            class="absolute h-full border-l border-gray-100"
            style="left: {tick}%"
          />
        {/each}

        <!-- Data points -->
        <div class="absolute inset-0">
          {#each processedData as company}
            {@const envScore = company.esgScores.environmental.score}
            {@const socScore = company.esgScores.social.score}
            {@const govScore = company.esgScores.governance.score}
            {@const isSelected = isSelectedCompany(company)}
            
            <div 
              class="absolute" 
              style="
                left: {envScore}%;
                bottom: {socScore}%;
                transform: translate(-50%, 50%);
                z-index: {hoveredCompany === company ? 9999 : 1};
              "
            >
              <!-- Point button -->
              <button
                type="button"
                class="point rounded-full transition-all duration-200
                  {hoveredCompany === company ? 'w-4 h-4 z-20' : 'w-2 h-2 z-10'}
                  {isSelected ? 'selected-company' : ''}"
                style="
                  background-color: {colorScale.get(company.industryName)};
                  width: {getBubbleSize(govScore)}px;
                  height: {getBubbleSize(govScore)}px;
                  opacity: {appState.selectedCompany && !isSelected ? '0.6' : '1'};
                  --point-color: {colorScale.get(company.industryName)};
                  {isSelected ? `box-shadow: 0 0 0 2px white, 0 0 0 4px ${colorScale.get(company.industryName)}` : ''};
                "
                onmouseenter={() => hoveredCompany = company}
                onmouseleave={() => hoveredCompany = null}
              />


              <!-- Tooltip (hover only) -->
              {#if hoveredCompany === company}
                <div
                  class="company-tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                    border border-gray-200 rounded-lg shadow-lg p-4 w-72
                    text-left pointer-events-none bg-white"
                  style="z-index: 9999;"
                  transition:fade
                  role="tooltip"
                  aria-live="polite"
                >
                  <div class="font-bold">{company.fullName}</div>
                  <div class="text-sm text-gray-500">({company.symbol})</div>
                  <div class="text-sm text-gray-600">{company.industryName}</div>
                  <div class="mt-2 space-y-1">
                    <div>Environmental: <span class="font-semibold">{envScore.toFixed(1)}</span></div>
                    <div>Social: <span class="font-semibold">{socScore.toFixed(1)}</span></div>
                    <div>Governance: <span class="font-semibold">{govScore.toFixed(1)}</span></div>
                    <div class="text-sm text-gray-500 mt-2">
                      Beta: {company.beta.toFixed(2)}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Axis ticks and labels -->
        <div class="absolute inset-0">
          <!-- Y-axis ticks -->
          {#each yAxisTicks as tick}
            <div
              class="absolute left-0 w-full h-0 flex items-center"
              style="bottom: {getTickPosition(tick)}"
            >
              <div class="absolute -left-14 text-xs text-gray-600 w-12 text-right">
                {getTickLabel(tick)}
              </div>
              <div class="w-full border-t border-gray-100" />
            </div>
          {/each}

          <!-- X-axis ticks -->
          {#each xAxisTicks as tick}
            <div
              class="absolute bottom-0 h-full w-0 flex justify-center"
              style="left: {getTickPosition(tick)}"
            >
              <div class="absolute -bottom-6 text-xs text-gray-600 transform -translate-x-1/2">
                {getTickLabel(tick)}
              </div>
              <div class="h-full border-l border-gray-100" />
            </div>
          {/each}

          <!-- Y-axis ticks and labels -->
          <div class="absolute -left-16 inset-y-0 flex items-center">
            <div class="transform -rotate-90 text-sm text-gray-600 whitespace-nowrap">
              {#if selectedMetric === 'absolute'}
                Social Score
              {:else}
                Social Score (% vs Industry Average)
              {/if}
            </div>
          </div>
          <!-- X-axis ticks and labels  -->
          <div class="absolute -bottom-12 inset-x-0 text-center">
            <div class="text-sm text-gray-600">
              {#if selectedMetric === 'absolute'}
                Environmental Score
              {:else}
                Environmental Score (% vs Industry Average)
              {/if}
            </div>
        </div>
      </div>

    </div>
     <!-- Legend -->
      <div class="absolute right-4 top-4 bg-white/80 p-2 rounded-lg shadow-lg">
        <div class="text-sm text-gray-600 font-medium">Bubble Size</div>
        <div class="text-xs text-gray-500">= Governance Score</div>
        <div class="flex items-center mt-2 gap-3">
          <div class="flex flex-col items-center">
            <div class="w-[6px] h-[6px] rounded-full bg-gray-400"></div>
            <span class="text-xs mt-1">0-20</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-[12px] h-[12px] rounded-full bg-gray-400"></div>
            <span class="text-xs mt-1">20-40</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-[18px] h-[18px] rounded-full bg-gray-400"></div>
            <span class="text-xs mt-1">40-60</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-[24px] h-[24px] rounded-full bg-gray-400"></div>
            <span class="text-xs mt-1">60-80</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-[32px] h-[32px] rounded-full bg-gray-400"></div>
            <span class="text-xs mt-1">80-100</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Statistics Panel -->
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

<style>
.point {
  position: relative;
  transition: all 0.2s ease-in-out;
}

.point.selected-company {
  z-index: 30; /* Ensure the selected point stays above others */
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
  animation: pulse-colored 1.5s infinite; /* Faster animation */
}

.point.selected-company::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background-color: var(--point-color);
  animation: pulse-colored 1.5s infinite 0.75s; /* Second pulse with delay */
}

@keyframes pulse-colored {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;  /* Start more visible */
  }
  50% {
    transform: translate(-50%, -50%) scale(3);  /* Larger scale */
    opacity: 0.4;  /* Stay visible longer */
  }
  100% {
    transform: translate(-50%, -50%) scale(4);  /* Even larger final scale */
    opacity: 0;
  }
}

:global(.company-tooltip) {
  background-color: white !important;
  isolation: isolate;
}

/* Add these styles to properly position the axis labels */
.chart-area {
  position: relative;
  isolation: isolate;
  margin: 1rem 0;
}

/* Ensure labels don't overlap with chart content */
.axis-label {
  position: absolute;
  font-size: 0.875rem;
  color: #4B5563;
  white-space: nowrap;
}
</style>