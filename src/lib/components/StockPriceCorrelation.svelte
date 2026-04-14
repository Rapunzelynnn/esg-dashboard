<!-- $lib/components/StockPriceCorrelation.svelte -->
<script lang="ts">
import * as d3 from 'd3';
import { fade } from 'svelte/transition';
import type { Company, PriceData } from '$lib/types';
import { appState } from '$lib/state.svelte';
import { categoryOrder, industryCategories, getIndustryColor } from '$lib/charts/colors';
import { attachZoom, resetZoom } from '$lib/charts/zoom';

interface ProcessedCompany extends Company { priceChange: number; }

interface Props {
  data?: Company[];
  priceData?: Record<string, PriceData[]>;
  expanded?: boolean;
}
let { data = [], priceData = {}, expanded = false }: Props = $props();

const MARGIN = { top: 20, right: 20, bottom: 60, left: 75 };
const INNER_W = 900;
let innerH = $derived(expanded ? 540 : 340);

let svgEl = $state<SVGSVGElement | null>(null);
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
let zoomTransform = $state<d3.ZoomTransform>(d3.zoomIdentity);

let tooltipCompany = $state<ProcessedCompany | null>(null);
let tooltipPos = $state({ x: 0, y: 0 });

let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let selectedMetric = $state<'total' | 'environmental' | 'social' | 'governance'>('total');
let showDropdown = $state(false);

let categorizedIndustries = $derived(
  new Set(Object.values(industryCategories).flatMap(cat => cat.industries.map(i => i.name)))
);

let industries = $derived(
  [...new Set(data.map(d => d.industryName))]
    .filter(ind => categorizedIndustries.has(ind))
    .sort((a, b) => {
      const getCat = (n: string) =>
        Object.entries(industryCategories).find(([_, cat]) => cat.industries.some(i => i.name === n))?.[0] ?? '';
      const catA = getCat(a);
      const catB = getCat(b);
      if (catA !== catB) return categoryOrder.indexOf(catA as typeof categoryOrder[number]) - categoryOrder.indexOf(catB as typeof categoryOrder[number]);
      const cat = industryCategories[catA];
      if (cat) return cat.industries.findIndex(i => i.name === a) - cat.industries.findIndex(i => i.name === b);
      return a.localeCompare(b);
    })
);

let colorScale = $derived(new Map(industries.map(ind => [ind, getIndustryColor(ind)])));

let relevantIndustries = $derived(new Set<string>((() => {
  if (!appState.selectedCompany) return industries;
  const selectedCat = Object.entries(industryCategories)
    .find(([_, cat]) => cat.industries.some(i => i.name === appState.selectedCompany!.industryName))?.[0];
  if (!selectedCat) return [appState.selectedCompany.industryName];
  return industryCategories[selectedCat].industries.map(i => i.name).filter(n => industries.includes(n));
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

let yMin = $derived(
  processedData.length > 0 ? Math.floor(Math.min(...processedData.map(d => d.priceChange)) / 10) * 10 : -100
);
let yMax = $derived(
  processedData.length > 0 ? Math.ceil(Math.max(...processedData.map(d => d.priceChange)) / 10) * 10 : 800
);

let insights = $derived(processedData.length > 0 ? calculateDataInsights(processedData) : null);

let statistics = $derived(processedData.length >= 3 ? {
  stats: { quartiles: calculateQuartiles(processedData) }
} : null);

// Zoom setup
$effect(() => {
  if (!svgEl) return;
  zoomBehavior = attachZoom(svgEl, (t) => { zoomTransform = t; });
  return () => { if (svgEl) d3.select(svgEl).on('.zoom', null); };
});

// Render
$effect(() => {
  if (!svgEl || processedData.length === 0) return;

  const xBase = d3.scaleLinear().domain([0, 100]).range([0, INNER_W]);
  const yBase = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0]);
  const xS = zoomTransform.rescaleX(xBase);
  const yS = zoomTransform.rescaleY(yBase);

  const sel = d3.select(svgEl);

  sel.select<SVGGElement>('.x-axis').call(d3.axisBottom(xS).ticks(6));
  sel.select<SVGGElement>('.y-axis').call(
    d3.axisLeft(yS).ticks(8).tickFormat(v => `${+v >= 0 ? '+' : ''}${(+v).toFixed(0)}%`)
  );

  const isSelected = (d: ProcessedCompany) => d.symbol === appState.selectedCompany?.symbol;

  sel.select<SVGGElement>('.circles')
    .selectAll<SVGCircleElement, ProcessedCompany>('circle')
    .data(processedData, d => d.symbol)
    .join(
      enter => enter.append('circle')
        .on('mouseenter', function(event: MouseEvent, d: ProcessedCompany) {
          const rect = svgEl!.getBoundingClientRect();
          tooltipCompany = d;
          tooltipPos = { x: event.clientX - rect.left + 14, y: event.clientY - rect.top - 14 };
        })
        .on('mouseleave', () => { tooltipCompany = null; }),
      update => update,
      exit => exit.remove()
    )
    .attr('cx', d => xS(getEsgScore(d)))
    .attr('cy', d => yS(d.priceChange))
    .attr('r', d => isSelected(d) ? 8 : expanded ? 6 : 5)
    .attr('fill', d => colorScale.get(d.industryName) ?? '#94A3B8')
    .attr('opacity', d => appState.selectedCompany && !isSelected(d) ? 0.4 : 0.85)
    .attr('stroke', d => isSelected(d) ? '#1e40af' : 'none')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');
});

// Sync industry filter
$effect(() => {
  if (appState.selectedCompany) {
    const relatedInds = [...relevantIndustries];
    if (relatedInds.length > 0) selectedIndustries = new Set(relatedInds);
  }
});

$effect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (showDropdown) {
      const dropdown = document.querySelector('.spc-industry-dropdown');
      if (!dropdown?.contains(event.target as Node)) showDropdown = false;
    }
  };
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
});

function getEsgScore(company: Company): number {
  switch (selectedMetric) {
    case 'environmental': return company.esgScores.environmental.score;
    case 'social': return company.esgScores.social.score;
    case 'governance': return company.esgScores.governance.score;
    default: return company.esgScores.total;
  }
}

function calculatePriceChange(prices: PriceData[]): number | null {
  if (!prices || prices.length < 2) return null;
  const sorted = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return ((sorted[sorted.length - 1].price - sorted[0].price) / sorted[0].price) * 100;
}

function calculateQuartiles(items: ProcessedCompany[]) {
  const sortedEsg = [...items].sort((a, b) => getEsgScore(a) - getEsgScore(b));
  const sortedPrice = [...items].sort((a, b) => a.priceChange - b.priceChange);
  return {
    esg: { min: getEsgScore(sortedEsg[0]), max: getEsgScore(sortedEsg[sortedEsg.length - 1]) },
    price: { min: sortedPrice[0].priceChange, max: sortedPrice[sortedPrice.length - 1].priceChange }
  };
}

function calculateDataInsights(items: ProcessedCompany[]) {
  if (items.length === 0) return null;
  const esgScores = items.map(d => getEsgScore(d));
  const priceChanges = items.map(d => d.priceChange);
  const esgRange = `${Math.floor(Math.min(...esgScores))}-${Math.ceil(Math.max(...esgScores))}`;
  const priceRange = `${Math.min(...priceChanges).toFixed(1)}% and ${Math.max(...priceChanges).toFixed(1)}%`;
  const highEsgAvg = items.filter(d => getEsgScore(d) > 60).reduce((s, c) => s + c.priceChange, 0) /
    (items.filter(d => getEsgScore(d) > 60).length || 1);
  const lowEsgAvg = items.filter(d => getEsgScore(d) <= 60).reduce((s, c) => s + c.priceChange, 0) /
    (items.filter(d => getEsgScore(d) <= 60).length || 1);
  const esgArr = esgScores;
  const priceArr = priceChanges;
  const xMean = esgArr.reduce((a, b) => a + b) / esgArr.length;
  const yMean = priceArr.reduce((a, b) => a + b) / priceArr.length;
  const numerator = esgArr.reduce((sum, x, i) => sum + (x - xMean) * (priceArr[i] - yMean), 0);
  const denominator = Math.sqrt(
    esgArr.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) *
    priceArr.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
  );
  const correlation = denominator === 0 ? 0 : Math.abs(numerator / denominator);
  return {
    esgRange,
    priceRange,
    performanceTrend: highEsgAvg > lowEsgAvg ? 'positive' : 'negative',
    predictiveStrength: correlation > 0.5 ? 'strong' : correlation > 0.3 ? 'moderate' : 'weak'
  };
}

function doResetZoom() {
  if (svgEl && zoomBehavior) resetZoom(svgEl, zoomBehavior);
}

function toggleIndustry(industry: string) {
  if (appState.selectedCompany?.industryName === industry) return;
  selectedIndustries = new Set(selectedIndustries);
  selectedIndustries.has(industry) ? selectedIndustries.delete(industry) : selectedIndustries.add(industry);
}

function selectAll() { selectedIndustries = new Set(appState.selectedCompany ? [...relevantIndustries] : industries); }
function clearAll() { selectedIndustries = new Set(appState.selectedCompany ? [appState.selectedCompany.industryName] : []); }

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}

function formatPriceChange(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
</script>

<div class="w-full space-y-4">
  <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
    <h2 class="text-xl font-semibold">ESG Score vs Stock Price Performance</h2>
    <input type="text" bind:value={searchTerm} placeholder="Search companies..." class="px-3 py-1 border rounded-lg" />
  </div>

  <!-- Metric selector -->
  <div class="flex gap-2">
    {#each [['total','Total ESG'],['environmental','Environmental'],['social','Social'],['governance','Governance']] as [key, label]}
      <button
        class="px-3 py-1 text-sm rounded-lg {selectedMetric === key ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
        onclick={() => selectedMetric = key as typeof selectedMetric}
      >{label}</button>
    {/each}
  </div>

  <!-- Industry Filters -->
  <div class="flex flex-col space-y-2">
    <div class="flex flex-wrap gap-2 items-center">
      <button class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300" onclick={selectAll}>Select All</button>
      <button class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300" onclick={clearAll}>Clear All</button>
      <div class="relative">
        <button class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center gap-2" onclick={handleDropdownClick}>
          <span>More Industries</span><span class="text-xs">▼</span>
        </button>
        {#if showDropdown}
          <div
            class="spc-industry-dropdown absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50"
            role="menu" tabindex="-1"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
          >
            <div class="p-4 space-y-4">
              {#each categoryOrder as category}
                {@const catIndustries = industries.filter(i => industryCategories[category]?.industries.some(ci => ci.name === i))}
                {#if catIndustries.length > 0}
                  <div class="space-y-2">
                    <div class="text-sm font-semibold text-gray-500">{category}</div>
                    <div class="space-y-1 pl-2">
                      {#each catIndustries as industry}
                        <button class="w-full px-2 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2" onclick={() => toggleIndustry(industry)}>
                          <div class="flex items-center flex-1">
                            <div class="w-2 h-2 rounded-full mr-2" style="background-color: {colorScale.get(industry)}"></div>
                            <span>{industry}</span>
                          </div>
                          {#if selectedIndustries.has(industry)}<span class="text-blue-500">✓</span>{/if}
                        </button>
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
    <div class="flex flex-wrap gap-2">
      {#each [...selectedIndustries] as industry}
        <button
          class="px-3 py-1 text-sm rounded-full flex items-center space-x-2 bg-gray-800 text-white hover:bg-gray-700
            {appState.selectedCompany?.industryName === industry ? 'ring-2 ring-blue-500' : ''}"
          onclick={() => toggleIndustry(industry)}
        >
          <div class="w-2 h-2 rounded-full" style="background-color: {colorScale.get(industry)}"></div>
          <span>{industry}</span>
          <span class="text-xs ml-1">×</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Chart -->
  <div class="relative" style="height: {innerH + MARGIN.top + MARGIN.bottom}px">
    {#if tooltipCompany}
      <div
        class="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72 pointer-events-none"
        style="left:{tooltipPos.x}px; top:{tooltipPos.y}px"
        role="tooltip"
        transition:fade
      >
        <div class="font-bold">{tooltipCompany.fullName}</div>
        <div class="text-sm text-gray-500">({tooltipCompany.symbol})</div>
        <div class="text-sm text-gray-600">{tooltipCompany.industryName}</div>
        <div class="mt-2 space-y-1">
          <div>ESG Score: <span class="font-semibold">{getEsgScore(tooltipCompany).toFixed(1)}</span></div>
          <div>Price Change: <span class="font-semibold">{formatPriceChange(tooltipCompany.priceChange)}</span></div>
          <div>Market Cap: <span class="font-semibold">${tooltipCompany.marketCap.toFixed(1)}B</span></div>
          <div>Beta: <span class="font-semibold">{tooltipCompany.beta.toFixed(2)}</span></div>
        </div>
      </div>
    {/if}

    <button
      class="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-white border rounded shadow hover:bg-gray-50"
      onclick={doResetZoom}
    >Reset View</button>

    <svg
      bind:this={svgEl}
      class="w-full h-full"
      viewBox="0 0 {INNER_W + MARGIN.left + MARGIN.right} {innerH + MARGIN.top + MARGIN.bottom}"
      preserveAspectRatio="xMidYMid meet"
      aria-label="ESG Score vs Stock Price Performance Chart"
    >
      <defs>
        <clipPath id="clip-spc">
          <rect width={INNER_W} height={innerH}></rect>
        </clipPath>
      </defs>
      <g transform="translate({MARGIN.left},{MARGIN.top})">
        <g class="x-axis" transform="translate(0,{innerH})"></g>
        <g class="y-axis"></g>
        <text x={INNER_W / 2} y={innerH + MARGIN.bottom - 8} text-anchor="middle" font-size="13" fill="#4b5563">
          {selectedMetric === 'total' ? 'ESG Score' : `${selectedMetric[0].toUpperCase()}${selectedMetric.slice(1)} Score`}
        </text>
        <text transform="rotate(-90)" x={-innerH / 2} y={-MARGIN.left + 16} text-anchor="middle" font-size="13" fill="#4b5563">Price Change (%)</text>
        <g class="circles" clip-path="url(#clip-spc)"></g>
      </g>
    </svg>
  </div>

  <!-- Analysis and Statistics -->
  {#if processedData.length > 0}
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
      {#if insights}
        <div class="lg:col-span-3 bg-gray-50 p-4 rounded-lg">
          <h3 class="text-xl font-semibold mb-4">Analysis Summary</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="text-lg">Most companies clustering between <strong>{insights.esgRange}</strong> ESG scores</div>
              <div class="text-lg">Price changes mostly falling between <strong>{insights.priceRange}</strong></div>
            </div>
            <div class="space-y-4">
              <div class="text-lg">
                {#if insights.performanceTrend === 'positive'}
                  A positive tendency for better price performance in companies with higher ESG scores
                {:else}
                  <strong>No clear positive correlation</strong> between ESG scores and price performance
                {/if}
              </div>
              <div class="text-lg">High variability showing <strong>{insights.predictiveStrength} predictive power</strong> of ESG scores for stock performance</div>
            </div>
          </div>
        </div>
      {/if}
      <div class="lg:col-span-1 space-y-3">
        {#if statistics?.stats?.quartiles}
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-gray-600">ESG Score Range</div>
            <div class="font-semibold">{statistics.stats.quartiles.esg.min.toFixed(1)} - {statistics.stats.quartiles.esg.max.toFixed(1)}</div>
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
