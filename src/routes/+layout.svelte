<!-- $lib/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import DashboardLayout from '$lib/components/DashboardLayout.svelte';
</script>

<DashboardLayout>
  <main>
    <slot />
  </main>
</DashboardLayout>

<style>
  :global(main) {
    padding: 2rem;
    width: 100%;
    height: 100%;
  }
</style>