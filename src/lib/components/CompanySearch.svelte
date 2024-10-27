<script lang="ts">
	import { companies, selectedCompany } from '$lib/stores';
	import { onMount } from 'svelte';
	import type { Company } from '$lib/types';

	let searchTerm = '';
	let searchInput: HTMLInputElement;
	let isDropdownVisible = false;

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
		isDropdownVisible = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const searchContainer = document.querySelector('.search-container');
		if (searchContainer && !searchContainer.contains(event.target as Node)) {
			isDropdownVisible = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function handleFocus() {
		isDropdownVisible = true;
	}

	function handleInput() {
		isDropdownVisible = true;
	}
</script>

<div class="search-container relative w-full max-w-md mx-auto">
	<input
		bind:this={searchInput}
		type="text"
		bind:value={searchTerm}
		on:focus={handleFocus}
		on:input={handleInput}
		placeholder="Search by company name or symbol"
		class="w-full p-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
	/>

	{#if isDropdownVisible && searchTerm && filteredCompanies.length > 0}
		<div
			class="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
		>
			{#each filteredCompanies as company}
				<button
					class="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
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
	{:else if isDropdownVisible && searchTerm}
		<div class="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-gray-500">
			No matches found
		</div>
	{/if}
</div>

<style>
	.search-container {
		position: relative;
		z-index: 100;
	}

	input:focus {
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
	}

	button {
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #f3f4f6;
	}
</style>
