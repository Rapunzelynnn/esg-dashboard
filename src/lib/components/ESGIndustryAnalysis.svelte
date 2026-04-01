<!-- $lib/components/ESGIndustryAnalysis.svelte -->
<script lang="ts">
  import type { Company } from '$lib/types';
  import { appState } from '$lib/state.svelte';

  // Props
  interface Props {
    data?: Company[];
    expanded?: boolean;
  }
  let { data = [], expanded = false }: Props = $props();

  // Types
  interface IndustryData {
    industryName: string;
    environmental: number;
    social: number;
    governance: number;
    total: number;
  }
  type ESGType = 'environmental' | 'social' | 'governance';
  type TooltipContent = {
    visible: boolean;
    score: number;
    type: ESGType;
    industryName: string;
  };

  // Constants
  const maxScore = 100;
  const defaultChartHeight = 320;
  const expandedChartHeight = 500;
  const gridLines = [20, 40, 60, 80];
  const yAxisLabels = [0, 20, 40, 60, 80, 100];
  const barStyles = {
    base: "transition-all duration-200 ease-out transform",
    hover: "scale-105 shadow-lg",
    tooltip: "absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-lg z-50"
  };
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

  // State
  let selectedIndustries = $state(new Set<string>());
  let searchTerm = $state('');
  let showDropdown = $state(false);
  let tooltipContent = $state<TooltipContent>({ visible: false, score: 0, type: 'environmental', industryName: '' });

  // Derived
  let allIndustryData = $derived(processData(data));
  let industries = $derived(
    [...new Set(data.map(d => d.industryName))].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )
  );
  let highlightedIndustry = $derived(appState.selectedCompany?.industryName || '');
  let chartHeight = $derived(expanded ? expandedChartHeight : defaultChartHeight);
  let filteredIndustries = $derived(
    industries.filter(industry => industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  let groupedIndustries = $derived(
    filteredIndustries.reduce((acc, industry) => {
      const category = getIndustryCategory(industry);
      if (!acc[category]) acc[category] = [];
      acc[category].push(industry);
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

  // Update selected industries when selected company or data changes
  $effect(() => {
    if (appState.selectedCompany && industries.length > 0) {
      selectedIndustries = getRelatedIndustries(appState.selectedCompany.industryName);
    } else if (industries.length > 0) {
      selectedIndustries = new Set(industries);
    }
  });

  // Functions
  function getBarColor(type: ESGType): string {
    const colors = { environmental: 'bg-blue-500', social: 'bg-green-500', governance: 'bg-indigo-500' };
    return colors[type];
  }

  function showTooltip(score: number, type: ESGType, industryName: string) {
    tooltipContent = { visible: true, score, type, industryName };
  }

  function hideTooltip() {
    tooltipContent = { ...tooltipContent, visible: false };
  }

  function handleClickOutside() {
    tooltipContent = { ...tooltipContent, visible: false };
    showDropdown = false;
  }

  function getHeight(value: number): string {
    return `${(value / maxScore) * chartHeight}px`;
  }

  function getGridLinePosition(value: number): string {
    return `${(1 - value / maxScore) * chartHeight}px`;
  }

  function formatIndustryName(name: string): string {
    const words = name.split(' ');
    let lines = [''];
    let currentLine = 0;
    words.forEach(word => {
      if (lines[currentLine].length + word.length > 15 && lines[currentLine].length > 0) {
        currentLine++;
        lines[currentLine] = '';
      }
      lines[currentLine] = lines[currentLine] + (lines[currentLine].length ? ' ' : '') + word;
    });
    return lines.join('\n');
  }

  function toggleIndustry(industry: string) {
    if (selectedIndustries.has(industry)) {
      selectedIndustries.delete(industry);
    } else {
      selectedIndustries.add(industry);
    }
    selectedIndustries = new Set(selectedIndustries);
  }

  function selectAll() {
    selectedIndustries = new Set(industries);
  }

  function clearAll() {
    if (appState.selectedCompany?.industryName) {
      selectedIndustries = new Set([appState.selectedCompany.industryName]);
    } else {
      selectedIndustries = new Set();
    }
  }

  function removeIndustry(industry: string) {
    if (industry === appState.selectedCompany?.industryName) return;
    selectedIndustries.delete(industry);
    selectedIndustries = new Set(selectedIndustries);
  }

  function findIndustryCategory(industryName: string): string | null {
    for (const [category, inds] of Object.entries(industryCategories)) {
      if (inds.includes(industryName)) return category;
    }
    return null;
  }

  function getRelatedIndustries(industryName: string): Set<string> {
    const relatedIndustries = new Set<string>();
    if (!industryName) return new Set(allIndustryData.slice(0, 5).map(d => d.industryName));
    relatedIndustries.add(industryName);
    const parentCategory = findIndustryCategory(industryName);
    if (parentCategory && industryCategories[parentCategory]) {
      industryCategories[parentCategory].forEach(industry => {
        if (industries.includes(industry)) relatedIndustries.add(industry);
      });
    }
    if (relatedIndustries.size < 3) {
      allIndustryData
        .filter(d => !relatedIndustries.has(d.industryName))
        .slice(0, 5 - relatedIndustries.size)
        .forEach(d => relatedIndustries.add(d.industryName));
    }
    return relatedIndustries;
  }

  function processData(companies: Company[]): IndustryData[] {
    const industryGroups = companies.reduce((acc, company) => {
      if (!acc[company.industryName]) {
        acc[company.industryName] = { environmental: [], social: [], governance: [] };
      }
      acc[company.industryName].environmental.push(company.esgScores.environmental.score);
      acc[company.industryName].social.push(company.esgScores.social.score);
      acc[company.industryName].governance.push(company.esgScores.governance.score);
      return acc;
    }, {} as Record<string, { environmental: number[]; social: number[]; governance: number[]; }>);
    return Object.entries(industryGroups)
      .map(([industryName, scores]) => ({
        industryName,
        environmental: average(scores.environmental),
        social: average(scores.social),
        governance: average(scores.governance),
        total: average(scores.environmental) + average(scores.social) + average(scores.governance)
      }))
      .sort((a, b) => b.total - a.total);
  }

  function average(arr: number[]): number {
    return arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;
  }

  function getBarStyles(industryName: string) {
    const isHighlighted = industryName === highlightedIndustry;
    return {
      opacity: isHighlighted ? '1' : '0.7',
      transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      zIndex: isHighlighted ? '10' : '1'
    };
  }

  function getIndustryCategory(industryName: string): string {
    for (const [category, inds] of Object.entries(industryCategories)) {
      if (inds.includes(industryName)) return category;
    }
    return 'Other';
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="bg-white p-6 rounded-lg shadow-sm">
  <h2 class="text-xl font-semibold mb-4">Industrial Score Breakdown</h2>

  <!-- Improved Filter UI -->
  <div class="mb-6 space-y-4">
    <div class="flex items-center gap-4">
      <!-- Filter Dropdown -->
      <div class="relative filter-dropdown">
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
                          {#if selectedIndustries.has(industry)}
                            ✓
                          {/if}
                        </span>
                        <span class="text-sm">{industry}</span>
                      </button>
                    {/each}
                  </div>
                {/each}

                <!-- Handle any industries that don't match a category -->
                {#if groupedIndustries['Other'] && groupedIndustries['Other'].length > 0}
                  <div class="mb-4">
                    <div class="px-2 py-1 text-sm font-semibold text-gray-700 bg-gray-100">Other</div>
                    {#each groupedIndustries['Other'].sort() as industry}
                      <button
                        class="w-full px-2 py-1 text-left hover:bg-gray-100 flex items-center"
                        onclick={(e) => { e.stopPropagation(); toggleIndustry(industry); }}
                      >
                        <span class="w-4 h-4 mr-2 border flex items-center justify-center">
                          {#if selectedIndustries.has(industry)}
                            ✓
                          {/if}
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

      <button 
        class="px-3 py-1 border rounded hover:bg-gray-100"
        onclick={() => selectAll()}
      >
        Select All
      </button>
      <button 
        class="px-3 py-1 border rounded hover:bg-gray-100"
        onclick={() => clearAll()}
      >
        Clear All
      </button>
    </div>

    <!-- Selected Industries Display -->
    <div class="flex flex-wrap gap-2">
      {#each [...selectedIndustries] as industry}
        <div class="bg-gray-100 px-2 py-1 rounded-md flex items-center">
          <span>{industry}</span>
          <button
            class="ml-2 text-gray-500 hover:text-gray-700"
            onclick={() => removeIndustry(industry)}
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  </div>



  <!-- Chart Component -->
  <div class="relative w-full" style="height: {chartHeight + 80}px">
    <!-- Fixed container for y-axis labels and grid lines -->
    <div class="absolute inset-0">
      <!-- Y-axis labels -->
      <div class="absolute left-0 top-0 bottom-0 w-16 bg-white z-10">
        {#each yAxisLabels as value}
          <div 
            class="absolute right-0 text-sm text-gray-600 pr-2" 
            style="top: {getGridLinePosition(value)}; transform: translateY(-50%);"
          >
            {value.toFixed(1)}
          </div>
        {/each}
      </div>

      <!-- Grid lines -->
      <div class="absolute left-16 right-0 top-0 h-full">
        {#each gridLines as value}
          <div
            class="absolute w-full border-t border-gray-200"
            style="top: {getGridLinePosition(value)}"
          ></div>
        {/each}
      </div>
    </div>

    <!-- Scrollable container for bars and labels -->
    <div class="absolute left-16 right-0 h-full overflow-x-auto overflow-y-hidden">
      <div class="relative h-full" style="min-width: max-content">
        <!-- Bars container -->
        <div class="relative h-full flex">
          {#each industryData as industry}
            <div 
              class="flex-1 min-w-[160px] relative px-2"
              style={Object.entries(getBarStyles(industry.industryName))
                .map(([key, value]) => `${key}: ${value}`)
                .join(';')}
            >
              <!-- Bars group -->
              <div class="h-full flex items-end justify-center gap-1" style="height: {chartHeight}px">
                <!-- Environmental bar -->
                <div 
                  role="button"
                  tabindex="0"
                  aria-label="Environmental score: {industry.environmental.toFixed(1)}"
                  class="w-8 relative group cursor-pointer transition-all duration-150 hover:scale-105" 
                  style="height: {getHeight(industry.environmental)}"
                  onmouseenter={() => showTooltip(industry.environmental, 'environmental', industry.industryName)}
                  onmouseleave={hideTooltip}
                >
                  <div class="absolute inset-0 {getBarColor('environmental')} transition-all duration-200 group-hover:opacity-80"></div>
                  
                  <!-- Tooltip using Tailwind classes -->
                  {#if tooltipContent.visible && tooltipContent.type === 'environmental' && tooltipContent.industryName === industry.industryName}
                    <div 
                      class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg transition-all duration-200"
                      role="tooltip"
                    >
                      {industry.environmental.toFixed(1)}
                    </div>
                  {/if}
                </div>

                <!-- Social bar -->
                <div 
                  role="button"
                  tabindex="0"
                  aria-label="Social score: {industry.social.toFixed(1)}"
                  class="w-8 relative group cursor-pointer transition-all duration-150 hover:scale-105" 
                  style="height: {getHeight(industry.environmental)}"
                  onmouseenter={() => showTooltip(industry.social, 'social', industry.industryName)}
                  onmouseleave={hideTooltip}
                >
                  <div class="absolute inset-0 {getBarColor('social')} transition-all duration-200 group-hover:opacity-80"></div>
                  
                  <!-- Tooltip using Tailwind classes -->
                  {#if tooltipContent.visible && tooltipContent.type === 'social' && tooltipContent.industryName === industry.industryName}
                    <div 
                      class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg transition-all duration-200"
                      role="tooltip"
                    >
                      {industry.social.toFixed(1)}
                    </div>
                  {/if}
                </div>

                <!-- Governance bar -->
                <div 
                  role="button"
                  tabindex="0"
                  aria-label="Governance score: {industry.governance.toFixed(1)}"
                  class="w-8 relative group cursor-pointer transition-all duration-150 hover:scale-105" 
                  style="height: {getHeight(industry.governance)}"
                  onmouseenter={() => showTooltip(industry.governance, 'governance', industry.industryName)}
                  onmouseleave={hideTooltip}
                >
                  <div class="absolute inset-0 {getBarColor('governance')} transition-all duration-200 group-hover:opacity-80"></div>
                  
                  <!-- Tooltip using Tailwind classes -->
                  {#if tooltipContent.visible && tooltipContent.type === 'governance' && tooltipContent.industryName === industry.industryName}
                    <div 
                      class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg transition-all duration-200"
                      role="tooltip"
                    >
                      {industry.governance.toFixed(1)}
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Highlight indicator for selected industry -->
              {#if industry.industryName === highlightedIndustry}
                <div class="absolute -bottom-1 left-0 right-0 h-1 bg-blue-500 rounded-t-lg"></div>
              {/if}

              <!-- Industry label -->
              <div class="absolute left-1/2 -translate-x-1/2" style="top: {chartHeight + 8}px">
                <div 
                  class="text-xs {industry.industryName === highlightedIndustry ? 'font-semibold text-blue-600' : 'text-gray-600'} text-center whitespace-pre-line"
                  style="width: max-content; max-width: 140px;"
                >
                  {formatIndustryName(industry.industryName)}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Legend -->
  <div class="mt-8 flex justify-center gap-8">
    <div class="flex items-center">
      <div class="w-4 h-4 bg-blue-500 mr-2"></div>
      <span class="text-sm">Environmental</span>
    </div>
    <div class="flex items-center">
      <div class="w-4 h-4 bg-green-500 mr-2"></div>
      <span class="text-sm">Social</span>
    </div>
    <div class="flex items-center">
      <div class="w-4 h-4 bg-indigo-500 mr-2"></div>
      <span class="text-sm">Governance</span>
    </div>
  </div>
</div>

<style>
  /* Add these styles to your ESGIndustryAnalysis component */
  .root-container {
    width: 100%;
    height: 100%;
  }

  /* Adjust the chart height to be larger */
  :global(.chart-container) {
    min-height: 600px !important;
  }

  /* Make bars wider */
  :global(.bar-group) {
    min-width: 180px !important;
  }

  /* Ensure the legend is visible */
  :global(.chart-legend) {
    margin-top: 20px;
    padding-bottom: 20px;
  }
</style>