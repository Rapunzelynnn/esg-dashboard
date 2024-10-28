<script lang="ts">
  import type { FilterState } from '../types';
  
  export let localFilter: FilterState;
</script>

<div class="mb-4">
  <div class="block text-sm font-medium mb-2" id="esg-range-label">ESG Score Range</div>
  <div class="grid grid-cols-2 gap-2">
    <input
      type="number"
      bind:value={localFilter.minESGScore}
      class="w-full p-2 border rounded"
      aria-labelledby="esg-range-label"
      placeholder="Min"
    />
    <input
      type="number"
      bind:value={localFilter.maxESGScore}
      class="w-full p-2 border rounded"
      aria-labelledby="esg-range-label"
      placeholder="Max"
    />
  </div>
</div>

<div class="mb-4">
  <label for="sort-select" class="block text-sm font-medium mb-2">Sort By</label>
  <select
    id="sort-select"
    bind:value={localFilter.sortBy}
    class="w-full p-2 border rounded"
  >
    <!-- Add your sort options here -->
    <option value="esg">ESG Score</option>
    <option value="alpha">Alphabetical</option>
    <!-- Add more options as needed -->
  </select>
</div>