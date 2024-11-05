<!-- $lib/components/DashboardLayout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  let container: HTMLElement;
  let wrapper: HTMLElement;
  
  function updateLayout() {
    if (container && wrapper) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Increased width to use more horizontal space
      const baseWidth = 2400; // Increased from 1920
      const baseHeight = 1200;
      
      const horizontalScale = viewportWidth / baseWidth;
      const verticalScale = viewportHeight / baseHeight;
      const scale = Math.min(horizontalScale, verticalScale) * 0.98; // Using 98% of available space
      
      container.style.transform = `scale(${scale})`;
      container.style.width = `${baseWidth}px`;
      container.style.height = `${baseHeight}px`;
      
      const scaledWidth = baseWidth * scale;
      const scaledHeight = baseHeight * scale;
      wrapper.style.width = `${scaledWidth}px`;
      wrapper.style.height = `${scaledHeight}px`;
      wrapper.style.marginLeft = `${(viewportWidth - scaledWidth) / 2}px`;
      wrapper.style.marginTop = `${(viewportHeight - scaledHeight) / 2}px`;
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
    overflow: hidden;
  }

  .dashboard-container {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    background: white;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style>