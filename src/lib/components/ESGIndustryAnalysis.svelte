<!-- $lib/components/ESGIndustryAnalysis.svelte -->
<script lang="ts">
  import type { Company } from '$lib/types';
  import { selectedCompany } from '$lib/stores';
  import {onMount} from 'svelte'

  // Props
  export let data: Company[] = [];
  export let expanded = false;

  // Types and Interfaces
  interface IndustryData {
    industryName: string;
    environmental: number;
    social: number;
    governance: number;
    total: number;
    sector: string; // Added sector field
  }

  type ESGType = 'environmental' | 'social' | 'governance';
  
  interface TooltipContent {
    visible: boolean;
    score: number;
    type: ESGType;
    industryName: string;
  }

  // Constants
  const CHART_CONFIG = {
    maxScore: 100,
    defaultHeight: 320,
    expandedHeight: 500,
    gridLines: [20, 40, 60, 80],
    yAxisLabels: [0, 20, 40, 60, 80, 100],
    barWidth: 8,
    barGap: 1
  };

  // Industry Sector Groupings
  const INDUSTRY_SECTORS = {
    'Energy': [
      'Oil & Gas Upstream & Integrated',
      'Oil & Gas Storage & Transportation',
      'Oil & Gas Refining & Marketing',
      'Energy Equipment & Services'
    ],
    'Materials': [
      'Chemicals',
      'Construction Materials',
      'Metals & Mining',
      'Containers & Packaging',
      'Steel'
    ],
    'Industrials': [
      'Aerospace & Defense',
      'Airlines',
      'Building Products',
      'Machinery and Electrical Equipment',
      'Electrical Components & Equipment',
      'Trading Companies & Distributors',
      'Professional Services',
      'Commercial Services & Supplies',
      'Construction & Engineering',
      'Transportation and Transportation Infrastructure',
      'Auto Components'
    ],
    'Consumer Discretionary': [
      'Automobiles',
      'Retailing',
      'Restaurants & Leisure Facilities',
      'Hotels, Resorts & Cruise Lines',
      'Leisure Equipment & Products and Consumer Electronics',
      'Homebuilding',
      'Textiles, Apparel & Luxury Goods',
      'Casinos & Gaming',
      'Household Durables'
    ],
    'Consumer Staples': [
      'Food Products',
      'Food & Staples Retailing',
      'Household Products',
      'Personal Products',
      'Beverages',
      'Tobacco'
    ],
    'Health Care': [
      'Biotechnology',
      'Pharmaceuticals',
      'Health Care Equipment & Supplies',
      'Health Care Providers & Services',
      'Life Sciences Tools & Services'
    ],
    'Financials': [
      'Banks',
      'Diversified Financial Services and Capital Markets',
      'Insurance',
      'Real Estate Management & Development',
      'Equity Real Estate Investment Trusts (REITs)'
    ],
    'Information Technology': [
      'Semiconductors & Semiconductor Equipment',
      'Software',
      'IT Services',
      'Computers & Peripherals and Office Electronics',
      'Communications Equipment',
      'Electronic Equipment, Instruments & Components'
    ],
    'Communication Services': [
      'Interactive Media, Services & Home Entertainment',
      'Media, Movies & Entertainment',
      'Telecommunication Services'
    ],
    'Utilities': [
      'Electric Utilities',
      'Gas Utilities',
      'Multi and Water Utilities'
    ]
  } as const;

  // Create reverse mapping for quick sector lookup
  const INDUSTRY_TO_SECTOR = Object.entries(INDUSTRY_SECTORS).reduce((acc, [sector, industries]) => {
    industries.forEach(industry => {
      acc[industry] = sector;
    });
    return acc;
  }, {} as Record<string, string>);

  // State Management
  let selectedIndustries = new Set<string>();
  let searchTerm = '';
  let showDropdown = false;
  let initialized = false;
  let chartHeight = expanded ? CHART_CONFIG.expandedHeight : CHART_CONFIG.defaultHeight;
  // Track company changes
  let previousCompany: string | undefined;

  // Tooltip state
  let tooltipContent: TooltipContent = {
    visible: false,
    score: 0,
    type: 'environmental',
    industryName: ''
  };

  // Reactive declarations
  $: allIndustryData = processData(data);
  $: industries = [...new Set(data.map(d => d.industryName))].sort();
  $: highlightedIndustry = $selectedCompany?.industryName || '';

  $: chartHeight = expanded ? CHART_CONFIG.expandedHeight : CHART_CONFIG.defaultHeight;

  // Filter and grouping logic
  $: filteredIndustries = industries.filter(industry => 
    industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group industries by sector
  $: groupedIndustries = filteredIndustries.reduce((acc, industry) => {
    const sector = INDUSTRY_TO_SECTOR[industry] || 'Other';
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(industry);
    return acc;
  }, {} as Record<string, string[]>);

  // Sort sectors alphabetically
  $: sortedSectors = Object.keys(groupedIndustries).sort();

  // Functions
  function getBarColor(type: ESGType, isHighlighted: boolean = false): string {
    const baseColors = {
      environmental: 'bg-blue-500',
      social: 'bg-green-500',
      governance: 'bg-indigo-500'
    };
    return `${baseColors[type]} ${isHighlighted ? 'opacity-100' : 'opacity-70'}`;
  }

  function showTooltip(score: number, type: ESGType, industryName: string) {
    tooltipContent = { visible: true, score, type, industryName };
  }

  function hideTooltip() {
    tooltipContent.visible = false;
  }

  // Optimize filtering and grouping
  const dataCache = new Map<string, IndustryData[]>();
  const filteredCache = new Map<string, string[]>();

  // Process data with sector information
  function processData(companies: Company[]): IndustryData[] {
    // Memoize the results based on companies input
    const cacheKey = JSON.stringify(companies.map(c => c.industryName));
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey)!;
    }

    const industryGroups = new Map();
    
    for (const company of companies) {
      if (!industryGroups.has(company.industryName)) {
        industryGroups.set(company.industryName, {
          environmental: [],
          social: [],
          governance: [],
          sector: INDUSTRY_TO_SECTOR[company.industryName] || 'Other'
        });
      }
      
      const group = industryGroups.get(company.industryName);
      group.environmental.push(company.esgScores.environmental.score);
      group.social.push(company.esgScores.social.score);
      group.governance.push(company.esgScores.governance.score);
    }
    

    const result = Array.from(industryGroups.entries())
      .map(([industryName, data]) => ({
        industryName,
        environmental: average(data.environmental),
        social: average(data.social),
        governance: average(data.governance),
        total: average(data.environmental) + average(data.social) + average(data.governance),
        sector: data.sector
      }))
      .sort((a, b) => b.total - a.total);

    dataCache.set(cacheKey, result);
    return result;
  }


  function average(arr: number[]): number {
    return arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;
  }

  // Selection handling
  function toggleIndustry(industry: string, keepDropdownState: boolean = false) {
    if (!$selectedCompany) return;
    
    // Batch updates using the Set operations
    const newSet = new Set(selectedIndustries);
    
    if (industry !== $selectedCompany.industryName) {
      if (newSet.has(industry)) {
        newSet.delete(industry);
      } else {
        newSet.add(industry);
      }
      
      selectedIndustries = newSet;
    }

    if (!keepDropdownState) {
      showDropdown = false;
    }
  }


  // Modified selectAll function
  function selectAll() {
    if (!$selectedCompany) return;
    // Pre-filter industries to avoid multiple array operations
    const visibleIndustries = new Set(filteredIndustries);
    selectedIndustries = visibleIndustries;
    // Ensure current company's industry is included
    selectedIndustries.add($selectedCompany.industryName);
  }

  // Optimized clearAll function
  function clearAll() {
    if (!$selectedCompany) return;
    selectedIndustries = new Set([$selectedCompany.industryName]);
    searchTerm = '';
    showDropdown = false;
  }

  // Memoized function for getting ordered industry data
  let cachedOrderedData: IndustryData[] = [];
  let lastSelectedIndustries: Set<string> = new Set();

  // Add helper function to check if industry is selectable
  function isIndustrySelectable(industry: string): boolean {
    return industry !== $selectedCompany?.industryName;
  }

  // Function to get ordered industry data
  function getOrderedIndustryData(): IndustryData[] {
    if (!$selectedCompany) return [];

    // Check if we can use cached data
    const selectedIndustriesString = JSON.stringify([...selectedIndustries].sort());
    const lastSelectedIndustriesString = JSON.stringify([...lastSelectedIndustries].sort());
    
    if (selectedIndustriesString === lastSelectedIndustriesString && cachedOrderedData.length > 0) {
      return cachedOrderedData;
    }

    const selectedIndustryName = $selectedCompany.industryName;
    
    // Filter and sort data
    const orderedData = allIndustryData
      .filter(d => selectedIndustries.has(d.industryName))
      .sort((a, b) => {
        if (a.industryName === selectedIndustryName) return -1;
        if (b.industryName === selectedIndustryName) return 1;
        
        const aSector = INDUSTRY_TO_SECTOR[a.industryName];
        const bSector = INDUSTRY_TO_SECTOR[b.industryName];
        const selectedSector = INDUSTRY_TO_SECTOR[selectedIndustryName];
        
        if (aSector === selectedSector && bSector !== selectedSector) return -1;
        if (bSector === selectedSector && aSector !== selectedSector) return 1;
        
        return b.total - a.total;
      });

    // Update cache
    cachedOrderedData = orderedData;
    lastSelectedIndustries = new Set(selectedIndustries);
    
    return orderedData;
  }

  // Update initialization logic
  function initializeSelectedIndustries(company: Company) {
    const selectedIndustryName = company.industryName;
    const selectedSector = INDUSTRY_TO_SECTOR[selectedIndustryName];
    
    // Get ALL industries from the same sector without limitation
    const sectorIndustries = allIndustryData
      .filter(data => INDUSTRY_TO_SECTOR[data.industryName] === selectedSector)
      .map(data => data.industryName);
    
    selectedIndustries = new Set(sectorIndustries);
  }

  // Modified initialization and company change handling
  $: {
    if ($selectedCompany && data.length > 0) {
      const currentCompany = $selectedCompany.industryName;
      const currentSector = INDUSTRY_TO_SECTOR[currentCompany];
      
      // Reset selections when company changes
      if (previousCompany !== currentCompany) {
        const newSelections = new Set<string>();
        
        // Add all industries from current sector
        allIndustryData
          .filter(data => INDUSTRY_TO_SECTOR[data.industryName] === currentSector)
          .forEach(data => newSelections.add(data.industryName));
        
        selectedIndustries = newSelections;
        previousCompany = currentCompany;
        searchTerm = '';
        showDropdown = false;
      }
    }
  }
  // Add helper function to determine if industry can be deselected
  function canDeselect(industry: string): boolean {
    return industry !== $selectedCompany?.industryName;
  }


  // reactive statement to update selections when data changes
  $: {
    if (data.length > 0 && selectedIndustries.size > 0) {
      // Remove any selected industries that don't exist in the current data
      const validIndustries = new Set(industries);
      selectedIndustries = new Set(
        [...selectedIndustries].filter(industry => validIndustries.has(industry))
      );
    }
  }

  // Handle dropdown closing when company changes
  $: if ($selectedCompany) {
    showDropdown = false;
  }

  onMount(() => {
    if ($selectedCompany) {
      initializeSelectedIndustries($selectedCompany);
      previousCompany = $selectedCompany.industryName;
      initialized = true;
    }
  });

  // Optimize dropdown menu rendering
  const ITEMS_PER_PAGE = 20;
  let currentPage = 0;

  $: visibleIndustries = filteredIndustries.slice(0, (currentPage + 1) * ITEMS_PER_PAGE);

  function loadMore() {
    currentPage++;
  }

  // Add intersection observer for infinite scroll
  let dropdownContainer: HTMLElement;
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleIndustries.length < filteredIndustries.length) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (dropdownContainer) {
      observer.observe(dropdownContainer);
    }

    return () => observer.disconnect();
  });
</script>

<div class="bg-white p-6 rounded-lg shadow-sm">
  <h2 class="text-xl font-semibold mb-4">Industrial Score Breakdown</h2>

  <!-- Industry Selection Controls -->
  <div class="mb-6 space-y-4">
    <div class="flex items-center gap-4">
      <!-- Dropdown Button -->
      <div class="relative">
        <button
          class="px-4 py-2 border rounded-md flex items-center justify-between w-[200px] hover:bg-gray-50 
                 {!$selectedCompany ? 'opacity-50 cursor-not-allowed' : ''}"
          on:click|stopPropagation={() => $selectedCompany && (showDropdown = !showDropdown)}
          disabled={!$selectedCompany}
        >
          <span>Select Industries</span>
          <span class="ml-2">▼</span>
        </button>

        <!-- Dropdown Menu -->
        {#if showDropdown && $selectedCompany}
          <div 
            class="absolute top-full left-0 mt-1 w-[400px] max-h-[400px] overflow-y-auto bg-white border rounded-md shadow-lg z-50"
            bind:this={dropdownContainer}
          >
            <!-- Search Input -->
            <div class="sticky top-0 bg-white p-2 border-b">
              <input
                type="text"
                placeholder="Search industries..."
                class="w-full px-3 py-2 border rounded-md"
                bind:value={searchTerm}
                on:input={() => {
                  currentPage = 0;
                }}
              />
            </div>

            <!-- Dropdown content -->
            <div class="p-2">
              {#each Object.entries(groupedIndustries) as [sector, industries]}
                {#if industries.some(industry => visibleIndustries.includes(industry))}
                  <div class="mb-4">
                    <div class="px-2 py-1 text-sm font-semibold bg-gray-100 rounded">
                      {sector}
                    </div>
                    {#each industries.filter(industry => visibleIndustries.includes(industry)) as industry (industry)}
                      {@const isSelected = selectedIndustries.has(industry)}
                      {@const isCurrentIndustry = industry === $selectedCompany.industryName}
                      <button
                        class="w-full px-2 py-1 mt-1 text-left hover:bg-gray-50 flex items-center
                              {isCurrentIndustry ? 'cursor-not-allowed opacity-75' : ''}"
                        on:click|stopPropagation={() => !isCurrentIndustry && toggleIndustry(industry, true)}
                      >
                        <span class="w-4 h-4 mr-2 border rounded flex items-center justify-center
                                  {isSelected ? 'bg-blue-500 text-white border-blue-500' : ''}
                                  {isCurrentIndustry ? 'bg-gray-300 border-gray-300' : ''}">
                          {#if isSelected}✓{/if}
                        </span>
                        <span class="flex-1 text-sm">{industry}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
              {/each}
            </div>

            <!-- Loading indicator -->
            {#if visibleIndustries.length < filteredIndustries.length}
              <div class="p-2 text-center text-gray-500 text-sm">
                Loading more...
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Selection Buttons -->
      <button 
        class="px-3 py-1 border rounded hover:bg-gray-50 {!$selectedCompany ? 'opacity-50 cursor-not-allowed' : ''}"
        on:click={() => $selectedCompany && selectAll()}
        disabled={!$selectedCompany}
      >
        Select All
      </button>
      <button 
        class="px-3 py-1 border rounded hover:bg-gray-50 {!$selectedCompany ? 'opacity-50 cursor-not-allowed' : ''}"
        on:click={() => $selectedCompany && clearAll()}
        disabled={!$selectedCompany}
      >
        Clear All
      </button>
    </div>

    <!-- Selected Industries Tags -->
    <div class="flex flex-wrap gap-2">
      {#each [...selectedIndustries] as industry}
        <div class="bg-gray-100 px-2 py-1 rounded-md flex items-center
                    {industry === highlightedIndustry ? 'bg-blue-100' : ''}">
          <span class="text-sm">{industry}</span>
          {#if canDeselect(industry)}
            <button
              class="ml-2 text-gray-500 hover:text-gray-700"
              on:click|stopPropagation={() => toggleIndustry(industry, false)}
            >
              ×
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>


  <!-- Chart Container -->
  <div class="relative w-full" style="height: {chartHeight + 100}px"> <!-- Increased height to accommodate labels -->
    <!-- Fixed Y-axis and Grid -->
    <div class="absolute inset-0">
      <!-- Y-axis labels -->
      <div class="absolute left-0 h-full w-16 bg-white z-10">
        {#each CHART_CONFIG.yAxisLabels as value}
          <div 
            class="absolute right-0 text-sm text-gray-600 pr-2" 
            style="top: {(1 - value / CHART_CONFIG.maxScore) * chartHeight}px; transform: translateY(-50%);"
          >
            {value}
          </div>
        {/each}
      </div>

      <!-- Grid lines -->
      <div class="absolute left-16 right-0 top-0 h-full">
        {#each CHART_CONFIG.gridLines as value}
          <div 
            class="absolute w-full border-t border-gray-200" 
            style="top: {(1 - value / CHART_CONFIG.maxScore) * chartHeight}px"
          />
        {/each}
      </div>
    </div>

    <!-- Scrollable Chart Area -->
    <div class="absolute left-16 right-0 h-full overflow-x-auto overflow-y-hidden chart-container">
      {#if $selectedCompany}
        {@const orderedData = getOrderedIndustryData()}
        <div class="relative h-full" style="width: 100%; min-width: {Math.max(orderedData.length * 200, 800)}px">
          <!-- Bars Container -->
          <div class="relative h-full flex justify-between px-8">
            {#each orderedData as industryData (industryData.industryName)}
              <div class="relative flex flex-col items-center" style="width: {100 / Math.min(orderedData.length, 8)}%">
                <!-- Bars Group -->
                <div class="h-full flex items-end justify-center gap-1" style="height: {chartHeight}px">
                  <!-- Environmental Bar -->
                  <div 
                    role="button"
                    tabindex="0"
                    class="relative w-10 cursor-pointer transition-all duration-200 hover:scale-105"
                    style="height: {(industryData.environmental / CHART_CONFIG.maxScore) * chartHeight}px"
                    on:mouseenter={() => showTooltip(industryData.environmental, 'environmental', industryData.industryName)}
                    on:mouseleave={hideTooltip}
                  >
                    <div class="absolute inset-0 rounded-t transition-opacity duration-200 {getBarColor('environmental', industryData.industryName === highlightedIndustry)}" />
                    
                    {#if tooltipContent.visible && tooltipContent.type === 'environmental' && tooltipContent.industryName === industryData.industryName}
                      <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-20">
                        {industryData.environmental.toFixed(1)}
                      </div>
                    {/if}
                  </div>

                  <!-- Social Bar -->
                  <div 
                    role="button"
                    tabindex="0"
                    class="relative w-10 cursor-pointer transition-all duration-200 hover:scale-105"
                    style="height: {(industryData.social / CHART_CONFIG.maxScore) * chartHeight}px"
                    on:mouseenter={() => showTooltip(industryData.social, 'social', industryData.industryName)}
                    on:mouseleave={hideTooltip}
                  >
                    <div class="absolute inset-0 rounded-t transition-opacity duration-200 {getBarColor('social', industryData.industryName === highlightedIndustry)}" />
                    
                    {#if tooltipContent.visible && tooltipContent.type === 'social' && tooltipContent.industryName === industryData.industryName}
                      <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-20">
                        {industryData.social.toFixed(1)}
                      </div>
                    {/if}
                  </div>

                  <!-- Governance Bar -->
                  <div 
                    role="button"
                    tabindex="0"
                    class="relative w-10 cursor-pointer transition-all duration-200 hover:scale-105"
                    style="height: {(industryData.governance / CHART_CONFIG.maxScore) * chartHeight}px"
                    on:mouseenter={() => showTooltip(industryData.governance, 'governance', industryData.industryName)}
                    on:mouseleave={hideTooltip}
                  >
                    <div class="absolute inset-0 rounded-t transition-opacity duration-200 {getBarColor('governance', industryData.industryName === highlightedIndustry)}" />
                    
                    {#if tooltipContent.visible && tooltipContent.type === 'governance' && tooltipContent.industryName === industryData.industryName}
                      <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-20">
                        {industryData.governance.toFixed(1)}
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- Industry Label -->
                <div class="absolute w-full text-center" style="top: {chartHeight + 12}px">
                  <div 
                    class="text-xs text-center px-2 break-words max-w-[180px] mx-auto"
                    class:font-semibold={industryData.industryName === highlightedIndustry}
                    class:text-blue-600={industryData.industryName === highlightedIndustry}
                    class:text-gray-600={industryData.industryName !== highlightedIndustry}
                  >
                    {industryData.industryName}
                  </div>
                </div>

                <!-- Highlight indicator -->
                {#if industryData.industryName === highlightedIndustry}
                  <div class="absolute -bottom-1 left-4 right-4 h-1 bg-blue-500 rounded-t-lg"></div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Custom scrollbar styles */
  :global(.chart-container::-webkit-scrollbar) {
    height: 8px;
  }

  :global(.chart-container::-webkit-scrollbar-track) {
    background: #f1f1f1;
    border-radius: 4px;
  }

  :global(.chart-container::-webkit-scrollbar-thumb) {
    background: #888;
    border-radius: 4px;
  }

  :global(.chart-container::-webkit-scrollbar-thumb:hover) {
    background: #666;
  }
</style>