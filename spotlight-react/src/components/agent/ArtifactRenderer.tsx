/**
 * ArtifactRenderer - Routes artifacts to appropriate display components
 *
 * Each artifact type gets its own specialized component with
 * enhanced interactivity and actions
 */

import type { Artifact } from '../../contexts/AgentProvider';
import { ActivityGridArtifact } from './artifacts/ActivityGridArtifact';
import { HotelListArtifact } from './artifacts/HotelListArtifact';
import { WeatherDisplayArtifact } from './artifacts/WeatherDisplayArtifact';
import { DirectionsMapArtifact } from './artifacts/DirectionsMapArtifact';
import { CityInfoArtifact } from './artifacts/CityInfoArtifact';

interface ArtifactRendererProps {
  artifact: Artifact;
}

export function ArtifactRenderer({ artifact }: ArtifactRendererProps) {
  switch (artifact.type) {
    case 'activity_grid':
      return <ActivityGridArtifact activities={artifact.data} metadata={artifact.metadata} />;

    case 'hotel_list':
      return <HotelListArtifact hotels={artifact.data} metadata={artifact.metadata} />;

    case 'weather_display':
      return <WeatherDisplayArtifact data={artifact.data} />;

    case 'directions_map':
      return <DirectionsMapArtifact data={artifact.data} />;

    case 'city_info':
      return <CityInfoArtifact data={artifact.data} />;

    default:
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">❓</span>
          </div>
          <p className="font-medium">Unknown artifact type</p>
          <p className="text-sm">Type: {artifact.type}</p>
        </div>
      );
  }
}
