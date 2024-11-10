<!-- $lib/componenets/StockPriceCorrelation.svelte -->
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company, PriceData } from '$lib/types';
import { selectedCompany as globalSelectedCompany } from '$lib/stores';
import { onMount } from 'svelte';

export let data: Company[] = [];
export let priceData: Record<string, PriceData[]> = {};
export let expanded = false;

interface ProcessedCompany extends Company {
  priceChange: number;
}

// State management
let selectedIndustries = new Set<string>();
let searchTerm = '';
let hoveredCompany: ProcessedCompany | null = null;
let selectedMetric: 'total' | 'environmental' | 'social' | 'governance' = 'total';
let yAxisScale = 'linear'; // 'linear' or 'log'


// Calculate price changes with proper date handling
function calculatePriceChange(prices: PriceData[]): number | null {
  if (!prices || prices.length < 2) return null;
  
  const sortedPrices = [...prices].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstPrice = sortedPrices[0].price;
  const lastPrice = sortedPrices[sortedPrices.length - 1].price;
  
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

// Process data for visualization with improved filtering
$: processedData = data
  .map(company => {
    const priceChange = priceData[company.symbol] 
      ? calculatePriceChange(priceData[company.symbol]) ?? 0
      : 0;
    return {
      ...company,
      priceChange
    };
  })
  .filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      company.fullName.toLowerCase().includes(searchLower) ||
      company.symbol.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || 
      selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  }) as ProcessedCompany[];

// Calculate visualization scales
$: {
  const prices = processedData.map(d => d.priceChange);
  yMin = Math.floor(Math.min(...prices) / 10) * 10;
  yMax = Math.ceil(Math.max(...prices) / 10) * 10;
}
$: xMax = Math.max(...processedData.map(d => getSelectedEsgScore(d)));
$: yTicks = generateYAxisTicks(yMin, yMax);
let yMin = -100;
let yMax = 800;

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

// Update industries computation
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

// Add related industries calculation
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

// Update color scale to use industry categories
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

// Add selection functions
function selectAll() {
  if ($globalSelectedCompany) {
    selectedIndustries = new Set([...relevantIndustries]);
  } else {
    selectedIndustries = new Set(industries);
  }
}

function clearAll() {
  if ($globalSelectedCompany) {
    selectedIndustries = new Set([$globalSelectedCompany.industryName]);
  } else {
    selectedIndustries = new Set();
  }
}

function toggleIndustry(industry: string) {
  selectedIndustries = new Set(selectedIndustries);
  if (selectedIndustries.has(industry)) {
    if ($globalSelectedCompany?.industryName === industry) return;
    selectedIndustries.delete(industry);
  } else {
    selectedIndustries.add(industry);
  }
}

let showDropdown = false;

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
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
  ? [...relevantIndustries]
  : industries;

// Update industry filter based on search
$: filteredIndustries = visibleIndustries
  .filter(industry => industry.toLowerCase().includes(searchTerm.toLowerCase()));

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

// Generate appropriate Y-axis ticks
function generateYAxisTicks(min: number, max: number): number[] {
  const step = (max - min) / 8;
  return Array.from({ length: 9 }, (_, i) => min + step * i);
}

function getSelectedEsgScore(company: Company): number {
  switch (selectedMetric) {
    case 'environmental':
      return company.esgScores.environmental.score;
    case 'social':
      return company.esgScores.social.score;
    case 'governance':
      return company.esgScores.governance.score;
    default:
      return company.esgScores.total;
  }
}

function formatPriceChange(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function getPointColor(priceChange: number, industry: string): string {
  return colorScale.get(industry) || '#808080';
}

// Calculate point position
function getYPosition(value: number): string {
  if (yAxisScale === 'log' && value > 0) {
    return `${((Math.log10(value) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * 100}%`;
  }
  return `${((value - yMin) / (yMax - yMin)) * 100}%`;
}

// Calculate trend line
$: trendLineData = calculateTrendLine(processedData);

function calculateTrendLine(data: ProcessedCompany[]) {
  if (data.length < 2) return null;

  const xValues = data.map(d => getSelectedEsgScore(d));
  const yValues = data.map(d => d.priceChange);

  const n = data.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const correlation = calculateCorrelation(xValues, yValues);

  return { slope, intercept, correlation };
}

function calculateCorrelation(xValues: number[], yValues: number[]): number {
  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

  return (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
}
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
      <select
        bind:value={selectedMetric}
        class="px-3 py-1 border rounded-lg bg-white"
      >
        <option value="total">Total ESG Score</option>
        <option value="environmental">Environmental Score</option>
        <option value="social">Social Score</option>
        <option value="governance">Governance Score</option>
      </select>
      
      <select
        bind:value={yAxisScale}
        class="px-3 py-1 border rounded-lg bg-white"
      >
        <option value="linear">Linear Scale</option>
        <option value="log">Log Scale</option>
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

        <!-- Trend line -->
        {#if trendLineData}
          <div
            class="absolute w-full h-0 border-t-2 border-gray-400 border-dashed"
            style="
              bottom: {getYPosition(trendLineData.intercept)}%;
              transform: rotate({Math.atan(trendLineData.slope) * (180 / Math.PI)}deg);
              transform-origin: left bottom;
            "
          ></div>
        {/if}

        <!-- Data points -->
        {#each processedData as company}
          {@const esgScore = getSelectedEsgScore(company)}
          <button
            class="absolute rounded-full transition-all duration-200"
            style="
              left: {(esgScore / xMax) * 100}%;
              bottom: {getYPosition(company.priceChange)};
              width: {expanded ? '8px' : '6px'};
              height: {expanded ? '8px' : '6px'};
              background-color: {getPointColor(company.priceChange, company.industryName)};
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
        {selectedMetric === 'total' ? 'ESG Score' : `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Score`}
      </div>
      <div class="absolute left-2 top-1/2 -rotate-90 text-sm text-gray-600 font-medium whitespace-nowrap">
        Price Change (%)
      </div>
    </div>
  </div>

  <!-- Statistics Panel -->
  {#if processedData.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Companies Shown</div>
        <div class="font-semibold">{processedData.length}</div>
      </div>
      {#if trendLineData}
        <div class="bg-gray-50 p-3 rounded-lg">
          <div class="text-gray-600">Correlation</div>
          <div class="font-semibold">{trendLineData.correlation.toFixed(3)}</div>
        </div>
      {/if}
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Average Price Change</div>
        <div class="font-semibold">
          {formatPriceChange(processedData.reduce((sum, co) => sum + co.priceChange, 0) / 
            processedData.length)}
        </div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Average ESG Score</div>
        <div class="font-semibold">
          {(processedData.reduce((sum, co) => sum + getSelectedEsgScore(co), 0) / 
            processedData.length).toFixed(1)}
        </div>
      </div>
    </div>
  {/if}
</div>