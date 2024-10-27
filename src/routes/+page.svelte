<script lang="ts">
	import { onMount } from 'svelte';
	import { loadCompanyData } from '$lib/stores';
	import CompanySearch from '$lib/components/CompanySearch.svelte';
	import CompanyProfile from '$lib/components/CompanyProfile.svelte';

	onMount(async () => {
		await loadCompanyData();
	});
</script>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4">
		<h1 class="text-3xl font-bold mb-8 text-gray-800 text-center">Company Profile</h1>

		<div class="mb-8 max-w-xl mx-auto">
			<CompanySearch />
		</div>

		<CompanyProfile />
	</div>
</div>
