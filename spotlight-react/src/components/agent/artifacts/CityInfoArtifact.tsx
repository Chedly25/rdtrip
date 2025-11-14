/**
 * CityInfoArtifact - Enhanced city information display
 *
 * Wraps existing CityInfoCard component with artifact-specific enhancements
 */

import { CityInfoCard } from '../CityInfoCard';

interface CityInfoArtifactProps {
  data: any;
}

export function CityInfoArtifact({ data }: CityInfoArtifactProps) {
  // Use existing CityInfoCard component
  return <CityInfoCard data={data} />;
}
