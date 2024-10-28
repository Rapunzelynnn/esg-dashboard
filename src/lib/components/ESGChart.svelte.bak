<script lang="ts">
	import { onMount } from 'svelte';
	import { filterState, esgData } from '$lib/stores';
	import { Bar } from 'recharts';

	let filteredData: any[] = [];

	$: {
		filteredData = $esgData
			.filter((company) => {
				const matchesSector =
					$filterState.selectedSectors.length === 0 ||
				const matchesScore =
					company.totalEsg >= $filterState.esgScoreRange[0] &&
					company.totalEsg <= $filterState.esgScoreRange[1];
				return matchesSector && matchesScore;
			})
			.sort((a, b) => {
				const factor = $filterState.sortDirection === 'desc' ? -1 : 1;
				return (a[$filterState.sortBy] - b[$filterState.sortBy]) * factor;
			})
			.slice(0, 10); // Show top 10 companies
	}
</script>

<div class="bg-white p-4 rounded-lg shadow">
	<h2 class="text-lg font-semibold mb-4">ESG Score Comparison</h2>

	<div class="h-[400px]">
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="symbol" />
				<YAxis />
				<Tooltip />
				<Legend />
				<Bar dataKey="environmentScore" fill="#82ca9d" name="Environmental" />
				<Bar dataKey="socialScore" fill="#8884d8" name="Social" />
				<Bar dataKey="governanceScore" fill="#ffc658" name="Governance" />
			</BarChart>
		</ResponsiveContainer>
	</div>
</div>
