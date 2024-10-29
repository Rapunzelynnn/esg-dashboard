<script lang="ts">
  import { onMount } from 'svelte';
  import { loadCompanyData } from '$lib/stores';
  import CompanySearch from '$lib/components/CompanySearch.svelte';
  import CompanyProfile from '$lib/components/CompanyProfile.svelte';

  onMount(async () => {
    await loadCompanyData();
  });
</script>

<h1 class="text-3xl font-bold mb-8 text-gray-800">Company Profile</h1>
<div class="mb-8 max-w-xl">
  <CompanySearch />
</div>
<CompanyProfile />