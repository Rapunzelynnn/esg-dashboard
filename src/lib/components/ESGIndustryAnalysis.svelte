<script lang="ts">
  import type { Company } from '$lib/types';

  export let data: Company[] = [];
  export let expanded = false;  // Add this line

  interface IndustryData {
    industryName: string;
    environmental: number;
    social: number;
    governance: number;
    total: number;
  }

  // Initialize state
  let selectedIndustries = new Set<string>();
  let searchTerm = '';
  let showDropdown = false;
  let initialized = false;

  // Process and sort the data
  $: allIndustryData = processData(data);
  
  // Get unique industry names and sort alphabetically for filter
  $: industries = [...new Set(data.map(d => d.industryName))].sort((a, b) => 
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  // Handle initial load
  $: if (industries.length > 0 && !initialized) {
      selectedIndustries = new Set(industries);
      initialized = true;
  }
  
  // Filter data based on selection (maintains score ordering for chart)
  $: industryData = allIndustryData.filter(d => selectedIndustries.has(d.industryName));

  // Filter industries based on search (maintains alphabetical order)
  $: filteredIndustries = industries.filter(industry => 
    industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered industries by first letter
  $: groupedIndustries = filteredIndustries.reduce((acc, industry) => {
    const firstLetter = industry[0].toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(industry);
    return acc;
  }, {} as Record<string, string[]>);

  // Sort the group keys alphabetically
  $: sortedGroups = Object.keys(groupedIndustries).sort();

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

  // Filter functions
  function toggleIndustry(industry: string) {
      if (selectedIndustries.has(industry)) {
          selectedIndustries.delete(industry);
      } else {
          selectedIndustries.add(industry);
      }
      selectedIndustries = selectedIndustries; // Trigger reactivity
  }

  function selectAll() {
      selectedIndustries = new Set(industries);
      selectedIndustries = selectedIndustries; // Trigger reactivity
  }

  function clearAll() {
      selectedIndustries = new Set();
      selectedIndustries = selectedIndustries; // Trigger reactivity
  }

  function removeIndustry(industry: string) {
      selectedIndustries.delete(industry);
      selectedIndustries = selectedIndustries;
  }


  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown')) {
      showDropdown = false;
    }
  }

  let chartHeight = 320;
  const maxScore = 100;

  function getHeight(value: number): string {
    return `${(value / maxScore) * chartHeight}px`;
  }
    
  const gridLines = [20, 40, 60, 80];
  const yAxisLabels = [0, 20, 40, 60, 80, 100];

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
  $: chartHeight = expanded ? 500 : 320;
</script>

<svelte:window on:click={handleClickOutside} />

<div class="bg-white p-6 rounded-lg shadow-sm">
  <h2 class="text-xl font-semibold mb-4">ESG Score Breakdown by Industry</h2>

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
            <div class="flex-1 min-w-[160px] relative px-2">
              <!-- Bars group -->
              <div class="h-full flex items-end justify-center gap-1" style="height: {chartHeight}px">
                <!-- Environmental -->
                <div class="w-8 relative" style="height: {getHeight(industry.environmental)}">
                  <div class="absolute inset-0 bg-blue-500 transition-all hover:opacity-80" />
                </div>

                <!-- Social -->
                <div class="w-8 relative" style="height: {getHeight(industry.social)}">
                  <div class="absolute inset-0 bg-green-500 transition-all hover:opacity-80" />
                </div>

                <!-- Governance -->
                <div class="w-8 relative" style="height: {getHeight(industry.governance)}">
                  <div class="absolute inset-0 bg-indigo-500 transition-all hover:opacity-80" />
                </div>
              </div>

              <!-- Industry label -->
              <div class="absolute left-1/2 -translate-x-1/2" style="top: {chartHeight + 8}px">
                <div class="text-xs text-gray-600 text-center whitespace-pre-line" style="width: max-content; max-width: 140px;">
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