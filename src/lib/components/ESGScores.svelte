<script lang="ts">
	import { selectedCompany } from '$lib/stores';

	function getScoreColor(score: number): string {
		if (score >= 70) return 'bg-green-500';
		if (score >= 50) return 'bg-yellow-500';
		return 'bg-red-500';
	}
</script>

{#if $selectedCompany}
	<div class="p-6 bg-white rounded-lg shadow-md">
		<!-- ... rest of the component ... -->
	</div>
{/if}
