<script lang="ts">
	import { esgData, filterState } from '$lib/stores';

	let sectors: string[] = [];

	$: {
		sectors = [...new Set($esgData.map((d) => d.gicsSector))].sort();
	}

	function updateSectors(sector: string) {
		const currentSectors = new Set($filterState.selectedSectors);
		if (currentSectors.has(sector)) {
			currentSectors.delete(sector);
		} else {
			currentSectors.add(sector);
		}
		filterState.update((f) => ({ ...f, selectedSectors: Array.from(currentSectors) }));
	}
</script>

<div class="bg-white p-4 rounded-lg shadow">
	<h2 class="text-lg font-semibold mb-4">Filter Companies</h2>

	<div class="space-y-4">
		<div>
			<h3 class="text-sm font-medium mb-2">Sectors</h3>
			<div class="space-y-2">
				{#each sectors as sector}
					<label class="flex items-center space-x-2">
						<input
							type="checkbox"
							checked={$filterState.selectedSectors.includes(sector)}
							on:change={() => updateSectors(sector)}
							class="rounded text-blue-600"
						/>
						<span>{sector}</span>
					</label>
				{/each}
			</div>
		</div>
	</div>
</div>
