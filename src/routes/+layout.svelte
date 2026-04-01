<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import DashboardLayout from '$lib/components/DashboardLayout.svelte';
  import type { Snippet } from 'svelte';

  interface Props { children: Snippet; }
  let { children }: Props = $props();
</script>

<DashboardLayout>
  <main>
    {@render children()}
  </main>
</DashboardLayout>

<style>
  :global(main) {
    padding: 2rem;
    width: 100%;
    height: 100%;
  }
</style>
