/**
 * WeatherDisplayArtifact - Enhanced weather display
 *
 * Wraps existing WeatherCard component with artifact-specific enhancements
 */

import { WeatherCard } from '../WeatherCard';

interface WeatherDisplayArtifactProps {
  data: any;
}

export function WeatherDisplayArtifact({ data }: WeatherDisplayArtifactProps) {
  // Use existing WeatherCard component
  return <WeatherCard data={data} />;
}
