<script lang="ts">
  import type { Company } from '$lib/types';
  
  export let data: Company[] = [];
  export let expanded = false;

  $: processedData = data.map(company => ({
    symbol: company.symbol,
    environmental: company.esgScores.environmental.score,
    social: company.esgScores.social.score,
    governance: company.esgScores.governance.score
  }));
</script>

<div class="w-full">
  <h2 class="text-xl font-semibold mb-4">ESG Score Comparison</h2>
  <div class="flex items-center justify-center text-gray-400" style="height: {expanded ? 600 : 400}px">
    Score Comparison Chart Coming Soon...
  </div>
</div>