<!-- $lib/components/CompanySearch -->
<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import type { Company } from '$lib/types';

	let open = $state(false);
	let searchTerm = $state('');
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	let filteredCompanies = $derived(
		searchTerm
			? appState.companies
					.filter((company) => {
						const q = searchTerm.toLowerCase();
						return (
							(company.symbol || '').toLowerCase().includes(q) ||
							(company.fullName || '').toLowerCase().includes(q)
						);
					})
					.slice(0, 8)
			: appState.companies.slice(0, 8)
	);

	function selectCompany(company: Company) {
		appState.selectedCompany = company;
		searchTerm = company.fullName;
		open = false;
	}

	function toggle() {
		open = !open;
		if (open) setTimeout(() => inputEl?.focus(), 0);
	}
</script>

<div class="relative w-full">
	<!-- Trigger button -->
	<button
		type="button"
		class="w-full flex items-center justify-between px-3 py-2 border rounded-md bg-white text-left text-sm hover:bg-gray-50"
		onclick={toggle}
		aria-expanded={open}
		aria-haspopup="listbox"
	>
		<span class={appState.selectedCompany ? 'text-gray-900' : 'text-gray-400'}>
			{appState.selectedCompany?.fullName ?? 'Search by company name or symbol'}
		</span>
		<svg class="h-4 w-4 text-gray-400 shrink-0 ml-2 transition-transform {open ? 'rotate-180' : ''}"
			 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
		</svg>
	</button>

	{#if open}
		<!-- Dropdown panel -->
		<div class="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg">
			<div class="p-2 border-b">
				<input
					bind:this={inputEl}
					bind:value={searchTerm}
					type="text"
					placeholder="Type to filter…"
					class="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>
			<ul role="listbox" class="max-h-56 overflow-y-auto py-1">
				{#each filteredCompanies as company}
					<li>
						<button
							role="option"
							aria-selected={appState.selectedCompany?.symbol === company.symbol}
							class="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 {appState.selectedCompany?.symbol === company.symbol ? 'bg-blue-50 font-semibold' : ''}"
							onclick={() => selectCompany(company)}
						>
							<div class="flex justify-between items-center">
								<span>{company.fullName}</span>
								<span class="text-blue-600 text-xs ml-2 shrink-0">{company.symbol}</span>
							</div>
						</button>
					</li>
				{/each}
				{#if filteredCompanies.length === 0}
					<li class="px-3 py-2 text-sm text-gray-400">No matches found</li>
				{/if}
			</ul>
		</div>
	{/if}
</div>
