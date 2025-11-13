// Service for fetching and managing European landmarks

export interface Landmark {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  country: string;
  city: string;
  icon_type: string;
  description: string;
  image_url: string;
  rating: number;
  visit_duration: number;
}

export interface LandmarkRegionParams {
  north: number;
  south: number;
  east: number;
  west: number;
  type?: string;
}

/**
 * Fetch landmarks within a geographic bounding box
 */
export async function fetchLandmarksInRegion(params: LandmarkRegionParams): Promise<Landmark[]> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const queryParams = new URLSearchParams({
    north: params.north.toString(),
    south: params.south.toString(),
    east: params.east.toString(),
    west: params.west.toString(),
    ...(params.type && params.type !== 'all' ? { type: params.type } : {})
  });

  try {
    const response = await fetch(`${apiUrl}/api/landmarks/region?${queryParams}`);
    const data = await response.json();

    if (data.success) {
      return data.landmarks;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch landmarks:', error);
    return [];
  }
}

/**
 * Get all available landmark types
 */
export async function fetchLandmarkTypes(): Promise<string[]> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${apiUrl}/api/landmarks/types`);
    const data = await response.json();

    if (data.success) {
      return data.types;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch landmark types:', error);
    return [];
  }
}

/**
 * Calculate bounding box from route coordinates with padding
 */
export function calculateBoundingBox(
  coordinates: { lat: number; lng: number }[],
  paddingPercent: number = 20
): LandmarkRegionParams {
  if (coordinates.length === 0) {
    // Default to Europe
    return {
      north: 71,
      south: 36,
      east: 40,
      west: -10
    };
  }

  const lats = coordinates.map(c => c.lat);
  const lngs = coordinates.map(c => c.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Add padding
  const latPadding = (maxLat - minLat) * (paddingPercent / 100);
  const lngPadding = (maxLng - minLng) * (paddingPercent / 100);

  return {
    north: maxLat + latPadding,
    south: minLat - latPadding,
    east: maxLng + lngPadding,
    west: minLng - lngPadding
  };
}

/**
 * Get landmark image path from public/images/landmarks folder
 */
export function getLandmarkImagePath(landmarkName: string): string | undefined {
  const landmarkMap: Record<string, string> = {
    'Eiffel Tower': '/images/landmarks/eiffel_tower.png',
    'Colosseum': '/images/landmarks/colosseum.png',
    'Big Ben': '/images/landmarks/big_ben.png',
    'Sagrada Familia': '/images/landmarks/sagrada_familia.png',
    'Arc de Triomphe': '/images/landmarks/arc_de_triomphe.png',
    'Notre Dame': '/images/landmarks/notre_dame.png',
    'Acropolis': '/images/landmarks/acropolis_athens.png',
    'Parthenon': '/images/landmarks/parthenon.png',
    'Leaning Tower of Pisa': '/images/landmarks/pisa.png',
    'Trevi Fountain': '/images/landmarks/trevi_fountain.png',
    'Brandenburg Gate': '/images/landmarks/brandenburg_gate.png',
    'Neuschwanstein Castle': '/images/landmarks/neuschwanstein_castle.png',
    'Stonehenge': '/images/landmarks/stonehenge.png',
    'Tower Bridge': '/images/landmarks/tower_bridge.png',
    'Edinburgh Castle': '/images/landmarks/edinburgh_castle.png',
    'Mont Saint-Michel': '/images/landmarks/mont_saint_michel.png',
    'Versailles': '/images/landmarks/versailles.png',
    'Charles Bridge': '/images/landmarks/charles_bridge_prague.png',
    "St. Peter's Basilica": '/images/landmarks/st_peter.png',
    'Alhambra': '/images/landmarks/alhambra_granada.png',
    'Atomium': '/images/landmarks/atomium_brussels.png',
    'Cologne Cathedral': '/images/landmarks/cologne_cathedral.png',
    'Duomo di Milano': '/images/landmarks/duomo_milano.png',
    'Cliffs of Moher': '/images/landmarks/cliffs_of_moher.png',
    'Geirangerfjord': '/images/landmarks/geirangerfjord_norway.png',
    'Hallstatt': '/images/landmarks/hallstatt_village_austria.png',
    'Kinderdijk Windmills': '/images/landmarks/kinderdijk_windmills.png',
    'Little Mermaid': '/images/landmarks/little_mermaid_copenhagen.png',
    'Matterhorn': '/images/landmarks/matterhorn.png',
    'Pena Palace': '/images/landmarks/pena_palace.png',
    'Jerónimos Monastery': '/images/landmarks/jeronimo-monestary.png',
    'Schönbrunn Palace': '/images/landmarks/schonnbrun_vienna.png',
    "St. Basil's Cathedral": '/images/landmarks/st_basils_moscow.png',
    "St. Mark's Basilica": '/images/landmarks/st_mark_venice.png'
  };

  // Try exact match first
  if (landmarkMap[landmarkName]) {
    return landmarkMap[landmarkName];
  }

  // Try partial match
  const partialMatch = Object.keys(landmarkMap).find(key =>
    landmarkName.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(landmarkName.toLowerCase())
  );

  return partialMatch ? landmarkMap[partialMatch] : undefined;
}
