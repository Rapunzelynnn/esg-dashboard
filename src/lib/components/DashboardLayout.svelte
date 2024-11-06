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
      const baseWidth = viewportWidth * 2;  // This will make it match your 50% zoom view
      const baseHeight = viewportHeight * 2;
      
      // Calculate scale to match 50% zoom
      const scale = 0.5;  // Fixed scale to match your original 50% zoom
      
      // Apply transformations
      container.style.transform = `scale(${scale})`;
      container.style.width = `${baseWidth}px`;
      container.style.height = `${baseHeight}px`;
      container.style.transformOrigin = '0 0';
      
      // Position the wrapper
      wrapper.style.width = `${viewportWidth}px`;
      wrapper.style.height = `${viewportHeight}px`;
      wrapper.style.overflow = 'hidden';
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
    position: fixed;
    top: 0;
    left: 0;
  }

  .dashboard-container {
    position: absolute;
    top: 0;
    left: 0;
    background: white;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style>