<!-- $lib/components/ScoreComparison.svelte -->
<script lang="ts">
import * as d3 from 'd3';
import { fade } from 'svelte/transition';
import type { Company } from '$lib/types';
import { appState } from '$lib/state.svelte';
import { categoryOrder, industryCategories, getIndustryColor } from '$lib/charts/colors';
import { attachZoom, resetZoom } from '$lib/charts/zoom';

interface Props {
  data?: Company[];
  expanded?: boolean;
}
let { data = [], expanded = false }: Props = $props();

const MARGIN = { top: 20, right: 20, bottom: 60, left: 75 };
const INNER_W = 900;
let innerH = $derived(expanded ? 540 : 340);

let svgEl = $state<SVGSVGElement | null>(null);
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
let zoomTransform = $state<d3.ZoomTransform>(d3.zoomIdentity);

let tooltipCompany = $state<Company | null>(null);
let tooltipPos = $state({ x: 0, y: 0 });

let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
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
  return industryCategories[currentCategory].industries.map(i => i.name).filter(n => industries.includes(n));
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

let colorScale = $derived(new Map(industries.map(ind => [ind, getIndustryColor(ind)])));

// Bubble radius: governance score mapped to 4–20px
function govRadius(score: number): number {
  return 4 + (score / 100) * 16;
}

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
  const yBase = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);
  const xS = zoomTransform.rescaleX(xBase);
  const yS = zoomTransform.rescaleY(yBase);

  const sel = d3.select(svgEl);

  sel.select<SVGGElement>('.x-axis').call(d3.axisBottom(xS).ticks(6));
  sel.select<SVGGElement>('.y-axis').call(d3.axisLeft(yS).ticks(6));

  const isSelected = (d: Company) => d.symbol === appState.selectedCompany?.symbol;

  sel.select<SVGGElement>('.circles')
    .selectAll<SVGCircleElement, Company>('circle')
    .data(processedData, d => d.symbol)
    .join(
      enter => enter.append('circle')
        .on('mouseenter', function(event: MouseEvent, d: Company) {
          const rect = svgEl!.getBoundingClientRect();
          tooltipCompany = d;
          tooltipPos = { x: event.clientX - rect.left + 14, y: event.clientY - rect.top - 14 };
        })
        .on('mouseleave', () => { tooltipCompany = null; }),
      update => update,
      exit => exit.remove()
    )
    .attr('cx', d => xS(d.esgScores.environmental.score))
    .attr('cy', d => yS(d.esgScores.social.score))
    .attr('r', d => govRadius(d.esgScores.governance.score))
    .attr('fill', d => colorScale.get(d.industryName) ?? '#94A3B8')
    .attr('opacity', d => appState.selectedCompany && !isSelected(d) ? 0.4 : 0.8)
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
      const dropdown = document.querySelector('.sc-industry-dropdown');
      if (!dropdown?.contains(event.target as Node)) showDropdown = false;
    }
  };
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
});

function doResetZoom() {
  if (svgEl && zoomBehavior) resetZoom(svgEl, zoomBehavior);
}

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
  selectedIndustries = appState.selectedCompany
    ? new Set([appState.selectedCompany.industryName])
    : new Set();
}

function handleDropdownClick(event: MouseEvent) {
  event.stopPropagation();
  showDropdown = !showDropdown;
}
</script>

<div class="w-full space-y-4">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
    <h2 class="text-xl font-semibold">ESG Score Components Analysis</h2>
    <input
      type="text"
      bind:value={searchTerm}
      placeholder="Search companies..."
      class="px-3 py-1 border rounded-lg"
    />
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
            class="sc-industry-dropdown absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50"
            onclick={(e) => e.stopPropagation()}
            role="menu"
            tabindex="-1"
            onkeydown={() => {}}
          >
            <div class="p-4 space-y-4">
              {#each categoryOrder as category}
                {@const catIndustries = industries.filter(i => industryCategories[category]?.industries.some(ci => ci.name === i))}
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
          <div>Environmental: <span class="font-semibold">{tooltipCompany.esgScores.environmental.score.toFixed(1)}</span></div>
          <div>Social: <span class="font-semibold">{tooltipCompany.esgScores.social.score.toFixed(1)}</span></div>
          <div>Governance: <span class="font-semibold">{tooltipCompany.esgScores.governance.score.toFixed(1)}</span></div>
          <div class="text-sm text-gray-500 mt-2">Beta: {tooltipCompany.beta.toFixed(2)}</div>
        </div>
      </div>
    {/if}

    <button
      class="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-white border rounded shadow hover:bg-gray-50"
      onclick={doResetZoom}
    >
      Reset View
    </button>

    <!-- Bubble size legend -->
    <div class="absolute right-4 top-10 bg-white/80 p-2 rounded-lg shadow-lg z-10">
      <div class="text-sm text-gray-600 font-medium">Bubble Size</div>
      <div class="text-xs text-gray-500">= Governance Score</div>
      <div class="flex items-center mt-2 gap-3">
        {#each [[0, 4], [25, 8], [50, 12], [75, 16], [100, 20]] as [label, size]}
          <div class="flex flex-col items-center">
            <div class="rounded-full bg-gray-400" style="width:{size}px;height:{size}px"></div>
            <span class="text-xs mt-1">{label}</span>
          </div>
        {/each}
      </div>
    </div>

    <svg
      bind:this={svgEl}
      class="w-full h-full"
      viewBox="0 0 {INNER_W + MARGIN.left + MARGIN.right} {innerH + MARGIN.top + MARGIN.bottom}"
      preserveAspectRatio="xMidYMid meet"
      aria-label="ESG Score Components Bubble Chart"
    >
      <defs>
        <clipPath id="clip-sc">
          <rect width={INNER_W} height={innerH}></rect>
        </clipPath>
      </defs>
      <g transform="translate({MARGIN.left},{MARGIN.top})">
        <g class="x-axis" transform="translate(0,{innerH})"></g>
        <g class="y-axis"></g>
        <text x={INNER_W / 2} y={innerH + MARGIN.bottom - 8} text-anchor="middle" font-size="13" fill="#4b5563">Environmental Score</text>
        <text transform="rotate(-90)" x={-innerH / 2} y={-MARGIN.left + 16} text-anchor="middle" font-size="13" fill="#4b5563">Social Score</text>
        <g class="circles" clip-path="url(#clip-sc)"></g>
      </g>
    </svg>
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
        <div class="font-semibold">{(processedData.reduce((s, c) => s + c.esgScores.environmental.score, 0) / processedData.length).toFixed(1)}</div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Avg Social</div>
        <div class="font-semibold">{(processedData.reduce((s, c) => s + c.esgScores.social.score, 0) / processedData.length).toFixed(1)}</div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Avg Governance</div>
        <div class="font-semibold">{(processedData.reduce((s, c) => s + c.esgScores.governance.score, 0) / processedData.length).toFixed(1)}</div>
      </div>
    </div>
  {/if}
</div>
