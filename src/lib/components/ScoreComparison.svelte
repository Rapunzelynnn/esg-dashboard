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

const categoryOrder = [
  'Information Technology',
  'Communication Services',
  'Financials',
  'Industrials',
  'Consumer Discretionary',
  'Consumer Staples',
  'Health Care',
  'Energy',
  'Materials',
  'Utilities'
];

// Industry category mapping with color schemes
const industryCategories = {
  'Information Technology': {
    base: '#2563EB', // blue base
    industries: [
      { name: 'Software', shade: '#2563EB' },         // blue-600
      { name: 'IT Services', shade: '#1D4ED8' },      // blue-700
      { name: 'Computers & Peripherals and Office Electronics', shade: '#1E40AF' },  // blue-800
      { name: 'Semiconductors & Semiconductor Equipment', shade: '#3B82F6' },       // blue-500
      { name: 'Communications Equipment', shade: '#60A5FA' },      // blue-400
      { name: 'Electronic Equipment, Instruments & Components', shade: '#2563EB' }   // blue-600
    ]
  },
  'Communication Services': {
    base: '#EA580C', // orange base
    industries: [
      { name: 'Interactive Media, Services & Home Entertainment', shade: '#EA580C' }, // orange-600
      { name: 'Media, Movies & Entertainment', shade: '#C2410C' },                    // orange-700
      { name: 'Telecommunication Services', shade: '#9A3412' }                        // orange-800
    ]
  },
  'Financials': {
    base: '#059669', // emerald base
    industries: [
      { name: 'Banks', shade: '#059669' },                // emerald-600
      { name: 'Diversified Financial Services and Capital Markets', shade: '#047857' }, // emerald-700
      { name: 'Insurance', shade: '#065F46' },            // emerald-800
      { name: 'Real Estate Management & Development', shade: '#10B981' },  // emerald-500
      { name: 'Equity Real Estate Investment Trusts (REITs)', shade: '#34D399' }  // emerald-400
    ]
  },
  'Industrials': {
    base: '#DC2626', // red base
    industries: [
      { name: 'Aerospace & Defense', shade: '#DC2626' },        // red-600
      { name: 'Airlines', shade: '#B91C1C' },                   // red-700
      { name: 'Building Products', shade: '#991B1B' },          // red-800
      { name: 'Machinery and Electrical Equipment', shade: '#EF4444' },    // red-500
      { name: 'Electrical Components & Equipment', shade: '#F87171' },     // red-400
      { name: 'Trading Companies & Distributors', shade: '#DC2626' },      // red-600
      { name: 'Professional Services', shade: '#B91C1C' },                 // red-700
      { name: 'Commercial Services & Supplies', shade: '#991B1B' },        // red-800
      { name: 'Construction & Engineering', shade: '#EF4444' },            // red-500
      { name: 'Transportation and Transportation Infrastructure', shade: '#F87171' }, // red-400
      { name: 'Auto Components', shade: '#DC2626' }                        // red-600
    ]
  },
  'Consumer Discretionary': {
    base: '#D97706', // amber base
    industries: [
      { name: 'Automobiles', shade: '#D97706' },        // amber-600
      { name: 'Retailing', shade: '#B45309' },          // amber-700
      { name: 'Restaurants & Leisure Facilities', shade: '#92400E' },  // amber-800
      { name: 'Hotels, Resorts & Cruise Lines', shade: '#F59E0B' },    // amber-500
      { name: 'Leisure Equipment & Products and Consumer Electronics', shade: '#FBBF24' }, // amber-400
      { name: 'Homebuilding', shade: '#D97706' },        // amber-600
      { name: 'Textiles, Apparel & Luxury Goods', shade: '#B45309' },  // amber-700
      { name: 'Casinos & Gaming', shade: '#92400E' },    // amber-800
      { name: 'Household Durables', shade: '#F59E0B' }   // amber-500
    ]
  },
  'Consumer Staples': {
    base: '#DB2777', // pink base
    industries: [
      { name: 'Food Products', shade: '#DB2777' },          // pink-600
      { name: 'Food & Staples Retailing', shade: '#BE185D' }, // pink-700
      { name: 'Household Products', shade: '#9D174D' },     // pink-800
      { name: 'Personal Products', shade: '#EC4899' },      // pink-500
      { name: 'Beverages', shade: '#F472B6' },             // pink-400
      { name: 'Tobacco', shade: '#DB2777' }                // pink-600
    ]
  },
  'Health Care': {
    base: '#0284C7', // sky blue base
    industries: [
      { name: 'Biotechnology', shade: '#0284C7' },        // sky-600
      { name: 'Pharmaceuticals', shade: '#0369A1' },      // sky-700
      { name: 'Health Care Equipment & Supplies', shade: '#075985' },  // sky-800
      { name: 'Health Care Providers & Services', shade: '#0EA5E9' },  // sky-500
      { name: 'Life Sciences Tools & Services', shade: '#38BDF8' }     // sky-400
    ]
  },
  'Energy': {
    base: '#0D9488', // teal base
    industries: [
      { name: 'Oil & Gas Upstream & Integrated', shade: '#0D9488' },  // teal-600
      { name: 'Oil & Gas Storage & Transportation', shade: '#0F766E' }, // teal-700
      { name: 'Oil & Gas Refining & Marketing', shade: '#115E59' },   // teal-800
      { name: 'Energy Equipment & Services', shade: '#14B8A6' }       // teal-500
    ]
  },
  'Materials': {
    base: '#65A30D', // lime base
    industries: [
      { name: 'Chemicals', shade: '#65A30D' },           // lime-600
      { name: 'Construction Materials', shade: '#4D7C0F' }, // lime-700
      { name: 'Metals & Mining', shade: '#3F6212' },     // lime-800
      { name: 'Containers & Packaging', shade: '#84CC16' }, // lime-500
      { name: 'Steel', shade: '#A3E635' }               // lime-400
    ]
  },
  'Utilities': {
    base: '#CA8A04', // yellow base
    industries: [
      { name: 'Electric Utilities', shade: '#CA8A04' },         // yellow-600
      { name: 'Gas Utilities', shade: '#A16207' },              // yellow-700
      { name: 'Multi and Water Utilities', shade: '#854D0E' }   // yellow-800
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
  // Define larger base sizes with more dramatic differences
  const minSize = 6;    // Smallest size
  const maxSize = expanded ? 32 : 24;  // Increased maximum for better contrast
  
  // Calculate size range with more dramatic steps
  if (score < 20) return minSize;                   // 6px
  if (score < 40) return minSize + 6;              // 12px
  if (score < 60) return minSize + 12;             // 18px
  if (score < 80) return minSize + 18;             // 24px
  return maxSize;                                  // 32px/24px
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

// Add helper functions for coordinate calculations
function getXPosition(score: number): string {
  // Ensure the position stays within 0-100% of the available space
  const position = Math.max(0, Math.min(100, score));
  return `${position}%`;
}

function getYPosition(score: number): string {
  // Ensure the position stays within 0-100% of the available space
  const position = Math.max(0, Math.min(100, score));
  return `${position}%`;
}

function getBubbleTransform(isSelected: boolean): string {
  const baseTransform = 'translate(-50%, 50%)';
  const scale = isSelected ? 'scale(1.5)' : 'scale(1)';
  return `${baseTransform} ${scale}`;
}

function getDataPointPosition(xScore: number, yScore: number): { x: string; y: string } {
  // Normalize the scores to fit within the grid (0-100%)
  const x = Math.max(0, Math.min(100, xScore));
  const y = Math.max(0, Math.min(100, yScore));
  
  return {
    x: `${x}%`,
    y: `${y}%`
  };
}
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
                  opacity: {$globalSelectedCompany && !isSelected ? '0.6' : '1'};
                  --point-color: {colorScale.get(company.industryName)};
                  {isSelected ? `box-shadow: 0 0 0 2px white, 0 0 0 4px ${colorScale.get(company.industryName)}` : ''};
                "
                on:mouseenter={() => hoveredCompany = company}
                on:mouseleave={() => hoveredCompany = null}
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
                    {#if selectedMetric === 'relative'}
                      <div>Industry Average ESG: <span class="font-semibold">
                        {(industryAverages[company.industryName].envSum / 
                          industryAverages[company.industryName].count).toFixed(1)}
                      </span></div>
                    {/if}
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