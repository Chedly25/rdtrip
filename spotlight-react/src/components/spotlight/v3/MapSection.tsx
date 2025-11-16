/**
 * MapSection - Map Container for SpotlightV3
 * Phase 1: Wrapper for MapViewV2 with glassmorphism controls
 *
 * Preserves ALL existing Mapbox features:
 * - Route polyline rendering
 * - Numbered markers
 * - Click to select city
 * - Drag markers to reorder
 * - Add custom waypoints
 * - Zoom/pan controls
 */

import MapViewV2 from '../v2/MapViewV2';

const MapSection = () => {
  return (
    <div className="relative w-full h-full">
      {/* Map - Preserves existing MapViewV2 with all features */}
      <MapViewV2 />

      {/* Glassmorphism overlay for map controls (optional) */}
      {/* You can add zoom controls, legend, etc. here with glass styling */}
    </div>
  );
};

export default MapSection;
