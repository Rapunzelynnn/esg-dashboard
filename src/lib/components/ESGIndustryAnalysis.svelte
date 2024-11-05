<!-- $lib/components/ESGIndustryAnalysis.svelte -->
<script lang="ts">
  import type { Company } from '$lib/types';
  import { selectedCompany } from '$lib/stores';
  import { fade } from 'svelte/transition';

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
  }

  type ESGType = 'environmental' | 'social' | 'governance';
  
  type TooltipContent = {
    visible: boolean;
    score: number;
    type: ESGType;
    industryName: string;
    indicatorText?: string;
  };

  // Constants and Styling
  const maxScore = 100;
  const defaultChartHeight = 320;
  const expandedChartHeight = 500;
  const gridLines = [20, 40, 60, 80];
  const yAxisLabels = [0, 20, 40, 60, 80, 100];

  // Style configurations
  const barStyles = {
    base: "transition-all duration-200 ease-out transform",
    hover: "scale-105 shadow-lg",
    tooltip: "absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-lg z-50"
  };

  // State Management
  let selectedIndustries = new Set<string>();
  let searchTerm = '';
  let showDropdown = false;
  let initialized = false;
  let chartHeight = expanded ? expandedChartHeight : defaultChartHeight;

  // Tooltip state
  let tooltipContent: TooltipContent = {
    visible: false,
    score: 0,
    type: 'environmental',
    industryName: ''
  };

    const industryCategories: Record<string, string[]> = {
    // Technology & Electronics
    'Software': [
      'Software',
      'IT Services',
      'Computers & Peripherals and Office Electronics',
      'Semiconductors & Semiconductor Equipment',
      'Electronic Equipment, Instruments & Components'
    ],
    'IT Services': [
      'IT Services',
      'Software',
      'Telecommunication Services',
      'Electronic Equipment, Instruments & Components'
    ],

    // Financial Services & Real Estate
    'Banks': [
      'Banks',
      'Insurance',
      'Diversified Financial Services and Capital Markets',
      'Equity Real Estate Investment Trusts (REITs)',
      'Real Estate Management & Development'
    ],
    'Insurance': [
      'Insurance',
      'Banks',
      'Diversified Financial Services and Capital Markets',
      'Health Care Providers & Services'
    ],

    // Healthcare & Life Sciences
    'Health Care Equipment & Supplies': [
      'Health Care Equipment & Supplies',
      'Health Care Providers & Services',
      'Biotechnology',
      'Pharmaceuticals',
      'Life Sciences Tools & Services'
    ],
    
    // Energy & Utilities
    'Electric Utilities': [
      'Electric Utilities',
      'Multi and Water Utilities',
      'Gas Utilities',
      'Oil & Gas Storage & Transportation',
      'Energy Equipment & Services'
    ],

    // Industrial & Manufacturing
    'Aerospace & Defense': [
      'Aerospace & Defense',
      'Machinery and Electrical Equipment',
      'Electrical Components & Equipment',
      'Transportation and Transportation Infrastructure'
    ]
  };

  // Reactive declarations
  $: allIndustryData = processData(data);
  $: industries = [...new Set(data.map(d => d.industryName))].sort((a, b) => 
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
  $: highlightedIndustry = $selectedCompany?.industryName || '';
  $: chartHeight = expanded ? expandedChartHeight : defaultChartHeight;

  // Filter related reactive declarations
  $: filteredIndustries = industries.filter(industry => 
    industry.toLowerCase().includes(searchTerm.toLowerCase())
  );
  $: groupedIndustries = filteredIndustries.reduce((acc, industry) => {
    const firstLetter = industry[0].toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(industry);
    return acc;
  }, {} as Record<string, string[]>);
  $: sortedGroups = Object.keys(groupedIndustries).sort();

  // Sorted industry data with highlighted industry first
  $: industryData = allIndustryData
    .filter(d => selectedIndustries.has(d.industryName))
    .sort((a, b) => {
      if (a.industryName === highlightedIndustry) return -1;
      if (b.industryName === highlightedIndustry) return 1;
      return b.total - a.total;
    });

  // Functions
  function getBarColor(type: ESGType): string {
    const colors = {
      environmental: 'bg-blue-500',
      social: 'bg-green-500',
      governance: 'bg-indigo-500'
    };
    return colors[type];
  }

  function showTooltip(score: number, type: ESGType, industryName: string) {
    tooltipContent = {
      visible: true,
      score,
      type,
      industryName
    };
  }

  function hideTooltip() {
    tooltipContent.visible = false;
  }

  function handleClickOutside() {
    tooltipContent.visible = false;
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

  // Filter functions
  function toggleIndustry(industry: string) {
    if (selectedIndustries.has(industry)) {
      selectedIndustries.delete(industry);
    } else {
      selectedIndustries.add(industry);
    }
    // Create a new Set to trigger reactivity
    selectedIndustries = new Set(selectedIndustries);
  }

  function selectAll() {
    selectedIndustries = new Set(industries);
  }

  function clearAll() {
    if ($selectedCompany?.industryName) {
      selectedIndustries = new Set([$selectedCompany.industryName]);
    } else {
      selectedIndustries = new Set();
    }
  }

  function removeIndustry(industry: string) {
    if (industry === $selectedCompany?.industryName) return;
    
    selectedIndustries.delete(industry);
    selectedIndustries = new Set(selectedIndustries);
  }



  

  // Initial load handling
  $: if ($selectedCompany && industries.length > 0) {
    if (!initialized) {
      // Only set initial industries once
      selectedIndustries = getRelatedIndustries($selectedCompany.industryName);
      initialized = true;
    }
  } else if (industries.length > 0 && !initialized) {
    selectedIndustries = new Set(industries);
    initialized = true;
  }




   // Function to get related industries for the selected company
  function getRelatedIndustries(industryName: string): Set<string> {
    const defaultCount = 5;
    const relatedIndustries = new Set<string>();
    
    if (!industryName) return new Set(allIndustryData.slice(0, defaultCount).map(d => d.industryName));
    
    // Add the company's own industry first
    relatedIndustries.add(industryName);
    
    // Add related industries from the mapping
    if (industryCategories[industryName]) {
      industryCategories[industryName].forEach(industry => {
        if (industries.includes(industry)) {
          relatedIndustries.add(industry);
        }
      });
    }
    
    // If we need more industries, add top performers
    if (relatedIndustries.size < defaultCount) {
      allIndustryData
        .filter(d => !relatedIndustries.has(d.industryName))
        .slice(0, defaultCount - relatedIndustries.size)
        .forEach(d => relatedIndustries.add(d.industryName));
    }
    
    return relatedIndustries;
  }

    // Update selected industries when company changes or on initial load
  $: if ($selectedCompany && industries.length > 0) {
    if (!initialized || $selectedCompany.industryName) {
      selectedIndustries = getRelatedIndustries($selectedCompany.industryName);
      initialized = true;
    }
  } else if (industries.length > 0 && !initialized) {
    // Fallback to top performers if no company selected
    selectedIndustries = new Set(allIndustryData.slice(0, 5).map(d => d.industryName));
    initialized = true;
  }

  function processData(companies: Company[]): IndustryData[] {
    const industryGroups = companies.reduce((acc, company) => {
      if (!acc[company.industryName]) {
        acc[company.industryName] = {
          environmental: [],
          social: [],
          governance: []
        };
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

// Original initialization logic
$: if ($selectedCompany && industries.length > 0) {
  if (!initialized) {
    selectedIndustries = getRelatedIndustries($selectedCompany.industryName);
    initialized = true;
  }
} else if (industries.length > 0 && !initialized) {
  // Keep all industries visible by default
  selectedIndustries = new Set(industries);
  initialized = true;
}

  $: chartHeight = expanded ? 500 : 320;

  // Add helper to get explanation text
  function getComparisonExplanation(industryName: string): string {
    if (!industryName) return '';
    
    const explanations: Record<string, string> = {
      'Textiles, Apparel & Luxury Goods': 'Showing comparison with consumer retail industries and manufacturing sectors due to shared supply chain and consumer market characteristics.',
      'Software': 'Comparing with technology and digital services sectors due to shared technological infrastructure and market dynamics.',
      'Banks': 'Showing financial services sector comparisons due to regulatory environment and market interdependencies.',
      // Add more industry-specific explanations
    };

    return explanations[industryName] || 'Showing comparison with related industries based on business model and market sector.';
  }

  // Modify your bar chart styles based on highlighted industry
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
  // Initialize selected industries
  $: if ($selectedCompany && industries.length > 0) {
    if (!initialized || $selectedCompany.industryName) {
      selectedIndustries = getRelatedIndustries($selectedCompany.industryName);
      initialized = true;
    }
  } else if (industries.length > 0 && !initialized) {
    selectedIndustries = new Set(industries);
    initialized = true;
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="bg-white p-6 rounded-lg shadow-sm">
  <h2 class="text-xl font-semibold mb-4">Industrial Score Breakdown</h2>

  <!-- Improved Filter UI -->
  <div class="mb-6 space-y-4">
    <div class="flex items-center gap-4">
      <!-- Filter Dropdown -->
      <div class="relative filter-dropdown">
        <button
          class="px-4 py-2 border rounded-md flex items-center justify-between w-[200px]"
          on:click|stopPropagation={() => showDropdown = !showDropdown}
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
                {#each sortedGroups as letter}
                  <div class="mb-2">
                    <div class="px-2 py-1 text-sm font-semibold text-gray-500">{letter}</div>
                    {#each groupedIndustries[letter] as industry}
                      <button
                        class="w-full px-2 py-1 text-left hover:bg-gray-100 flex items-center"
                        on:click|stopPropagation={() => toggleIndustry(industry)}
                      >
                        <span class="w-4 h-4 mr-2 border flex items-center justify-center">
                          {#if selectedIndustries.has(industry)}
                            ✓
                          {/if}
                        </span>
                        <span>{industry}</span>
                      </button>
                    {/each}
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <button 
        class="px-3 py-1 border rounded hover:bg-gray-100"
        on:click={() => selectAll()}
      >
        Select All
      </button>
      <button 
        class="px-3 py-1 border rounded hover:bg-gray-100"
        on:click={() => clearAll()}
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
            on:click={() => removeIndustry(industry)}
          >
            ×
          </button>
        </div>
      {/each}
    </div>
    <!-- Add explanation section here -->
    {#if highlightedIndustry}
      <div class="mb-4 bg-blue-50 p-3 rounded-lg">
        <div class="flex items-start gap-2">
          <div class="p-1 bg-blue-100 rounded-full">
            <svg class="w-4 h-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">{getComparisonExplanation(highlightedIndustry)}</p>
          </div>
        </div>
      </div>
    {/if}
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
          />
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
                  on:mouseenter={() => showTooltip(industry.environmental, 'environmental', industry.industryName)}
                  on:mouseleave={hideTooltip}
                >
                  <div class="absolute inset-0 {getBarColor('environmental')} transition-all duration-200 group-hover:opacity-80" />
                  
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
                  on:mouseenter={() => showTooltip(industry.social, 'social', industry.industryName)}
                  on:mouseleave={hideTooltip}
                >
                  <div class="absolute inset-0 {getBarColor('social')} transition-all duration-200 group-hover:opacity-80" />
                  
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
                  on:mouseenter={() => showTooltip(industry.governance, 'governance', industry.industryName)}
                  on:mouseleave={hideTooltip}
                >
                  <div class="absolute inset-0 {getBarColor('governance')} transition-all duration-200 group-hover:opacity-80" />
                  
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