<!-- $lib/components/ScoreComparison.svelte -->
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company } from '$lib/types';
import { selectedCompany as globalSelectedCompany } from '$lib/stores';
import { onMount } from 'svelte';

export let data: Company[] = [];
export let expanded = false;

let hoveredCompany: Company | null = null;
let selectedIndustries = new Set<string>();
let searchTerm = '';
let selectedMetric: 'absolute' | 'relative' = 'absolute';
let showDropdown = false;

// Process data for visualization
$: processedData = data.filter(company => {
  const searchLower = searchTerm.toLowerCase();
  const matchesSearch = !searchTerm || 
    company.fullName.toLowerCase().includes(searchLower) ||
    company.symbol.toLowerCase().includes(searchLower);
    
  // Simplified industry matching logic
  const matchesIndustry = selectedIndustries.size === 0 || 
    selectedIndustries.has(company.industryName);
  
  return matchesSearch && matchesIndustry;
});

// Get current company's category and related industries
$: currentCategory = $globalSelectedCompany ? 
  Object.entries(industryCategories).find(([_, category]) => 
    category.industries.some(i => i.name === $globalSelectedCompany?.industryName)
  )?.[0] : null;

$: relatedIndustries = new Set<string>((() => {
  if (!$globalSelectedCompany) return [];
  
  if (!currentCategory) return [$globalSelectedCompany.industryName];

  return industryCategories[currentCategory as keyof typeof industryCategories]
    .industries
    .map(i => i.name)
    .filter(name => industries.includes(name));
})());

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


// Add industry categorization types and data
interface IndustryInfo {
  name: string;
  shade: string;
}

interface CategoryInfo {
  base: string;
  industries: IndustryInfo[];
}

// Add categoryOrder constant (if not already present)
const categoryOrder = [
  'Technology & Communications',
  'Financial Services',
  'Industrial & Manufacturing',
  'Consumer Products & Services',
  'Energy & Utilities',
  'Healthcare & Life Sciences',
  'Materials'
];

// Industry category mapping with comprehensive coverage
const industryCategories = {
  'Technology & Communications': {
    base: '#4F46E5', // indigo base
    industries: [
      { name: 'Software', shade: '#4F46E5' },
      { name: 'IT Services', shade: '#6366F1' },
      { name: 'Computers & Peripherals and Office Electronics', shade: '#818CF8' },
      { name: 'Semiconductors & Semiconductor Equipment', shade: '#A5B4FC' },
      { name: 'Electronic Equipment, Instruments & Components', shade: '#8B5CF6' },
      { name: 'Communications Equipment', shade: '#7C3AED' },
      { name: 'Telecommunication Services', shade: '#6D28D9' },
      { name: 'Interactive Media, Services & Home Entertainment', shade: '#5B21B6' }
    ]
  },
  'Financial Services': {
    base: '#F59E0B', // amber base
    industries: [
      { name: 'Banks', shade: '#F59E0B' },
      { name: 'Insurance', shade: '#D97706' },
      { name: 'Diversified Financial Services and Capital Markets', shade: '#B45309' },
      { name: 'Equity Real Estate Investment Trusts (REITs)', shade: '#92400E' },
      { name: 'Real Estate Management & Development', shade: '#78350F' },
      { name: 'Trading Companies & Distributors', shade: '#B45309' }
    ]
  },
  'Industrial & Manufacturing': {
    base: '#EF4444', // red base
    industries: [
      { name: 'Aerospace & Defense', shade: '#EF4444' },
      { name: 'Machinery and Electrical Equipment', shade: '#F87171' },
      { name: 'Transportation and Transportation Infrastructure', shade: '#FCA5A5' },
      { name: 'Construction & Engineering', shade: '#FECACA' },
      { name: 'Building Products', shade: '#FEE2E2' },
      { name: 'Construction Materials', shade: '#FEF2F2' },
      { name: 'Containers & Packaging', shade: '#FFF1F2' },
      { name: 'Electrical Components & Equipment', shade: '#FFE4E6' }
    ]
  },
  'Consumer Products & Services': {
    base: '#10B981', // emerald base
    industries: [
      { name: 'Textiles, Apparel & Luxury Goods', shade: '#059669' },
      { name: 'Hotels, Resorts & Cruise Lines', shade: '#10B981' },
      { name: 'Food & Staples Retailing', shade: '#047857' },
      { name: 'Food Products', shade: '#065F46' },
      { name: 'Beverages', shade: '#064E3B' },
      { name: 'Restaurants & Leisure Facilities', shade: '#047857' },
      { name: 'Media, Movies & Entertainment', shade: '#059669' },
      { name: 'Retailing', shade: '#10B981' }
    ]
  },
  'Energy & Utilities': {
    base: '#8B5CF6', // purple base
    industries: [
      { name: 'Electric Utilities', shade: '#8B5CF6' },
      { name: 'Multi and Water Utilities', shade: '#A78BFA' },
      { name: 'Gas Utilities', shade: '#C4B5FD' },
      { name: 'Oil & Gas Storage & Transportation', shade: '#DDD6FE' },
      { name: 'Oil & Gas Refining & Marketing', shade: '#EDE9FE' },
      { name: 'Oil & Gas Upstream & Integrated', shade: '#F5F3FF' },
      { name: 'Energy Equipment & Services', shade: '#FAF5FF' }
    ]
  },
  'Healthcare & Life Sciences': {
    base: '#EC4899', // pink base
    industries: [
      { name: 'Health Care Equipment & Supplies', shade: '#EC4899' },
      { name: 'Health Care Providers & Services', shade: '#F472B6' },
      { name: 'Life Sciences Tools & Services', shade: '#F9A8D4' },
      { name: 'Biotechnology', shade: '#FBCFE8' },
      { name: 'Pharmaceuticals', shade: '#FCE7F3' },
      { name: 'Personal Products', shade: '#FDF2F8' }
    ]
  },
  'Materials': {
    base: '#2DD4BF', // teal base
    industries: [
      { name: 'Chemicals', shade: '#2DD4BF' },
      { name: 'Metals & Mining', shade: '#5EEAD4' },
      { name: 'Steel', shade: '#99F6E4' },
      { name: 'Casinos & Gaming', shade: '#B9F2E5' },
      { name: 'Commercial Services & Supplies', shade: '#CCFBF1' }
    ]
  }
};

// Get categorized industries
$: categorizedIndustries = new Set(
  Object.values(industryCategories).flatMap(category => 
    category.industries.map(industry => industry.name)
  )
);

// Filter out uncategorized industries and sort them
$: industries = [...new Set(data.map(d => d.industryName))]
  .filter(industry => categorizedIndustries.has(industry))
  .sort((a, b) => {
    const getCategoryForIndustry = (industryName: string): string => {
      return Object.entries(industryCategories).find(([_, category]) => 
        category.industries.some(i => i.name === industryName)
      )?.[0] ?? '';
    };

    const categoryA = getCategoryForIndustry(a);
    const categoryB = getCategoryForIndustry(b);

    if (categoryA !== categoryB) {
      return categoryOrder.indexOf(categoryA) - categoryOrder.indexOf(categoryB);
    }

    const category = industryCategories[categoryA as keyof typeof industryCategories];
    if (category) {
      const indexA = category.industries.findIndex(i => i.name === a);
      const indexB = category.industries.findIndex(i => i.name === b);
      return indexA - indexB;
    }

    return a.localeCompare(b);
  });

// Fix relevant industries calculation
$: relevantIndustries = new Set<string>((() => {
  if (!$globalSelectedCompany) return industries;
  
  const selectedCategory = Object.entries(industryCategories).find(([_, category]) => 
    category.industries.some(i => i.name === $globalSelectedCompany.industryName)
  )?.[0];

  if (!selectedCategory) return new Set([$globalSelectedCompany.industryName]);

  return industryCategories[selectedCategory as keyof typeof industryCategories]
    .industries.map(i => i.name)
    .filter(name => industries.includes(name));
})());

// Helper Function
// Fix industry selection functions
function toggleIndustry(industry: string) {
  selectedIndustries = new Set(selectedIndustries);
  if (selectedIndustries.has(industry)) {
    // Don't allow deselecting the current company's industry
    if ($globalSelectedCompany?.industryName === industry) return;
    selectedIndustries.delete(industry);
  } else {
    selectedIndustries.add(industry);
  }
}

function selectAll() {
  selectedIndustries = new Set(industries);
}

function clearAll() {
  if ($globalSelectedCompany) {
    selectedIndustries = new Set([$globalSelectedCompany.industryName]);
  } else {
    selectedIndustries = new Set();
  }
}



function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

// Update color scale to only use categorized colors
function getIndustryColor(industryName: string): string {
  for (const [_, category] of Object.entries(industryCategories)) {
    const industry = category.industries.find(i => i.name === industryName);
    if (industry) {
      return industry.shade;
    }
  }
  return '#94A3B8';
}

$: colorScale = new Map(industries.map(industry => [
  industry,
  getIndustryColor(industry)
]));



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
// Update isSelectedCompany function
function isSelectedCompany(company: Company): boolean {
  return $globalSelectedCompany?.symbol === company.symbol;
}

// Initialize selected industries when component mounts or company changes
$: if ($globalSelectedCompany) {
  const relatedInds = [...relevantIndustries];
  if (relatedInds.length > 0) {
    selectedIndustries = new Set(relatedInds);
  }
}

// Get visible industries for the dropdown
$: visibleIndustries = $globalSelectedCompany 
  ? [...relatedIndustries]
  : industries;

// Update industry filter based on search
$: filteredIndustries = visibleIndustries
  .filter(industry => industry.toLowerCase().includes(searchTerm.toLowerCase()));


// // Add click outside handler to close dropdown
// function handleClickOutside(event: MouseEvent) {
//   if (showDropdown) {
//     showDropdown = false;
//   }
// }

onMount(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (showDropdown) {
      const dropdown = document.querySelector('.industry-dropdown');
      if (!dropdown?.contains(event.target as Node)) {
        showDropdown = false;
      }
    }
  };

  document.addEventListener('click', handleClickOutside);
  return () => {
    document.removeEventListener('click', handleClickOutside);
  };
});
</script>

<div class="w-full space-y-4">
  <!-- Header Section -->
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

  <!-- Industry Filters Dropdown -->
  <div class="flex flex-col space-y-2">
    <!-- Control buttons and dropdown -->
    <div class="flex flex-wrap gap-2 items-center">
      <button 
        class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
        on:click={selectAll}
      >
        Select All
      </button>
      <button 
        class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
        on:click={clearAll}
      >
        Clear All
      </button>
      
      <!-- Dropdown button -->
      <div class="relative">
        <button
          class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center gap-2"
          on:click|stopPropagation={handleDropdownClick}
        >
          <span>More Industries</span>
          <span class="text-xs">▼</span>
        </button>

        {#if showDropdown}
          <div 
            class="industry-dropdown absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50"
            on:click|stopPropagation={() => {}}
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
                            on:click={() => toggleIndustry(industry)}
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
            {$globalSelectedCompany?.industryName === industry ? 'ring-2 ring-blue-500' : ''}"
          on:click={() => toggleIndustry(industry)}
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
      <!-- Axes and Grid -->
      <div class="absolute inset-x-16 inset-y-8 border-l border-b border-gray-200">
        <!-- Y-axis ticks and labels -->
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

        <!-- X-axis ticks and labels -->
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
        
        <!-- Data points -->
        <div class="absolute left-16 right-8 top-8 bottom-8" role="group" aria-label="Company data points">
          {#each processedData as company}
            {@const industryAvg = industryAverages[company.industryName]}
            {@const envScore = selectedMetric === 'absolute' 
              ? company.esgScores.environmental.score 
              : getRelativeScore(company.esgScores.environmental.score, industryAvg.envSum / industryAvg.count)}
            {@const socScore = selectedMetric === 'absolute' 
              ? company.esgScores.social.score 
              : getRelativeScore(company.esgScores.social.score, industryAvg.socSum / industryAvg.count)}
            {@const govScore = selectedMetric === 'absolute' 
              ? company.esgScores.governance.score 
              : getRelativeScore(company.esgScores.governance.score, industryAvg.govSum / industryAvg.count)}

            <button
              class="absolute rounded-full transition-all duration-200"
              style="
                left: {selectedMetric === 'absolute' ? envScore : (envScore + 50)}%;
                bottom: {selectedMetric === 'absolute' ? socScore : (socScore + 50)}%;
                width: {getBubbleSize(company.esgScores.governance.score)}px;
                height: {getBubbleSize(company.esgScores.governance.score)}px;
                background-color: {colorScale.get(company.industryName)};
                transform: translate(-50%, -50%) {isSelectedCompany(company) ? 'scale(1.1)' : 'scale(1)'};
                opacity: {$globalSelectedCompany && !isSelectedCompany(company) ? 0.3 : 0.7};
                box-shadow: {isSelectedCompany(company) ? '0 0 0 2px white, 0 0 0 4px #3B82F6' : 'none'};
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
                    <div>
                      Environmental: 
                      <span class="font-semibold">
                        {formatScore(company.esgScores.environmental.score)}
                      </span>
                      {#if selectedMetric === 'relative'}
                        <span class="text-sm text-gray-500">
                          ({formatScore(envScore, true)} vs industry)
                        </span>
                      {/if}
                    </div>
                    <div>
                      Social: 
                      <span class="font-semibold">
                        {formatScore(company.esgScores.social.score)}
                      </span>
                      {#if selectedMetric === 'relative'}
                        <span class="text-sm text-gray-500">
                          ({formatScore(socScore, true)} vs industry)
                        </span>
                      {/if}
                    </div>
                    <div>
                      Governance: 
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
      </div>

      <!-- Axis Labels -->
      <div class="absolute bottom-0 left-0 right-0 flex flex-col items-center">
        <div class="h-16"></div>
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

      <!-- Legend -->
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