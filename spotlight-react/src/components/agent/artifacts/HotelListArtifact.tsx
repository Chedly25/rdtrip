/**
 * HotelListArtifact - Enhanced hotel list display
 *
 * Wraps existing HotelCard component with artifact-specific enhancements
 */

import { HotelCard } from '../HotelCard';

interface Hotel {
  name: string;
  rating?: number;
  priceLevel?: number;
  address?: string;
  photo?: string;
  distance?: number;
  [key: string]: any;
}

interface HotelListArtifactProps {
  hotels: Hotel[];
  metadata?: {
    city?: string;
    [key: string]: any;
  };
}

export function HotelListArtifact({ hotels, metadata }: HotelListArtifactProps) {
  // Use existing HotelCard component
  // Cast to any to avoid type conflicts with legacy HotelCard
  return (
    <HotelCard
      data={{
        success: true,
        hotels: hotels as any,
        city: metadata?.city || '',
        count: hotels.length
      }}
    />
  );
}
