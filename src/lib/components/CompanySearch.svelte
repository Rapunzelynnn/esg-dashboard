<!-- lib/components/CompanySearch.svelte -->
<script lang="ts">
	import { companies, selectedCompany } from '$lib/stores';
	let searchTerm = '';

	$: filteredCompanies = searchTerm
		? $companies
				.filter((company) => {
					const searchLower = searchTerm.toLowerCase();
					const symbolLower = (company.symbol || '').toLowerCase();
					const fullNameLower = (company.fullName || '').toLowerCase();
					const combinedNameLower = `${symbolLower} ${fullNameLower}`.toLowerCase();

					// Debug logging for AAPL
					if (company.symbol === 'AAPL') {
						console.log('AAPL search check:', {
							searchTerm: searchLower,
							symbol: symbolLower,
							fullName: fullNameLower,
							matches: combinedNameLower.includes(searchLower)
						});
					}

					return combinedNameLower.includes(searchLower);
				})
				.slice(0, 5)
		: [];

	function selectCompany(company) {
		console.log('Selected company:', company); // Debug selected company
		selectedCompany.set(company);
		searchTerm = '';
	}
</script>

<div class="relative w-full max-w-md">
	<input
		type="text"
		bind:value={searchTerm}
		placeholder="Search by company name or symbol"
		class="w-full p-2 border rounded-md"
	/>
	{#if searchTerm && filteredCompanies.length > 0}
		<div
			class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
		>
			{#each filteredCompanies as company}
				<!-- Debug display -->
				{@const displayName = company.fullName || `${company.symbol} Inc.`}
				<button
					class="w-full px-4 py-2 text-left hover:bg-gray-100"
					on:click={() => selectCompany(company)}
				>
					<div class="flex justify-between items-center">
						<span class="font-semibold">{displayName}</span>
						<span class="text-blue-600">{company.symbol}</span>
					</div>
					<div class="text-sm text-gray-600">
						{company.industryCode} - {company.industryName || 'Industry'}
					</div>
				</button>
			{/each}
		</div>
	{:else if searchTerm}
		<div class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-gray-500">
			No matches found
		</div>
	{/if}
</div>
