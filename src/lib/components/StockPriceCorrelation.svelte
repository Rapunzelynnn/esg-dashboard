<script lang="ts">
  import type { Company } from '$lib/types';
  
  export let data: Company[] = [];
  export let expanded = false;

  $: processedData = data.map(company => ({
    symbol: company.symbol,
    esgScore: company.esgScores.total,
    // Note: Add stock price to your Company type if not already present
  }));
</script>

<div class="w-full">
  <h2 class="text-xl font-semibold mb-4">ESG vs. Stock Price</h2>
  <div class="flex items-center justify-center text-gray-400" style="height: {expanded ? 600 : 400}px">
    Stock Price Correlation Chart Coming Soon...
  </div>
</div>