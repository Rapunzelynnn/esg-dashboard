<script lang="ts">
  import type { Company } from '$lib/types';

  export let data: Company[] = [];

  interface IndustryData {
    industryName: string;
    environmental: number;
    social: number;
    governance: number;
    total: number;
  }

  // Process and sort the data
  $: industryData = processData(data);

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

  const chartHeight = 320; // Reduced chart height to accommodate industry names
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
</script>

<div class="bg-white p-6 rounded-lg shadow-sm">
  <h2 class="text-xl font-semibold mb-8">ESG Score Breakdown by Industry</h2>

  <!-- Fixed height container for entire chart including labels -->
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
          {#each industryData as industry, i}
            <div class="flex-1 min-w-[160px] relative px-2">
              <!-- Bars group -->
              <div class="h-full flex items-end justify-center gap-1 group" style="height: {chartHeight}px">
                <!-- Environmental -->
                <div class="w-8 relative" style="height: {getHeight(industry.environmental)}">
                  <div class="absolute inset-0 bg-blue-500 transition-all hover:opacity-80">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap bg-white px-1 rounded shadow-sm z-20">
                      {industry.environmental.toFixed(1)}
                    </div>
                  </div>
                </div>

                <!-- Social -->
                <div class="w-8 relative" style="height: {getHeight(industry.social)}">
                  <div class="absolute inset-0 bg-green-500 transition-all hover:opacity-80">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap bg-white px-1 rounded shadow-sm z-20">
                      {industry.social.toFixed(1)}
                    </div>
                  </div>
                </div>

                <!-- Governance -->
                <div class="w-8 relative" style="height: {getHeight(industry.governance)}">
                  <div class="absolute inset-0 bg-indigo-500 transition-all hover:opacity-80">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap bg-white px-1 rounded shadow-sm z-20">
                      {industry.governance.toFixed(1)}
                    </div>
                  </div>
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