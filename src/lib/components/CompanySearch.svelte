<!-- $lib/components/CompanySearch -->
<script lang="ts">
	import { companies, selectedCompany } from '$lib/stores';
	import type { Company } from '$lib/types';

	let searchTerm = '';

	$: filteredCompanies = searchTerm
		? $companies
				.filter((company) => {
					const searchLower = searchTerm.toLowerCase();
					const symbolLower = (company.symbol || '').toLowerCase();
					const fullNameLower = (company.fullName || '').toLowerCase();
					const combinedNameLower = `${symbolLower} ${fullNameLower}`.toLowerCase();
					return combinedNameLower.includes(searchLower);
				})
				.slice(0, 5)
		: [];

	function selectCompany(company: Company) {
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
				<button
					class="w-full px-4 py-2 text-left hover:bg-gray-100"
					on:click={() => selectCompany(company)}
				>
					<div class="flex justify-between items-center">
						<span class="font-semibold">{company.fullName}</span>
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
