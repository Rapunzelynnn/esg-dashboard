<!-- $lib/components/DashboardLayout.svelte -->
<script lang="ts">
import { onMount } from 'svelte';
let container: HTMLElement;
let wrapper: HTMLElement;

function updateLayout() {
  if (container && wrapper) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Using 50% zoom equivalent dimensions
    const baseWidth = viewportWidth * 2;
    const baseHeight = viewportHeight * 2;
    // Calculate scale to match 50% zoom
    const scale = 0.5;
    
    // Apply transformations
    container.style.transform = `scale(${scale})`;
    container.style.width = `${baseWidth}px`;
    container.style.minHeight = `${baseHeight}px`; // Change height to minHeight
    container.style.transformOrigin = '0 0';
    
    // Update wrapper styles to allow scrolling
    wrapper.style.width = `${viewportWidth}px`;
    wrapper.style.minHeight = `${viewportHeight}px`; // Change height to minHeight
    wrapper.style.overflow = 'auto'; // Change from 'hidden' to 'auto'
  }
}

onMount(() => {
  updateLayout();
  window.addEventListener('resize', updateLayout);
  return () => {
    window.removeEventListener('resize', updateLayout);
  };
});
</script>

<div class="dashboard-wrapper" bind:this={wrapper}>
  <div class="dashboard-container" bind:this={container}>
    <slot />
  </div>
</div>

<style>
  .dashboard-wrapper {
    position: absolute; /* Change from fixed to absolute */
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
    overflow: auto; /* Change from hidden to auto */
  }
</style>