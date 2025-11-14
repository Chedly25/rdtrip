/**
 * DirectionsMapArtifact - Enhanced directions display
 *
 * Wraps existing DirectionsCard component with artifact-specific enhancements
 */

import { DirectionsCard } from '../DirectionsCard';

interface DirectionsMapArtifactProps {
  data: any;
}

export function DirectionsMapArtifact({ data }: DirectionsMapArtifactProps) {
  // Use existing DirectionsCard component
  return <DirectionsCard data={data} />;
}
