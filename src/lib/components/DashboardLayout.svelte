<!-- $lib/components/DashboardLayout.svelte -->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  children: Snippet;
}
let { children }: Props = $props();

let container = $state<HTMLElement | undefined>(undefined);
let wrapper = $state<HTMLElement | undefined>(undefined);

function updateLayout() {
  if (container && wrapper) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const baseWidth = viewportWidth * 2;
    const baseHeight = viewportHeight * 2;
    const scale = 0.5;
    container.style.transform = `scale(${scale})`;
    container.style.width = `${baseWidth}px`;
    container.style.minHeight = `${baseHeight}px`;
    container.style.transformOrigin = '0 0';
    wrapper.style.width = `${viewportWidth}px`;
    wrapper.style.minHeight = `${viewportHeight}px`;
    wrapper.style.overflow = 'auto';
  }
}

$effect(() => {
  updateLayout();
  window.addEventListener('resize', updateLayout);
  return () => {
    window.removeEventListener('resize', updateLayout);
  };
});
</script>

<div class="dashboard-wrapper" bind:this={wrapper}>
  <div class="dashboard-container" bind:this={container}>
    {@render children()}
  </div>
</div>

<style>
  .dashboard-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 100vh;
    overflow-y: auto;
  }

  .dashboard-container {
    position: absolute;
    top: 0;
    left: 0;
    background: white;
    min-height: 100%;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: auto;
  }
</style>
