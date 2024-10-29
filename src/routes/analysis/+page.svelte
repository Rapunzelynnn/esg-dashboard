<script lang="ts">
  import { onMount } from 'svelte';
  import { loadCompanyData } from '$lib/stores';

  onMount(async () => {
    await loadCompanyData();
  });
</script>

<h1 class="text-3xl font-bold mb-8 text-gray-800">S&P 500 ESG Analysis</h1>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="bg-white p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-4">ESG Score Distribution</h2>
    <!-- Add visualization component here -->
  </div>
  
  <div class="bg-white p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-4">Sector Analysis</h2>
    <!-- Add visualization component here -->
  </div>
</div>