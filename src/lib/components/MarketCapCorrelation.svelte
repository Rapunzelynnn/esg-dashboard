<!-- $lib/components/MarketCapCorrelation.svelte -->
<script lang="ts">
import * as d3 from 'd3';
import { fade } from 'svelte/transition';
import type { Company, IndustryAccumulator, ProcessedCompanyData } from '$lib/types';
import { appState } from '$lib/state.svelte';
import { categoryOrder, industryCategories, getIndustryColor } from '$lib/charts/colors';
import { attachZoom, resetZoom } from '$lib/charts/zoom';

interface Props {
  data?: Company[];
  expanded?: boolean;
}
let { data = [], expanded = false }: Props = $props();

// Chart dimensions
const MARGIN = { top: 20, right: 20, bottom: 60, left: 75 };
let containerWidth = $state(0);
let innerW = $derived(Math.max(0, containerWidth - MARGIN.left - MARGIN.right));
let innerH = $derived(expanded ? 540 : 340);

// DOM ref + zoom state
let svgEl = $state<SVGSVGElement | null>(null);
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
let zoomTransform = $state<d3.ZoomTransform>(d3.zoomIdentity);

// Tooltip
let tooltipCompany = $state<ProcessedCompanyData | null>(null);
let tooltipPos = $state({ x: 0, y: 0 });

// Filter state
let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let viewMode = $state<'absolute' | 'relative'>('relative');
let showDropdown = $state(false);

// Derived: industry stats for relative mode
let industryStats = $derived(
  data.reduce((acc: IndustryAccumulator, company) => {
    if (!acc[company.industryName]) {
      acc[company.industryName] = { companies: [], avgESG: 0, avgMarketCap: 0, stdDevESG: 0 };
    }
    acc[company.industryName].companies.push(company);
    const stats = acc[company.industryName];
    const valid = stats.companies.filter(c => c.esgScores?.total > 0 && !isNaN(c.esgScores.total));
    if (valid.length > 0) {
      stats.avgESG = valid.reduce((s, c) => s + c.esgScores.total, 0) / valid.length;
      const diffs = valid.map(c => Math.pow(c.esgScores.total - stats.avgESG, 2));
      stats.stdDevESG = Math.sqrt(diffs.reduce((s, d) => s + d, 0) / valid.length);
      stats.avgMarketCap = valid.reduce((s, c) => s + c.marketCap, 0) / valid.length;
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

let maxMarketCap = $derived(Math.max(...filteredData.map(d => d.marketCap), 1));
let maxScore = $derived(viewMode === 'absolute' ? 100 : 4);
let minScore = $derived(viewMode === 'absolute' ? 0 : -4);

let industries = $derived(
  [...new Set(marketCapData.map(d => d.industryName))].sort((a, b) => {
    const getCat = (n: string) =>
      Object.entries(industryCategories).find(([_, cat]) => cat.industries.some(i => i.name === n))?.[0] ?? 'Uncategorized';
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
  if (!appState.selectedCompany) return [];
  const selectedCat = Object.entries(industryCategories)
    .find(([_, cat]) => cat.industries.some(i => i.name === appState.selectedCompany!.industryName))?.[0];
  if (!selectedCat) return [appState.selectedCompany.industryName];
  return industryCategories[selectedCat].industries.map(i => i.name);
})()));

// Zoom setup — runs once when svgEl mounts
$effect(() => {
  if (!svgEl) return;
  zoomBehavior = attachZoom(svgEl, (t) => { zoomTransform = t; });
  return () => {
    if (svgEl) d3.select(svgEl).on('.zoom', null);
  };
});

// Render — re-runs when filteredData, viewMode, or zoomTransform changes
$effect(() => {
  if (!svgEl || filteredData.length === 0) return;

  const xBase = d3.scaleLinear().domain([0, maxMarketCap]).range([0, innerW]);
  const yBase = d3.scaleLinear().domain([minScore, maxScore]).range([innerH, 0]);
  const xS = zoomTransform.rescaleX(xBase);
  const yS = zoomTransform.rescaleY(yBase);

  const sel = d3.select(svgEl);

  // X axis
  sel.select<SVGGElement>('.x-axis').call(
    d3.axisBottom(xS).ticks(6).tickFormat(v => {
      const n = +v / 1e9;
      return n >= 1000 ? `${(n / 1000).toFixed(0)}T` : `${Math.round(n)}B`;
    })
  );

  // Y axis
  sel.select<SVGGElement>('.y-axis').call(
    d3.axisLeft(yS).ticks(6).tickFormat(v =>
      viewMode === 'relative' ? `${v}σ` : `${v}`
    )
  );

  const isSelected = (d: ProcessedCompanyData) => d.symbol === appState.selectedCompany?.symbol;

  // Circles — D3 data join
  sel.select<SVGGElement>('.circles')
    .selectAll<SVGCircleElement, ProcessedCompanyData>('circle')
    .data(filteredData, d => d.symbol)
    .join(
      enter => enter.append('circle')
        .on('mouseenter', function(event: MouseEvent, d: ProcessedCompanyData) {
          const rect = svgEl!.getBoundingClientRect();
          tooltipCompany = d;
          tooltipPos = { x: event.clientX - rect.left + 14, y: event.clientY - rect.top - 14 };
        })
        .on('mouseleave', () => { tooltipCompany = null; }),
      update => update,
      exit => exit.remove()
    )
    .attr('cx', d => xS(d.marketCap))
    .attr('cy', d => yS(viewMode === 'absolute' ? d.esgScores.total : d.relativeESG))
    .attr('r', d => isSelected(d) ? 8 : 5)
    .attr('fill', d => colorScale.get(d.industryName) ?? '#94A3B8')
    .attr('opacity', d => appState.selectedCompany && !isSelected(d) ? 0.4 : 0.85)
    .attr('stroke', d => isSelected(d) ? '#1e40af' : d.isOutlier ? '#ef4444' : 'none')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');
});

// Sync industry filter with selected company
$effect(() => {
  if (appState.selectedCompany && industries.length > 0) {
    selectedIndustries = new Set([...relevantIndustries]);
  }
});

function doResetZoom() {
  if (svgEl && zoomBehavior) resetZoom(svgEl, zoomBehavior);
}

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
  selectedIndustries = appState.selectedCompany
    ? new Set([appState.selectedCompany.industryName])
    : new Set();
}

function formatMarketCap(value: number): string {
  if (!value || isNaN(value)) return '$0.00';
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)} billion`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)} million`;
  return `$${value.toFixed(2)}`;
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}
</script>

<svelte:window onclick={() => showDropdown = false} />

<div class="w-full space-y-4">
  <!-- Header and Controls -->
  <div class="flex flex-row justify-between items-center">
    <div class="flex items-center gap-4">
      <h2 class="text-xl font-semibold">ESG Score vs Market Cap</h2>
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
    <div class="w-[200px]">
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search company, symbol, or industry..."
        class="w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>

  <!-- Industry Filters -->
  <div class="flex flex-col space-y-2">
    <div class="flex flex-wrap gap-2 items-center">
      <button class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300" onclick={selectAll}>Select All</button>
      <button class="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300" onclick={clearAll}>Clear All</button>
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
              {#each categoryOrder as category}
                {@const catIndustries = industries.filter(i =>
                  industryCategories[category]?.industries.some(ci => ci.name === i)
                )}
                {#if catIndustries.length > 0}
                  <div class="space-y-2">
                    <div class="text-sm font-semibold text-gray-500">{category}</div>
                    <div class="space-y-1 pl-2">
                      {#each catIndustries as industry}
                        <button
                          class="w-full px-2 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          onclick={() => toggleIndustry(industry)}
                        >
                          <div class="flex items-center flex-1">
                            <div class="w-2 h-2 rounded-full mr-2" style="background-color: {colorScale.get(industry)}"></div>
                            <span>{industry}</span>
                          </div>
                          {#if selectedIndustries.has(industry)}
                            <span class="text-blue-500">✓</span>
                          {/if}
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
          class="px-3 py-1 text-sm rounded-full bg-gray-800 text-white"
          onclick={() => toggleIndustry(industry)}
        >
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full" style="background-color: {colorScale.get(industry)}"></div>
            <span>{industry}</span>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Chart -->
  <div class="relative" style="height: {innerH + MARGIN.top + MARGIN.bottom}px" bind:clientWidth={containerWidth}>
    <!-- Tooltip overlay -->
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
          <div>ESG Score: <span class="font-semibold">{tooltipCompany.esgScores.total.toFixed(1)}</span></div>
          {#if viewMode === 'relative'}
            <div>Industry Z-Score: <span class="font-semibold">{(tooltipCompany.relativeESG || 0).toFixed(2)}σ</span></div>
            <div>Industry Average: <span class="font-semibold">{(tooltipCompany.industryAvg || 0).toFixed(1)}</span></div>
          {/if}
          <div>Market Cap: <span class="font-semibold">{formatMarketCap(tooltipCompany.marketCap)}</span></div>
          {#if tooltipCompany.isOutlier}
            <div class="text-red-500 text-sm mt-1">
              ⚠️ {tooltipCompany.relativeESG > 0 ? 'Significantly above' : 'Significantly below'} industry average
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Reset zoom button -->
    <button
      class="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-white border rounded shadow hover:bg-gray-50"
      onclick={doResetZoom}
    >
      Reset View
    </button>

    {#if innerW > 0}
    <svg
      bind:this={svgEl}
      class="w-full h-full"
      viewBox="0 0 {innerW + MARGIN.left + MARGIN.right} {innerH + MARGIN.top + MARGIN.bottom}"
      preserveAspectRatio="none"
      aria-label="ESG Score vs Market Cap Chart"
    >
      <defs>
        <clipPath id="clip-mcc">
          <rect width={innerW} height={innerH}></rect>
        </clipPath>
      </defs>
      <g transform="translate({MARGIN.left},{MARGIN.top})">
        <g class="x-axis" transform="translate(0,{innerH})"></g>
        <g class="y-axis"></g>
        <!-- Axis labels -->
        <text
          x={innerW / 2}
          y={innerH + MARGIN.bottom - 8}
          text-anchor="middle"
          font-size="13"
          fill="#4b5563"
        >Market Cap (Billions USD)</text>
        <text
          transform="rotate(-90)"
          x={-innerH / 2}
          y={-MARGIN.left + 16}
          text-anchor="middle"
          font-size="13"
          fill="#4b5563"
        >{viewMode === 'absolute' ? 'ESG Score' : 'ESG Score (σ from Industry Mean)'}</text>
        <!-- Circles clipped to chart area -->
        <g class="circles" clip-path="url(#clip-mcc)"></g>
      </g>
    </svg>
    {/if}
  </div>

  <!-- Statistics Panel -->
  {#if filteredData.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Average ESG Score</div>
        <div class="font-semibold">
          {(filteredData.reduce((s, c) => s + c.esgScores.total, 0) / filteredData.length).toFixed(1)}
        </div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Companies Shown</div>
        <div class="font-semibold">{filteredData.length}</div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Outliers</div>
        <div class="font-semibold">{filteredData.filter(c => c.isOutlier).length}</div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Industry Coverage</div>
        <div class="font-semibold">{selectedIndustries.size || industries.length} / {industries.length}</div>
      </div>
    </div>
  {/if}
</div>
