<!-- $lib/componenets/StockPriceCorrelation.svelte -->
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company, PriceData } from '$lib/types';
import { selectedCompany as globalSelectedCompany } from '$lib/stores';
import { onMount } from 'svelte';

// Types and Interfaces
interface ProcessedCompany extends Company {
  priceChange: number;
}

// Props
export let data: Company[] = [];
export let priceData: Record<string, PriceData[]> = {};
export let expanded = false;

// State Management
let selectedIndustries = new Set<string>();
let searchTerm = '';
let hoveredCompany: ProcessedCompany | null = null;
let selectedMetric: 'total' | 'environmental' | 'social' | 'governance' = 'total';
let yAxisScale = 'linear';
let showDropdown = false;
let yMin = -100;
let yMax = 800;

// Constants
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

// Data Processing Functions
function calculatePriceChange(prices: PriceData[]): number | null {
  if (!prices || prices.length < 2) return null;
  
  const sortedPrices = [...prices].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstPrice = sortedPrices[0].price;
  const lastPrice = sortedPrices[sortedPrices.length - 1].price;
  
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}


// Utility Functions
function generateYAxisTicks(min: number, max: number): number[] {
  const step = (max - min) / 8;
  return Array.from({ length: 9 }, (_, i) => min + step * i);
}

function getSelectedEsgScore(company: Company): number {
  switch (selectedMetric) {
    case 'environmental': return company.esgScores.environmental.score;
    case 'social': return company.esgScores.social.score;
    case 'governance': return company.esgScores.governance.score;
    default: return company.esgScores.total;
  }
}

function formatPriceChange(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function getIndustryColor(industryName: string): string {
  for (const [_, category] of Object.entries(industryCategories)) {
    const industry = category.industries.find(i => i.name === industryName);
    if (industry) return industry.shade;
  }
  return '#94A3B8';
}

function getYPosition(value: number): string {
  if (yAxisScale === 'log' && value > 0) {
    return `${((Math.log10(value) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * 100}%`;
  }
  return `${((value - yMin) / (yMax - yMin)) * 100}%`;
}

// Industry Selection Functions
function selectAll() {
  selectedIndustries = new Set($globalSelectedCompany 
    ? [...relevantIndustries]
    : industries
  );
}

function clearAll() {
  selectedIndustries = new Set($globalSelectedCompany 
    ? [$globalSelectedCompany.industryName]
    : []
  );
}

function toggleIndustry(industry: string) {
  if ($globalSelectedCompany?.industryName === industry) return;
  selectedIndustries = new Set(selectedIndustries);
  selectedIndustries.has(industry) 
    ? selectedIndustries.delete(industry)
    : selectedIndustries.add(industry);
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

// Reactive Declarations
$: processedData = data
  .map(company => ({
    ...company,
    priceChange: priceData[company.symbol] 
      ? calculatePriceChange(priceData[company.symbol]) ?? 0
      : 0
  }))
  .filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      company.fullName.toLowerCase().includes(searchLower) ||
      company.symbol.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || 
      selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  }) as ProcessedCompany[];

$: {
  const prices = processedData.map(d => d.priceChange);
  yMin = Math.floor(Math.min(...prices) / 10) * 10;
  yMax = Math.ceil(Math.max(...prices) / 10) * 10;
}

$: xMax = Math.max(...processedData.map(d => getSelectedEsgScore(d)));
$: yTicks = generateYAxisTicks(yMin, yMax);

$: statistics = processedData.length >= 3 ? {
  stats: {
    quartiles: calculateQuartiles(processedData)
  }
} : null;

$: colorScale = new Map(industries.map(industry => [
  industry,
  getIndustryColor(industry)
]));

$: categorizedIndustries = new Set(
  Object.values(industryCategories).flatMap(category => 
    category.industries.map(industry => industry.name)
  )
);

$: industries = [...new Set(data.map(d => d.industryName))]
  .filter(industry => categorizedIndustries.has(industry))
  .sort((a, b) => {
    const getCategoryForIndustry = (industryName: string) => 
      Object.entries(industryCategories).find(([_, category]) => 
        category.industries.some(i => i.name === industryName)
      )?.[0] ?? '';

    const categoryA = getCategoryForIndustry(a);
    const categoryB = getCategoryForIndustry(b);

    if (categoryA !== categoryB) {
      return categoryOrder.indexOf(categoryA) - categoryOrder.indexOf(categoryB);
    }

    const category = industryCategories[categoryA as keyof typeof industryCategories];
    if (category) {
      return category.industries.findIndex(i => i.name === a) - 
             category.industries.findIndex(i => i.name === b);
    }

    return a.localeCompare(b);
  });

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

$: if ($globalSelectedCompany) {
  const relatedInds = [...relevantIndustries];
  if (relatedInds.length > 0) {
    selectedIndustries = new Set(relatedInds);
  }
}

$: visibleIndustries = $globalSelectedCompany 
  ? [...relevantIndustries]
  : industries;

$: filteredIndustries = visibleIndustries
  .filter(industry => industry.toLowerCase().includes(searchTerm.toLowerCase()));

// Lifecycle
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
  return () => document.removeEventListener('click', handleClickOutside);
});

// Initialize selected industries when component mounts or company changes
$: if ($globalSelectedCompany) {
  const relatedInds = [...relevantIndustries];
  if (relatedInds.length > 0) {
    selectedIndustries = new Set(relatedInds);
  }
}

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


function getPointColor(priceChange: number, industry: string): string {
  return colorScale.get(industry) || '#808080';
}


function calculateR2(data: ProcessedCompany[], polynomial: any): number {
  const xs = data.map(d => getSelectedEsgScore(d));
  const ys = data.map(d => d.priceChange);
  
  const yMean = ys.reduce((sum, y) => sum + y, 0) / ys.length;
  const predicted = xs.map(x => 
    polynomial.coeffs.reduce((sum: number, coeff: number, power: number) => 
      sum + coeff * Math.pow(x, power), 0)
  );
  
  const ssRes = ys.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
  const ssTot = ys.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  
  return 1 - (ssRes / ssTot);
}


function calculateQuartiles(data: ProcessedCompany[]) {
  const sortedEsg = [...data].sort((a, b) => getSelectedEsgScore(a) - getSelectedEsgScore(b));
  const sortedPrice = [...data].sort((a, b) => a.priceChange - b.priceChange);
  
  return {
    esg: {
      min: getSelectedEsgScore(sortedEsg[0]),
      max: getSelectedEsgScore(sortedEsg[sortedEsg.length - 1])
    },
    price: {
      min: sortedPrice[0].priceChange,
      max: sortedPrice[sortedPrice.length - 1].priceChange
    }
  };
}

// Add functions to calculate data insights
function calculateDataInsights(data: ProcessedCompany[]) {
  if (data.length === 0) return null;

  const esgScores = data.map(d => getSelectedEsgScore(d));
  const priceChanges = data.map(d => d.priceChange);

  // Calculate ESG score clusters
  const esgMin = Math.min(...esgScores);
  const esgMax = Math.max(...esgScores);
  const esgRange = `${Math.floor(esgMin)}-${Math.ceil(esgMax)}`;

  // Calculate price change ranges
  const priceMin = Math.min(...priceChanges);
  const priceMax = Math.max(...priceChanges);
  const priceRange = `${priceMin.toFixed(1)}% and ${priceMax.toFixed(1)}%`;

  // Calculate performance tendency
  const highEsgCompanies = data.filter(d => getSelectedEsgScore(d) > 60);
  const highEsgAvgPerformance = highEsgCompanies.reduce((sum, co) => sum + co.priceChange, 0) / highEsgCompanies.length;
  const lowEsgCompanies = data.filter(d => getSelectedEsgScore(d) <= 60);
  const lowEsgAvgPerformance = lowEsgCompanies.reduce((sum, co) => sum + co.priceChange, 0) / lowEsgCompanies.length;
  
  const performanceTrend = highEsgAvgPerformance > lowEsgAvgPerformance ? 'positive' : 'negative';

  // Calculate variability
  const correlation = Math.abs(calculateCorrelation(esgScores, priceChanges));
  const predictiveStrength = correlation > 0.5 ? 'strong' : correlation > 0.3 ? 'moderate' : 'weak';

  return {
    esgRange,
    priceRange,
    performanceTrend,
    predictiveStrength
  };
}

// Add correlation calculation if not already present
function calculateCorrelation(xs: number[], ys: number[]): number {
  const xMean = xs.reduce((a, b) => a + b) / xs.length;
  const yMean = ys.reduce((a, b) => a + b) / ys.length;
  
  const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
  const denominator = Math.sqrt(
    xs.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) *
    ys.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
  );
  
  return numerator / denominator;
}

// Add reactive declaration for insights
$: insights = calculateDataInsights(processedData);

</script>

<div class="w-full space-y-4">
  <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
    <div class="space-y-2">
      <h2 class="text-xl font-semibold">ESG Score vs Stock Price Performance</h2>
      <p class="text-sm text-gray-600">
        Correlation between {selectedMetric} ESG score and stock price change
      </p>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-2">
      <!-- <select
        bind:value={selectedMetric}
        class="px-3 py-1 border rounded-lg bg-white"
      >
        <option value="total">Total ESG Score</option>
        <option value="environmental">Environmental Score</option>
        <option value="social">Social Score</option>
        <option value="governance">Governance Score</option>
      </select> -->
      
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search companies..."
        class="px-3 py-1 border rounded-lg"
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

  <!-- Chart Area -->
  <div class="relative" style="height: {expanded ? 600 : 400}px;">
    <div class="absolute inset-0">
      <!-- Axes and Grid -->
      <div class="absolute inset-x-16 inset-y-8 border-l border-b border-gray-200">
        <!-- Y-axis ticks -->
        {#each yTicks as tick}
          <div
            class="absolute left-0 w-full h-0 flex items-center"
            style="bottom: {getYPosition(tick)}"
          >
            <div class="absolute -left-14 text-xs text-gray-600 w-12 text-right">
              {formatPriceChange(tick)}
            </div>
            <div class="w-full border-t border-gray-100" />
          </div>
        {/each}

        <!-- X-axis ticks -->
        {#each [0, 20, 40, 60, 80, 100] as tick}
          <div
            class="absolute bottom-0 h-full w-0 flex justify-center"
            style="left: {tick}%"
          >
            <div class="absolute -bottom-6 text-xs text-gray-600 transform -translate-x-1/2">
              {tick}
            </div>
            <div class="h-full border-l border-gray-100" />
          </div>
        {/each}

        <!-- Data points -->
        {#each processedData as company}
          {@const esgScore = getSelectedEsgScore(company)}
          <button
            class="absolute rounded-full transition-all duration-200"
            style="
              left: {(esgScore / xMax) * 100}%;
              bottom: {getYPosition(company.priceChange)};
              width: {company.symbol === $globalSelectedCompany?.symbol ? '12px' : expanded ? '8px' : '6px'};
              height: {company.symbol === $globalSelectedCompany?.symbol ? '12px' : expanded ? '8px' : '6px'};
              background-color: {getPointColor(company.priceChange, company.industryName)};
              transform: translate(-50%, -50%);
              opacity: {company.symbol === $globalSelectedCompany?.symbol ? '1' : '0.7'};
              z-index: {company.symbol === $globalSelectedCompany?.symbol ? '10' : '0'};
              border: {company.symbol === $globalSelectedCompany?.symbol ? '2px solid #3B82F6' : 'none'};
            "
            on:mouseenter={() => hoveredCompany = company}
            on:mouseleave={() => hoveredCompany = null}
          >
            {#if hoveredCompany === company}
              <div
                class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                  bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72
                  text-left pointer-events-none z-20"
                transition:fade
              >
                <div class="font-bold">{company.fullName}</div>
                <div class="text-sm text-gray-500">({company.symbol})</div>
                <div class="text-sm text-gray-600">{company.industryName}</div>
                <div class="mt-2 space-y-1">
                  <div>ESG Score: <span class="font-semibold">
                    {esgScore.toFixed(1)}</span>
                  </div>
                  <div>Price Change: <span class="font-semibold">
                    {formatPriceChange(company.priceChange)}</span>
                  </div>
                  <div>Market Cap: <span class="font-semibold">
                    ${(company.marketCap).toFixed(1)}B</span>
                  </div>
                  <div>Beta: <span class="font-semibold">
                    {company.beta.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Axis Labels -->
      <div class="absolute bottom-0 left-0 right-0 text-center text-sm text-gray-600 font-medium">
        {selectedMetric === 'total' ? 'ESG Score' : 
          `${String(selectedMetric)[0].toUpperCase()}${String(selectedMetric).substring(1)} Score`}
      </div>
      <div class="absolute left-2 top-1/2 -rotate-90 text-sm text-gray-600 font-medium whitespace-nowrap">
        Price Change (%)
      </div>
    </div>
  </div>

  <!-- Analysis and Statistics Panel -->
  {#if processedData.length > 0}
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
      <!-- Analysis Summary -->
      {#if insights}
        <div class="lg:col-span-3 bg-gray-50 p-4 rounded-lg">
          <h3 class="text-xl font-semibold mb-4">Analysis Summary</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-4">
              <div class="text-lg">
                Most companies clustering between {insights.esgRange} ESG scores
              </div>
              <div class="text-lg">
                Price changes mostly falling between {insights.priceRange}
              </div>
            </div>
            <!-- Right Column -->
            <div class="space-y-4">
              <div class="text-lg">
                {insights.performanceTrend === 'positive'
                  ? 'A positive tendency for better price performance in companies with higher ESG scores'
                  : 'No clear positive correlation between ESG scores and price performance'}
              </div>
              <div class="text-lg">
                High variability showing {insights.predictiveStrength} predictive power of ESG scores for stock performance
              </div>
            </div>
          </div>
        </div>
      {/if}


      <!-- Statistics -->
      <div class="lg:col-span-1 space-y-3">
        {#if statistics?.stats?.quartiles}
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-gray-600">ESG Score Range</div>
            <div class="font-semibold">
              {statistics.stats.quartiles.esg.min?.toFixed(1) ?? '0'} - {statistics.stats.quartiles.esg.max?.toFixed(1) ?? '0'}
            </div>
          </div>
        {/if}
        <div class="bg-gray-50 p-3 rounded-lg">
          <div class="text-gray-600">Sample Size</div>
          <div class="font-semibold">{processedData.length}</div>
        </div>
      </div>
    </div>
  {/if}
</div>