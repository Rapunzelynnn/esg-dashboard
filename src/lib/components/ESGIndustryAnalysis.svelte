<!-- $lib/components/ESGIndustryAnalysis.svelte -->
<script lang="ts">
import * as d3 from 'd3';
import type { Company } from '$lib/types';
import { appState } from '$lib/state.svelte';

interface Props {
  data?: Company[];
  expanded?: boolean;
}
let { data = [], expanded = false }: Props = $props();

interface IndustryData {
  industryName: string;
  environmental: number;
  social: number;
  governance: number;
  total: number;
}
type ESGType = 'environmental' | 'social' | 'governance';

const BAR_COLORS: Record<ESGType, string> = {
  environmental: '#3b82f6',
  social: '#22c55e',
  governance: '#6366f1'
};

const MARGIN = { top: 20, right: 20, left: 60 };
let containerWidth = $state(0);
let innerW = $derived(Math.max(0, containerWidth - MARGIN.left - MARGIN.right));
let innerH = $derived(expanded ? 440 : 280);

const industryCategories: Record<string, string[]> = {
  'Energy': ['Oil & Gas Upstream & Integrated','Oil & Gas Storage & Transportation','Oil & Gas Refining & Marketing','Energy Equipment & Services'],
  'Materials': ['Chemicals','Construction Materials','Metals & Mining','Containers & Packaging','Steel'],
  'Industrials': ['Aerospace & Defense','Airlines','Building Products','Machinery and Electrical Equipment','Electrical Components & Equipment','Trading Companies & Distributors','Professional Services','Commercial Services & Supplies','Construction & Engineering','Transportation and Transportation Infrastructure','Auto Components'],
  'Consumer Discretionary': ['Automobiles','Retailing','Restaurants & Leisure Facilities','Hotels, Resorts & Cruise Lines','Leisure Equipment & Products and Consumer Electronics','Homebuilding','Textiles, Apparel & Luxury Goods','Casinos & Gaming','Household Durables'],
  'Consumer Staples': ['Food Products','Food & Staples Retailing','Household Products','Personal Products','Beverages','Tobacco'],
  'Health Care': ['Biotechnology','Pharmaceuticals','Health Care Equipment & Supplies','Health Care Providers & Services','Life Sciences Tools & Services'],
  'Financials': ['Banks','Diversified Financial Services and Capital Markets','Insurance','Real Estate Management & Development','Equity Real Estate Investment Trusts (REITs)'],
  'Information Technology': ['Semiconductors & Semiconductor Equipment','Software','IT Services','Computers & Peripherals and Office Electronics','Communications Equipment','Electronic Equipment, Instruments & Components'],
  'Communication Services': ['Interactive Media, Services & Home Entertainment','Media, Movies & Entertainment','Telecommunication Services'],
  'Utilities': ['Electric Utilities','Gas Utilities','Multi and Water Utilities']
};

let svgEl = $state<SVGSVGElement | null>(null);
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
let zoomTransform = $state<d3.ZoomTransform>(d3.zoomIdentity);

let tooltipContent = $state<{ visible: boolean; score: number; type: ESGType; industryName: string }>({
  visible: false, score: 0, type: 'environmental', industryName: ''
});
let tooltipPos = $state({ x: 0, y: 0 });

let selectedIndustries = $state(new Set<string>());
let searchTerm = $state('');
let showDropdown = $state(false);

let allIndustryData = $derived(processData(data));

let industries = $derived(
  [...new Set(data.map(d => d.industryName))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  )
);

let highlightedIndustry = $derived(appState.selectedCompany?.industryName || '');

let filteredIndustries = $derived(
  industries.filter(ind => ind.toLowerCase().includes(searchTerm.toLowerCase()))
);

let groupedIndustries = $derived(
  filteredIndustries.reduce((acc, ind) => {
    const cat = getIndustryCategory(ind);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ind);
    return acc;
  }, {} as Record<string, string[]>)
);

let sortedCategories = $derived(
  Object.keys(industryCategories).filter(cat => groupedIndustries[cat]?.length > 0)
);

let industryData = $derived(
  allIndustryData
    .filter(d => selectedIndustries.has(d.industryName))
    .sort((a, b) => {
      if (a.industryName === highlightedIndustry) return -1;
      if (b.industryName === highlightedIndustry) return 1;
      return b.total - a.total;
    })
);

let xBase = $derived(
  d3.scaleBand().domain(industryData.map(d => d.industryName)).range([0, innerW]).padding(0.25)
);
let bwScaled = $derived(xBase.bandwidth() * zoomTransform.k);
let marginBottom = $derived(bwScaled < 80 ? 150 : 80);

// Zoom setup — X-only pan/zoom for bar chart
$effect(() => {
  if (!svgEl) return;
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [innerW + MARGIN.left + MARGIN.right, innerH + MARGIN.top + marginBottom]])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      // Only apply X translation/scale; keep Y fixed
      const t = event.transform;
      zoomTransform = d3.zoomIdentity.translate(t.x, 0).scale(t.k);
    });
  zoomBehavior = zoom;
  d3.select(svgEl).call(zoom);
  return () => { if (svgEl) d3.select(svgEl).on('.zoom', null); };
});

// Render
$effect(() => {
  if (!svgEl || industryData.length === 0) return;

  const xBarBase = d3.scaleBand().domain(['environmental', 'social', 'governance'] as ESGType[]).range([0, xBase.bandwidth()]).padding(0.05);
  const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

  // Apply zoom transform to x scales only
  const xScaled = (name: string) => {
    const original = xBase(name) ?? 0;
    return zoomTransform.x + original * zoomTransform.k;
  };

  const sel = d3.select(svgEl);

  // Y axis (static)
  sel.select<SVGGElement>('.y-axis').call(d3.axisLeft(yScale).ticks(5));

  // X axis — render only visible labels, rotating when bands are narrow
  const xAxisGroup = sel.select<SVGGElement>('.x-axis');
  xAxisGroup.selectAll('*').remove();
  const shouldRotate = bwScaled < 80;
  industryData.forEach(d => {
    const xPos = xScaled(d.industryName);
    if (xPos < -bwScaled || xPos > innerW) return; // skip off-screen
    const cx = xPos + bwScaled / 2;
    const isHighlighted = d.industryName === highlightedIndustry;
    if (shouldRotate) {
      xAxisGroup.append('text')
        .attr('transform', `translate(${cx},8) rotate(-45)`)
        .attr('text-anchor', 'end')
        .attr('font-size', 10)
        .attr('fill', isHighlighted ? '#2563eb' : '#4b5563')
        .attr('font-weight', isHighlighted ? 'bold' : 'normal')
        .text(d.industryName.length > 32 ? d.industryName.slice(0, 30) + '…' : d.industryName);
    } else {
      // Multi-line wrapping via tspan
      const words = d.industryName.split(' ');
      const lines: string[] = [''];
      let lineIdx = 0;
      words.forEach(w => {
        if (lines[lineIdx].length + w.length > 15 && lines[lineIdx].length > 0) {
          lineIdx++;
          lines.push('');
        }
        lines[lineIdx] = lines[lineIdx] + (lines[lineIdx].length ? ' ' : '') + w;
      });
      const fontSize = Math.max(9, Math.min(12, bwScaled / 8));
      const textEl = xAxisGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', fontSize)
        .attr('fill', isHighlighted ? '#2563eb' : '#4b5563')
        .attr('font-weight', isHighlighted ? 'bold' : 'normal');
      lines.forEach((lineText, i) => {
        textEl.append('tspan')
          .attr('x', cx)
          .attr('dy', i === 0 ? 16 : '1.2em')
          .text(lineText);
      });
    }
  });

  // Bars
  const barsGroup = sel.select<SVGGElement>('.bars');
  const esgTypes: ESGType[] = ['environmental', 'social', 'governance'];

  barsGroup.selectAll<SVGGElement, IndustryData>('g.industry-group')
    .data(industryData, d => d.industryName)
    .join(
      enter => enter.append('g').attr('class', 'industry-group'),
      update => update,
      exit => exit.remove()
    )
    .each(function(d) {
      const xPos = xScaled(d.industryName);
      d3.select(this).attr('transform', `translate(${xPos},0)`);

      d3.select(this).selectAll<SVGRectElement, ESGType>('rect')
        .data(esgTypes)
        .join('rect')
        .attr('x', type => (xBarBase(type) ?? 0) * zoomTransform.k)
        .attr('width', xBarBase.bandwidth() * zoomTransform.k)
        .attr('y', type => yScale(d[type]))
        .attr('height', type => innerH - yScale(d[type]))
        .attr('fill', type => BAR_COLORS[type])
        .attr('opacity', d.industryName === highlightedIndustry ? 1 : 0.7)
        .style('cursor', 'pointer')
        .on('mouseenter', function(event: MouseEvent, type: ESGType) {
          const rect = svgEl!.getBoundingClientRect();
          tooltipContent = { visible: true, score: d[type], type, industryName: d.industryName };
          tooltipPos = { x: event.clientX - rect.left + 14, y: event.clientY - rect.top - 14 };
        })
        .on('mouseleave', () => { tooltipContent = { ...tooltipContent, visible: false }; });
    });
});

// Sync selected industries with selected company
$effect(() => {
  if (appState.selectedCompany && industries.length > 0) {
    selectedIndustries = getRelatedIndustries(appState.selectedCompany.industryName);
  } else if (industries.length > 0) {
    selectedIndustries = new Set(industries);
  }
});

function doResetZoom() {
  if (svgEl && zoomBehavior) {
    d3.select(svgEl).transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
  }
}

function processData(companies: Company[]): IndustryData[] {
  const groups = companies.reduce((acc, c) => {
    if (!acc[c.industryName]) acc[c.industryName] = { environmental: [], social: [], governance: [] };
    acc[c.industryName].environmental.push(c.esgScores.environmental.score);
    acc[c.industryName].social.push(c.esgScores.social.score);
    acc[c.industryName].governance.push(c.esgScores.governance.score);
    return acc;
  }, {} as Record<string, { environmental: number[]; social: number[]; governance: number[] }>);
  return Object.entries(groups).map(([name, scores]) => ({
    industryName: name,
    environmental: avg(scores.environmental),
    social: avg(scores.social),
    governance: avg(scores.governance),
    total: avg(scores.environmental) + avg(scores.social) + avg(scores.governance)
  })).sort((a, b) => b.total - a.total);
}

function avg(arr: number[]): number {
  return arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;
}

function getIndustryCategory(name: string): string {
  for (const [cat, inds] of Object.entries(industryCategories)) {
    if (inds.includes(name)) return cat;
  }
  return 'Other';
}

function findIndustryCategory(name: string): string | null {
  for (const [cat, inds] of Object.entries(industryCategories)) {
    if (inds.includes(name)) return cat;
  }
  return null;
}

function getRelatedIndustries(industryName: string): Set<string> {
  const result = new Set<string>();
  if (!industryName) return new Set(allIndustryData.slice(0, 5).map(d => d.industryName));
  result.add(industryName);
  const cat = findIndustryCategory(industryName);
  if (cat && industryCategories[cat]) {
    industryCategories[cat].forEach(ind => { if (industries.includes(ind)) result.add(ind); });
  }
  if (result.size < 3) {
    allIndustryData.filter(d => !result.has(d.industryName)).slice(0, 5 - result.size).forEach(d => result.add(d.industryName));
  }
  return result;
}

function toggleIndustry(industry: string) {
  if (selectedIndustries.has(industry)) {
    selectedIndustries.delete(industry);
  } else {
    selectedIndustries.add(industry);
  }
  selectedIndustries = new Set(selectedIndustries);
}

function selectAll() { selectedIndustries = new Set(industries); }

function clearAll() {
  selectedIndustries = appState.selectedCompany?.industryName
    ? new Set([appState.selectedCompany.industryName])
    : new Set();
}

function removeIndustry(industry: string) {
  if (industry === appState.selectedCompany?.industryName) return;
  selectedIndustries.delete(industry);
  selectedIndustries = new Set(selectedIndustries);
}
</script>

<svelte:window onclick={() => showDropdown = false} />

<div class="bg-white p-6 rounded-lg shadow-sm">
  <h2 class="text-xl font-semibold mb-4">Industrial Score Breakdown</h2>

  <!-- Filter UI -->
  <div class="mb-6 space-y-4">
    <div class="flex items-center gap-4">
      <div class="relative">
        <button
          class="px-4 py-2 border rounded-md flex items-center justify-between w-[200px]"
          onclick={(e) => { e.stopPropagation(); showDropdown = !showDropdown; }}
        >
          <span>Select Industries</span>
          <span class="ml-2">▼</span>
        </button>
        {#if showDropdown}
          <div class="absolute top-full left-0 mt-1 w-[400px] max-h-[300px] overflow-y-auto bg-white border rounded-md shadow-lg z-50">
            <div class="p-2">
              <input
                type="text"
                placeholder="Search industries..."
                class="w-full px-3 py-2 border rounded-md mb-2"
                bind:value={searchTerm}
              />
              {#if filteredIndustries.length === 0}
                <div class="p-2 text-gray-500">No industries found</div>
              {:else}
                {#each sortedCategories as category}
                  <div class="mb-4">
                    <div class="px-2 py-1 text-sm font-semibold text-gray-700 bg-gray-100">{category}</div>
                    {#each groupedIndustries[category].sort() as industry}
                      <button
                        class="w-full px-2 py-1 text-left hover:bg-gray-100 flex items-center"
                        onclick={(e) => { e.stopPropagation(); toggleIndustry(industry); }}
                      >
                        <span class="w-4 h-4 mr-2 border flex items-center justify-center">
                          {#if selectedIndustries.has(industry)}✓{/if}
                        </span>
                        <span class="text-sm">{industry}</span>
                      </button>
                    {/each}
                  </div>
                {/each}
                {#if groupedIndustries['Other']?.length > 0}
                  <div class="mb-4">
                    <div class="px-2 py-1 text-sm font-semibold text-gray-700 bg-gray-100">Other</div>
                    {#each groupedIndustries['Other'].sort() as industry}
                      <button
                        class="w-full px-2 py-1 text-left hover:bg-gray-100 flex items-center"
                        onclick={(e) => { e.stopPropagation(); toggleIndustry(industry); }}
                      >
                        <span class="w-4 h-4 mr-2 border flex items-center justify-center">
                          {#if selectedIndustries.has(industry)}✓{/if}
                        </span>
                        <span class="text-sm">{industry}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        {/if}
      </div>
      <button class="px-3 py-1 border rounded hover:bg-gray-100" onclick={selectAll}>Select All</button>
      <button class="px-3 py-1 border rounded hover:bg-gray-100" onclick={clearAll}>Clear All</button>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each [...selectedIndustries] as industry}
        <div class="bg-gray-100 px-2 py-1 rounded-md flex items-center">
          <span>{industry}</span>
          <button class="ml-2 text-gray-500 hover:text-gray-700" onclick={() => removeIndustry(industry)}>×</button>
        </div>
      {/each}
    </div>
  </div>

  <!-- Chart -->
  <div class="relative" style="height: {innerH + MARGIN.top + marginBottom}px" bind:clientWidth={containerWidth}>
    {#if tooltipContent.visible}
      <div
        class="absolute z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
        style="left:{tooltipPos.x}px; top:{tooltipPos.y}px"
        role="tooltip"
      >
        <div class="font-semibold capitalize">{tooltipContent.type}</div>
        <div>{tooltipContent.score.toFixed(1)}</div>
        <div class="text-gray-300 text-xs">{tooltipContent.industryName}</div>
      </div>
    {/if}

    <button
      class="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-white border rounded shadow hover:bg-gray-50"
      onclick={doResetZoom}
    >Reset View</button>

    {#if innerW > 0}
    <svg
      bind:this={svgEl}
      class="w-full h-full"
      viewBox="0 0 {innerW + MARGIN.left + MARGIN.right} {innerH + MARGIN.top + marginBottom}"
      preserveAspectRatio="none"
      aria-label="Industry ESG Score Breakdown Bar Chart"
    >
      <defs>
        <clipPath id="clip-eia">
          <rect width={innerW} height={innerH}></rect>
        </clipPath>
      </defs>
      <g transform="translate({MARGIN.left},{MARGIN.top})">
        <g class="y-axis"></g>
        <!-- X-axis labels rendered by D3 effect -->
        <g class="x-axis" transform="translate(0,{innerH + 8})"></g>
        <!-- Y-axis label -->
        <text transform="rotate(-90)" x={-innerH / 2} y={-MARGIN.left + 14} text-anchor="middle" font-size="12" fill="#4b5563">Score (0–100)</text>
        <!-- Bars (clipped) -->
        <g class="bars" clip-path="url(#clip-eia)"></g>
      </g>
    </svg>
    {/if}
  </div>

  <!-- Legend -->
  <div class="mt-4 flex justify-center gap-8">
    <div class="flex items-center">
      <div class="w-4 h-4 mr-2" style="background:{BAR_COLORS.environmental}"></div>
      <span class="text-sm">Environmental</span>
    </div>
    <div class="flex items-center">
      <div class="w-4 h-4 mr-2" style="background:{BAR_COLORS.social}"></div>
      <span class="text-sm">Social</span>
    </div>
    <div class="flex items-center">
      <div class="w-4 h-4 mr-2" style="background:{BAR_COLORS.governance}"></div>
      <span class="text-sm">Governance</span>
    </div>
  </div>
</div>
