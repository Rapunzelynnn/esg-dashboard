<!-- $lib/components/MarketCapCorrelation.svelte -->
<script lang="ts">
import { fade } from 'svelte/transition';
import type { 
  Company, 
  IndustryStats, 
  IndustryAccumulator,
  ProcessedCompanyData 
} from '$lib/types';
import { selectedCompany as globalSelectedCompany } from '$lib/stores';


// Props
export let data: Company[] = [];
export let expanded = false;

// State management
let selectedIndustries = new Set<string>();
let searchTerm = '';
let selectedCompany: ProcessedCompanyData | null = null;
let hoveredPoint: ProcessedCompanyData | null = null;
let viewMode: 'absolute' | 'relative' = 'relative';
let showAllIndustries = false;
let showDropdown = false;

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

  // Calculate statistics immediately for this industry
  const stats = acc[company.industryName];
  const validCompanies = stats.companies.filter(c => 
    c.esgScores?.total > 0 && !isNaN(c.esgScores.total)
  );

  if (validCompanies.length > 0) {
    // Calculate average
    stats.avgESG = validCompanies.reduce((sum, c) => 
      sum + c.esgScores.total, 0) / validCompanies.length;

    // Calculate standard deviation
    const squaredDiffs = validCompanies.map(c => 
      Math.pow(c.esgScores.total - stats.avgESG, 2)
    );
    stats.stdDevESG = Math.sqrt(
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / validCompanies.length
    );

    // Calculate market cap average
    stats.avgMarketCap = validCompanies.reduce((sum, c) => 
      sum + c.marketCap, 0) / validCompanies.length;
  }

  return acc;
}, {} as IndustryAccumulator);


$: marketCapData = data
  .map(company => {
    const stats = industryStats[company.industryName];
    // Add null checks and fallbacks
    const avgESG = stats?.avgESG || 0;
    const stdDevESG = stats?.stdDevESG || 1; // Use 1 as default to avoid division by zero
    
    const relativeESG = stdDevESG !== 0 
      ? (company.esgScores.total - avgESG) / stdDevESG 
      : 0;
    
    return {
      ...company,
      relativeESG,
      isOutlier: Math.abs(relativeESG) > 2,
      industryAvg: avgESG,
      industryStdDev: stdDevESG
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
  
  // Modified industry filtering logic
  const matchesIndustry = selectedIndustries.size === 0 || selectedIndustries.has(company.industryName);

  return matchesSearch && matchesIndustry;
});

// Dimensions and scales
$: height = expanded ? 600 : 400;
$: maxMarketCap = Math.max(...filteredData.map(d => d.marketCap));
$: maxScore = viewMode === 'absolute' ? 100 : 4; // 4 standard deviations for relative view
$: minScore = viewMode === 'absolute' ? 0 : -4;

// Helper functions
function toggleIndustry(industry: string) {
  selectedIndustries = new Set(selectedIndustries);
  if (selectedIndustries.has(industry)) {
    // Don't allow deselecting the current company's industry
    if (industry === $globalSelectedCompany?.industryName) return;
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
    // If a company is selected, keep its industry selected
    selectedIndustries = new Set([$globalSelectedCompany.industryName]);
  } else {
    selectedIndustries = new Set();
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

function handleChartClick() {
  selectedCompany = null;
}


// Update your existing colorScale
$: colorScale = new Map(industries.map(industry => [
  industry,
  getIndustryColor(industry)
]));

// Handle point click without store
function handlePointClick(company: ProcessedCompanyData, event: Event) {
  event.stopPropagation();
  selectedCompany = selectedCompany === company ? null : company;
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

// Update the industries sorting with proper typing
$: industries = [...new Set(marketCapData.map(d => d.industryName))]
  .sort((a, b) => {
    // Find category for each industry
    const getCategoryForIndustry = (industryName: string): string => {
      return Object.entries(industryCategories).find(([_, category]) => 
        category.industries.some(i => i.name === industryName)
      )?.[0] ?? 'Uncategorized';
    };

    const categoryA = getCategoryForIndustry(a);
    const categoryB = getCategoryForIndustry(b);

    // If industries are in different categories, sort by category order
    if (categoryA !== categoryB) {
      return categoryOrder.indexOf(categoryA) - categoryOrder.indexOf(categoryB);
    }

    // If industries are in the same category and the category exists
    if (categoryA !== 'Uncategorized') {
      // Safely access the category
      const category = industryCategories[categoryA as keyof typeof industryCategories];
      if (category) {
        const indexA = category.industries.findIndex(i => i.name === a);
        const indexB = category.industries.findIndex(i => i.name === b);
        return indexA - indexB;
      }
    }

    // Fallback to alphabetical sorting for uncategorized industries
    return a.localeCompare(b);
  });

// Update the getIndustryColor function with proper typing
function getIndustryColor(industryName: string): string {
  for (const [_, category] of Object.entries(industryCategories)) {
    const industry = category.industries.find(i => i.name === industryName);
    if (industry) {
      return industry.shade;
    }
  }
  return '#94A3B8'; // default slate-400 for any uncategorized industries
}

$: relevantIndustries = new Set<string>((() => {
  if (!$globalSelectedCompany) return [];
  
  // Find the category of the selected company
  const selectedCategory = Object.entries(industryCategories).find(([_, category]) => 
    category.industries.some(i => i.name === $globalSelectedCompany.industryName)
  )?.[0];

  if (!selectedCategory) return [$globalSelectedCompany.industryName];

  // Get all industries in the same category
  return industryCategories[selectedCategory as keyof typeof industryCategories]
    .industries.map(i => i.name);
})());

// Update selected industries when global company changes
$: if ($globalSelectedCompany && industries.length > 0) {
  selectedIndustries = new Set([...relevantIndustries]);
}

//handle initial industry selection
function initializeSelectedIndustries(company: Company | null) {
  if (!company) {
    selectedIndustries = new Set(industries); // Show all by default if no company selected
    return;
  }

  // Find the category of the selected company
  const selectedCategory = Object.entries(industryCategories).find(([_, category]) => 
    category.industries.some(i => i.name === company.industryName)
  )?.[0];

  if (!selectedCategory) {
    selectedIndustries = new Set([company.industryName]);
    return;
  }

  // Get all industries in the same category
  const categoryIndustries = industryCategories[selectedCategory as keyof typeof industryCategories]
    .industries.map(i => i.name);
  
  selectedIndustries = new Set(categoryIndustries);
}

// Add new helper function for industry filter buttons
function getIndustryButtonStyle(industry: string) {
  const isSelected = selectedIndustries.has(industry);
  const isRelatedIndustry = $globalSelectedCompany && relevantIndustries.has(industry);
  const color = getIndustryColor(industry);
  
  return {
    backgroundColor: isSelected ? color : 'transparent',
    color: isSelected ? 'white' : color,
    border: `1px solid ${color}`,
    opacity: $globalSelectedCompany && !isRelatedIndustry ? '0.5' : '1',
    boxShadow: industry === $globalSelectedCompany?.industryName ? '0 0 0 2px rgb(59 130 246)' : 'none'
  };
}

// Update the reactive statement for selected company changes
$: if ($globalSelectedCompany) {
  initializeSelectedIndustries($globalSelectedCompany);
}

// Function to determine if an industry should be shown in the main view
function shouldShowIndustry(industry: string): boolean {
  if (showAllIndustries) return true;
  if (selectedIndustries.has(industry)) return true;
  // Add null check for globalSelectedCompany
  if (!$globalSelectedCompany) return false;
  return relevantIndustries.has(industry);
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}
</script>

<svelte:window on:click={() => showDropdown = false} />


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
      
      <!-- Add the dropdown here -->
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
            class="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50"
            on:click|stopPropagation={() => {}}
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
        class="px-3 py-1 text-sm rounded-full transition-all duration-200
          bg-gray-800 text-white"
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
      <div class="absolute left-16 right-8 top-8 bottom-8" role="group" aria-label="Company data points" style="z-index: 1;">
        {#each filteredData as company}
          {@const yValue = viewMode === 'absolute' ? company.esgScores.total : company.relativeESG}
          {@const isSelected = company.symbol === $globalSelectedCompany?.symbol}
          
          <div class="absolute" style="
            left: {(company.marketCap / maxMarketCap) * 100}%;
            bottom: {((yValue - minScore) / (maxScore - minScore)) * 100}%;
            transform: translate(-50%, -50%);
            z-index: {hoveredPoint === company || selectedCompany === company ? 9999 : 1};
          ">
            <!-- Point button -->
            <button
              type="button"
              class="point rounded-full transition-all duration-200
                {hoveredPoint === company || selectedCompany === company ? 'w-5 h-5 z-20' : 'w-2.5 h-2.5 z-10'}
                {company.isOutlier ? 'ring-2 ring-red-500' : ''}
                {isSelected ? 'selected-company' : ''}"
              style="
                background-color: {colorScale.get(company.industryName)};
                opacity: {$globalSelectedCompany && !isSelected ? '0.6' : '1'};
                --point-color: {colorScale.get(company.industryName)};
                {isSelected ? `box-shadow: 0 0 0 2px white, 0 0 0 4px ${colorScale.get(company.industryName)}` : ''};
              "
              on:mouseenter={() => hoveredPoint = company}
              on:mouseleave={() => hoveredPoint = null}
              on:click|stopPropagation={(e) => handlePointClick(company, e)}
            />
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