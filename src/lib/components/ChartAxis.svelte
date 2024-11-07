<!-- ChartAxis.svelte -->
<script lang="ts">
// Types
type AxisType = 'x' | 'y';

export let type: AxisType = 'x';
export let label: string = '';
export let zoomLevel: number = 1;
export let panX: number = 0;
export let panY: number = 0;
export let ticks: number[] = [];

// Function to calculate the position of ticks based on their value
function getTickPosition(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * 100;
}

// Get min and max from ticks if they exist
$: min = Math.min(...ticks);
$: max = Math.max(...ticks);

$: transformStyle = `scale(${1/zoomLevel}) translate(${-panX/zoomLevel}px, ${-panY/zoomLevel}px)`;
</script>

<div class="axis" class:x={type === 'x'} class:y={type === 'y'}>
  {#if type === 'x'}
    <div class="axis-ticks" style="transform: {transformStyle}">
      {#each ticks as tick}
        <div 
          class="tick" 
          style="left: {getTickPosition(tick, min, max)}%"
          role="presentation"
        >
          <span>{tick}</span>
        </div>
      {/each}
    </div>
    <div 
      class="axis-label" 
      style="transform: {transformStyle}"
      role="presentation"
    >
      {label}
    </div>
  {:else}
    <div class="axis-ticks" style="transform: {transformStyle}">
      {#each ticks as tick}
        <div 
          class="tick" 
          style="bottom: {getTickPosition(tick, min, max)}%"
          role="presentation"
        >
          <span>{tick}</span>
        </div>
      {/each}
    </div>
    <div 
      class="axis-label" 
      style="transform: {transformStyle} rotate(-90deg)"
      role="presentation"
    >
      {label}
    </div>
  {/if}
</div>

<style>
.axis {
  position: absolute;
  pointer-events: none;
}

.axis.x {
  bottom: 0;
  left: 16px;
  right: 8px;
  height: 40px;
}

.axis.y {
  top: 8px;
  bottom: 40px;
  left: 0;
  width: 40px;
}

.axis-ticks {
  position: absolute;
  inset: 0;
}

.tick {
  position: absolute;
  font-size: 12px;
  color: #666;
}

.tick span {
  transform: translateX(-50%);
  display: inline-block;
}

.axis-label {
  position: absolute;
  text-align: center;
  font-size: 14px;
  color: #666;
  width: 100%;
  bottom: -24px;
}

.axis.y .axis-label {
  width: max-content;
  transform-origin: left center;
  left: 16px;
  bottom: 50%;
}
</style>