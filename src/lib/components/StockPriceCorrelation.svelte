<!-- $lib/componenets/StockPriceCorrelation.svelte -->
<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company, PriceData } from '$lib/types';
import { appState } from '$lib/state.svelte';

// Types
interface ProcessedCompany extends Company { priceChange: number; }

// Props
interface Props {
  data?: Company[];
  priceData?: Record<string, PriceData[]>;
  expanded?: boolean;
}
let { data = [], priceData = {}, expanded = false }: Props = $props();

// State
let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let hoveredCompany = $state<ProcessedCompany | null>(null);
let selectedMetric = $state<'total' | 'environmental' | 'social' | 'governance'>('total');
let yAxisScale = $state('linear');
let showDropdown = $state(false);
let yMin = $state(-100);
let yMax = $state(800);

// Constants
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

let colorScale = $derived(new Map(industries.map(industry => [industry, getIndustryColor(industry)])));

let relevantIndustries = $derived(new Set<string>((() => {
  if (!appState.selectedCompany) return industries;
  const selectedCategory = Object.entries(industryCategories)
    .find(([_, cat]) => cat.industries.some(i => i.name === appState.selectedCompany!.industryName))?.[0];
  if (!selectedCategory) return new Set([appState.selectedCompany.industryName]);
  return industryCategories[selectedCategory as keyof typeof industryCategories]
    .industries.map(i => i.name).filter(name => industries.includes(name));
})()));

let processedData = $derived(
  data.map(company => ({
    ...company,
    priceChange: priceData[company.symbol] ? calculatePriceChange(priceData[company.symbol]) ?? 0 : 0
  })).filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      company.fullName.toLowerCase().includes(searchLower) ||
      company.symbol.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  }) as ProcessedCompany[]
);

let xMax = $derived(Math.max(...processedData.map(d => getSelectedEsgScore(d))));

let yTicks = $derived(generateYAxisTicks(yMin, yMax));

let statistics = $derived(processedData.length >= 3 ? {
  stats: { quartiles: calculateQuartiles(processedData) }
} : null);

let visibleIndustries = $derived(appState.selectedCompany ? [...relevantIndustries] : industries);

let insights = $derived(calculateDataInsights(processedData));

// Sync selected industries + yMin/yMax
$effect(() => {
  if (appState.selectedCompany) {
    const relatedInds = [...relevantIndustries];
    if (relatedInds.length > 0) selectedIndustries = new Set(relatedInds);
  }
});

$effect(() => {
  const prices = processedData.map(d => d.priceChange);
  if (prices.length > 0) {
    yMin = Math.floor(Math.min(...prices) / 10) * 10;
    yMax = Math.ceil(Math.max(...prices) / 10) * 10;
  }
});

// Click outside handler
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
function calculatePriceChange(prices: PriceData[]): number | null {
  if (!prices || prices.length < 2) return null;
  const sorted = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return ((sorted[sorted.length - 1].price - sorted[0].price) / sorted[0].price) * 100;
}

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
  for (const [_, cat] of Object.entries(industryCategories)) {
    const industry = cat.industries.find(i => i.name === industryName);
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

function selectAll() {
  selectedIndustries = new Set(appState.selectedCompany ? [...relevantIndustries] : industries);
}

function clearAll() {
  selectedIndustries = new Set(appState.selectedCompany ? [appState.selectedCompany.industryName] : []);
}

function toggleIndustry(industry: string) {
  if (appState.selectedCompany?.industryName === industry) return;
  selectedIndustries = new Set(selectedIndustries);
  selectedIndustries.has(industry) ? selectedIndustries.delete(industry) : selectedIndustries.add(industry);
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

function getPointColor(priceChange: number, industry: string): string {
  return colorScale.get(industry) || '#808080';
}

function calculateQuartiles(data: ProcessedCompany[]) {
  const sortedEsg = [...data].sort((a, b) => getSelectedEsgScore(a) - getSelectedEsgScore(b));
  const sortedPrice = [...data].sort((a, b) => a.priceChange - b.priceChange);
  return {
    esg: { min: getSelectedEsgScore(sortedEsg[0]), max: getSelectedEsgScore(sortedEsg[sortedEsg.length - 1]) },
    price: { min: sortedPrice[0].priceChange, max: sortedPrice[sortedPrice.length - 1].priceChange }
  };
}

function calculateDataInsights(data: ProcessedCompany[]) {
  if (data.length === 0) return null;
  const esgScores = data.map(d => getSelectedEsgScore(d));
  const priceChanges = data.map(d => d.priceChange);
  const esgRange = `${Math.floor(Math.min(...esgScores))}-${Math.ceil(Math.max(...esgScores))}`;
  const priceRange = `${Math.min(...priceChanges).toFixed(1)}% and ${Math.max(...priceChanges).toFixed(1)}%`;
  const highEsgAvg = data.filter(d => getSelectedEsgScore(d) > 60).reduce((s, c) => s + c.priceChange, 0) / (data.filter(d => getSelectedEsgScore(d) > 60).length || 1);
  const lowEsgAvg = data.filter(d => getSelectedEsgScore(d) <= 60).reduce((s, c) => s + c.priceChange, 0) / (data.filter(d => getSelectedEsgScore(d) <= 60).length || 1);
  const correlation = Math.abs(calculateCorrelation(esgScores, priceChanges));
  return {
    esgRange,
    priceRange,
    performanceTrend: highEsgAvg > lowEsgAvg ? 'positive' : 'negative',
    predictiveStrength: correlation > 0.5 ? 'strong' : correlation > 0.3 ? 'moderate' : 'weak'
  };
}

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
</script>

<div class="w-full space-y-4">
  <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
    <div class="space-y-2">
      <h2 class="text-xl font-semibold">ESG Score vs Stock Price Performance</h2>
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
            role="menu"
            tabindex="-1"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
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

  <!-- Chart Area -->
  <div class="relative" style="height: {expanded ? 600 : 400}px;">
    <div class="absolute inset-0">
      <!-- Axes and Grid -->
      <div class="absolute inset-x-16 inset-y-8 border-l border-b border-gray-200">
        <!-- Data points -->
        {#each processedData as company}
          {@const esgScore = getSelectedEsgScore(company)}
          {@const isSelected = company.symbol === appState.selectedCompany?.symbol}
          
          <!-- Calculate exact pixel positions based on data values -->
          <div 
            class="absolute" 
            style="
              left: calc({(esgScore) * 100 / 100}%);
              bottom: calc({((company.priceChange - yMin) / (yMax - yMin)) * 100}%);
              transform: translate(-50%, 50%);
              z-index: {hoveredCompany === company || isSelected ? 9999 : 1};
            "
          >
            <button
              type="button"
              aria-label="{company.fullName} ({company.symbol})"
              class="point rounded-full transition-all duration-200
                {isSelected ? 'selected-company' : ''}"
              style="
                width: {isSelected ? '16px' : expanded ? '12px' : '10px'};
                height: {isSelected ? '16px' : expanded ? '12px' : '10px'};
                background-color: {getPointColor(company.priceChange, company.industryName)};
                opacity: {appState.selectedCompany && !isSelected ? '0.6' : '1'};
                --point-color: {getPointColor(company.priceChange, company.industryName)};
                {isSelected ? `box-shadow: 0 0 0 2px white, 0 0 0 4px ${getPointColor(company.priceChange, company.industryName)}` : ''};
              "
              onmouseenter={() => hoveredCompany = company}
              onmouseleave={() => hoveredCompany = null}
            ></button>

            {#if hoveredCompany === company}
              <div
                class="company-tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                  bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72
                  text-left pointer-events-none z-50"
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
          </div>
        {/each}
        <!-- Y-axis ticks -->
        {#each yTicks as tick}
          <div
            class="absolute left-0 w-full h-0 flex items-center"
            style="bottom: {((tick - yMin) / (yMax - yMin)) * 100}%"
          >
            <div class="absolute -left-14 text-xs text-gray-600 w-12 text-right">
              {formatPriceChange(tick)}
            </div>
            <div class="w-full border-t border-gray-100"></div>
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
            <div class="h-full border-l border-gray-100"></div>
          </div>
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
                          Most companies clustering between <strong>{insights.esgRange}</strong> ESG scores
                      </div>
                      <div class="text-lg">
                          Price changes mostly falling between <strong>{insights.priceRange}</strong>
                      </div>
                  </div>
                  <!-- Right Column -->
                  <div class="space-y-4">
                      <div class="text-lg">
                          {#if insights.performanceTrend === 'positive'}
                              A positive tendency for better price performance in companies with higher ESG scores
                          {:else}
                              <strong>No clear positive correlation</strong> between ESG scores and price performance
                          {/if}
                      </div>
                      <div class="text-lg">
                          High variability showing <strong>{insights.predictiveStrength} predictive power</strong> of ESG scores for stock performance
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
</style>