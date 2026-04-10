// src/lib/charts/zoom.ts
import * as d3 from 'd3';

/**
 * Attaches d3-zoom to an SVG element. Returns the zoom behavior so the caller
 * can programmatically reset the transform later.
 */
export function attachZoom(
  svgEl: SVGSVGElement,
  onZoom: (transform: d3.ZoomTransform) => void,
  scaleExtent: [number, number] = [0.5, 20]
): d3.ZoomBehavior<SVGSVGElement, unknown> {
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent(scaleExtent)
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      onZoom(event.transform);
    });
  d3.select(svgEl).call(zoom);
  return zoom;
}

/**
 * Animates the SVG back to the identity transform (no pan, no zoom).
 */
export function resetZoom(
  svgEl: SVGSVGElement,
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>
): void {
  d3.select(svgEl)
    .transition()
    .duration(300)
    .call(zoom.transform, d3.zoomIdentity);
}
