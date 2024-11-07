<!-- $lib/components/InteractiveWrapper.svelte -->
<script lang="ts">
  import { spring } from 'svelte/motion';
  import { createEventDispatcher } from 'svelte';

  // Props with defaults
  export let width: number = 800;
  export let height: number = 600;
  export let enableZoom: boolean = true;
  export let enablePan: boolean = true;
  export let minZoom: number = 0.5;
  export let maxZoom: number = 5;
  export let initialZoom: number = 1;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // State management using spring for smooth animations
  const transform = spring(
    { x: 0, y: 0, scale: initialZoom },
    {
      stiffness: 0.1,
      damping: 0.7
    }
  );
  
  // Track interaction state
  let isDragging = false;
  let lastPos = { x: 0, y: 0 };
  let startPos = { x: 0, y: 0 };

  // Constants for keyboard navigation
  const MOVE_STEP = 10;
  const ZOOM_STEP = 0.1;
  
  // Zoom handling with smooth interpolation
  function handleWheel(event: WheelEvent) {
    if (!enableZoom) return;
    event.preventDefault();
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate zoom factor with smooth interpolation
    const delta = event.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(minZoom, Math.min(maxZoom, $transform.scale * delta));
    
    handleZoom(newScale, mouseX, mouseY);
  }

  function handleZoom(newScale: number, centerX?: number, centerY?: number) {
    if (newScale === $transform.scale) return;

    const scaleRatio = newScale / $transform.scale;
    let dx = 0;
    let dy = 0;

    if (centerX !== undefined && centerY !== undefined) {
      dx = centerX - centerX * scaleRatio;
      dy = centerY - centerY * scaleRatio;
    }

    transform.set({
      scale: newScale,
      x: $transform.x + dx,
      y: $transform.y + dy
    });

    dispatch('transform', {
      scale: newScale,
      x: $transform.x + dx,
      y: $transform.y + dy
    });
  }
  
  // Pan handling
  function handleMouseDown(event: MouseEvent) {
    if (!enablePan) return;
    isDragging = true;
    startPos = { x: event.clientX, y: event.clientY };
    lastPos = { x: $transform.x, y: $transform.y };
  }
  
  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    
    const dx = event.clientX - startPos.x;
    const dy = event.clientY - startPos.y;
    
    updateTransform(lastPos.x + dx, lastPos.y + dy);
  }
  
  function handleMouseUp() {
    isDragging = false;
  }
  
  // Touch handling for mobile/touchpad
  let lastTouchDistance = 0;
  
  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
      lastTouchDistance = getTouchDistance(event.touches);
    } else if (event.touches.length === 1) {
      handleMouseDown(event.touches[0] as unknown as MouseEvent);
    }
  }
  
  function handleTouchMove(event: TouchEvent) {
    event.preventDefault();
    
    if (event.touches.length === 2) {
      const distance = getTouchDistance(event.touches);
      const delta = distance / lastTouchDistance;
      
      if (lastTouchDistance > 0) {
        const newScale = Math.max(minZoom, Math.min(maxZoom, $transform.scale * delta));
        handleZoom(newScale);
      }
      
      lastTouchDistance = distance;
    } else if (event.touches.length === 1) {
      handleMouseMove(event.touches[0] as unknown as MouseEvent);
    }
  }
  
  function handleTouchEnd() {
    lastTouchDistance = 0;
    handleMouseUp();
  }
  
  function getTouchDistance(touches: TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Keyboard navigation
  function handleKeyDown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;

    switch (event.key) {
      case 'ArrowLeft':
        updateTransform($transform.x - MOVE_STEP, $transform.y);
        event.preventDefault();
        break;
      case 'ArrowRight':
        updateTransform($transform.x + MOVE_STEP, $transform.y);
        event.preventDefault();
        break;
      case 'ArrowUp':
        if (event.ctrlKey || event.metaKey) {
          handleZoom($transform.scale + ZOOM_STEP);
        } else {
          updateTransform($transform.x, $transform.y - MOVE_STEP);
        }
        event.preventDefault();
        break;
      case 'ArrowDown':
        if (event.ctrlKey || event.metaKey) {
          handleZoom($transform.scale - ZOOM_STEP);
        } else {
          updateTransform($transform.x, $transform.y + MOVE_STEP);
        }
        event.preventDefault();
        break;
      case '0':
        if (event.ctrlKey || event.metaKey) {
          reset();
          event.preventDefault();
        }
        break;
    }
  }

  function updateTransform(x: number, y: number) {
    transform.set({
      ...$transform,
      x,
      y
    });
    
    dispatch('transform', {
      ...$transform,
      x,
      y
    });
  }
  
  // Reset transform
  export function reset() {
    transform.set({ x: 0, y: 0, scale: initialZoom });
  }
</script>

<section
  aria-label="Interactive chart viewer"
  class="relative overflow-hidden touch-none"
  style="width: {width}px; height: {height}px;"
>
  <div class="sr-only" id="chart-instructions">
    Use arrow keys to pan the view. Hold Control or Command while using up/down arrows to zoom in and out.
    Press Control/Command + 0 to reset the view.
  </div>
  
  <button
    type="button"
    class="absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-describedby="chart-instructions"
    on:wheel|preventDefault={handleWheel}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:touchstart={handleTouchStart}
    on:touchmove|preventDefault={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:keydown={handleKeyDown}
  >
    <slot
      zoomLevel={$transform.scale}
      panX={$transform.x}
      panY={$transform.y}
    />
  </button>
</section>

<style>
  section {
    user-select: none;
    -webkit-user-select: none;
  }

  button {
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: default;
  }

  button::-moz-focus-inner {
    border: 0;
  }
</style>