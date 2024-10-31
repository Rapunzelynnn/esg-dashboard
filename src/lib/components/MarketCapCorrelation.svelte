<script lang="ts">
  import type { Company } from '$lib/types';
  
  export let data: Company[] = [];
  export let expanded = false;

  // Process market cap data
  $: marketCapData = data.map(company => ({
    symbol: company.symbol,
    marketCap: company.marketCap,
    esgScore: company.esgScores.total,
    industryName: company.industryName
  })).filter(d => d.marketCap > 0 && d.esgScore > 0); // Filter out invalid data

  // Calculate dimensions based on expanded state
  $: height = expanded ? 600 : 400;

  // Scale helpers
  $: maxMarketCap = Math.max(...marketCapData.map(d => d.marketCap));
  $: maxScore = 100; // ESG scores typically range from 0-100

  // Get unique industries for color coding
  $: industries = [...new Set(marketCapData.map(d => d.industryName))];
  $: colorScale = new Map(industries.map((industry, i) => 
    [industry, `hsl(${(i * 360) / industries.length}, 70%, 50%)`]
  ));
</script>

<div class="w-full">
  <h2 class="text-xl font-semibold mb-4">ESG Score vs Market Cap</h2>
  <div class="relative" style="height: {height}px;">
    <!-- Scatter plot visualization -->
    <div class="absolute inset-0">
      <!-- Y-axis labels -->
      <div class="absolute left-0 top-0 bottom-8 w-16">
        {#each [0, 20, 40, 60, 80, 100] as value}
          <div 
            class="absolute right-0 text-sm text-gray-600 pr-2" 
            style="bottom: {(value / maxScore) * 100}%"
          >
            {value}
          </div>
        {/each}
      </div>

      <!-- Grid lines -->
      <div class="absolute left-16 right-0 top-0 bottom-8">
        {#each [20, 40, 60, 80] as value}
          <div 
            class="absolute w-full border-t border-gray-200" 
            style="bottom: {(value / maxScore) * 100}%"
          />
        {/each}
      </div>

      <!-- Data points -->
      <div class="absolute left-16 right-8 top-8 bottom-8">
        {#each marketCapData as point}
          <div 
            class="absolute rounded-full w-2 h-2 transform -translate-x-1 -translate-y-1 
                   hover:w-3 hover:h-3 transition-all duration-200"
            style="
              left: {(point.marketCap / maxMarketCap) * 100}%;
              bottom: {(point.esgScore / maxScore) * 100}%;
              background-color: {colorScale.get(point.industryName)};
            "
          >
            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 
                        bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 
                        hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
              {point.symbol}: ESG Score: {point.esgScore.toFixed(1)}, 
              Market Cap: ${(point.marketCap / 1000).toFixed(1)}B
              <br/>
              {point.industryName}
            </div>
          </div>
        {/each}
      </div>

      <!-- Axes labels -->
      <div class="absolute bottom-0 left-16 right-0 text-center text-sm text-gray-600">
        Market Cap (Billions USD)
      </div>
      <div class="absolute left-2 top-1/2 -rotate-90 text-sm text-gray-600 whitespace-nowrap">
        ESG Score
      </div>
    </div>
  </div>

  <!-- Legend -->
  {#if expanded}
    <div class="mt-4 flex flex-wrap gap-4">
      {#each industries as industry}
        <div class="flex items-center">
          <div 
            class="w-3 h-3 rounded-full mr-2"
            style="background-color: {colorScale.get(industry)}"
          ></div>
          <span class="text-sm">{industry}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>