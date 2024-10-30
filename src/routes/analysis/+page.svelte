<script lang="ts">
  import { onMount } from 'svelte';
  import { loadCompanyData, companies } from '$lib/stores';
  import ESGIndustryAnalysis from '$lib/components/ESGIndustryAnalysis.svelte';
  import type { Company } from '$lib/types';
  
  let loading = true;
  
  onMount(async () => {
    try {
      await loadCompanyData();
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      loading = false;
    }
  });
</script>

<div class="max-w-7xl mx-auto">
  <h1 class="text-3xl font-bold mb-8 text-gray-800">Overall Analysis</h1>
  
  <div class="mb-8">
    {#if loading}
      <div class="text-center p-4">
        <p class="text-gray-600">Loading data...</p>
      </div>
    {:else if $companies.length > 0}
      <ESGIndustryAnalysis data={$companies} />
    {:else}
      <div class="text-center p-4">
        <p class="text-gray-600">No company data available</p>
      </div>
    {/if}
  </div>

  <!-- Placeholder for future visualizations -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- We'll add more visualization components here later -->
  </div>
</div>