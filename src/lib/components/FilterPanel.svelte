<script lang="ts">
	import { filterState } from '$lib/stores';

	let localFilter: typeof $filterState;

	$: {
		localFilter = { ...$filterState };
	}

	function updateFilters() {
		filterState.set(localFilter);
	}
</script>

<div class="bg-white p-4 rounded-lg shadow">
	<h2 class="text-lg font-semibold mb-4">Filters</h2>

	<!-- ESG Score Range -->
	<div class="mb-4">
		<label class="block text-sm font-medium mb-2">ESG Score Range</label>
		<div class="grid grid-cols-2 gap-2">
			<input
				type="number"
				bind:value={localFilter.minESGScore}
				class="w-full p-2 border rounded"
				min="0"
				max="100"
			/>
			<input
				type="number"
				bind:value={localFilter.maxESGScore}
				class="w-full p-2 border rounded"
				min="0"
				max="100"
			/>
		</div>
	</div>

	<!-- Sort Options -->
	<div class="mb-4">
		<label class="block text-sm font-medium mb-2">Sort By</label>
		<select bind:value={localFilter.sortBy} class="w-full p-2 border rounded">
			<option value="esg_score">ESG Score</option>
			<option value="environmental_score">Environmental Score</option>
			<option value="social_score">Social Score</option>
			<option value="governance_score">Governance Score</option>
		</select>
	</div>

	<button
		on:click={updateFilters}
		class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
	>
		Apply Filters
	</button>
</div>
