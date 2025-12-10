/**
 * Message Parser - Extract place cards and quick action chips from agent messages
 *
 * Parses messages containing:
 * - [[place:BASE64_JSON]] markers for inline place cards
 * - [[chips:BASE64_JSON]] markers for quick action chips
 *
 * Place JSON:
 * {
 *   "name": "Le Comptoir du Panthéon",
 *   "rating": 4.6,
 *   "photo": "https://...",
 *   "types": ["restaurant", "food"],
 *   "address": "123 Rue Example, Paris",
 *   "priceLevel": 2,
 *   "lat": 48.8566,
 *   "lng": 2.3522
 * }
 *
 * Chips JSON:
 * {
 *   "chips": [
 *     { "id": "food", "label": "Food & Wine", "value": "I want food experiences", "icon": "food", "color": "amber" }
 *   ]
 * }
 */

import type { PlaceData } from '../components/agent/InlinePlaceCard';
import type { QuickActionChip } from '../components/agent/QuickActionChips';

export interface TextSegment {
  type: 'text';
  content: string;
}

export interface PlaceSegment {
  type: 'place';
  place: PlaceData;
}

export interface ChipsSegment {
  type: 'chips';
  chips: QuickActionChip[];
}

export type MessageSegment = TextSegment | PlaceSegment | ChipsSegment;

// Regex to match [[place:BASE64_JSON]] markers
const PLACE_MARKER_REGEX = /\[\[place:([A-Za-z0-9+/=]+)\]\]/g;

// Regex to match [[chips:BASE64_JSON]] markers
const CHIPS_MARKER_REGEX = /\[\[chips:([A-Za-z0-9+/=]+)\]\]/g;

// Combined regex for any marker type
const ANY_MARKER_REGEX = /\[\[(place|chips):([A-Za-z0-9+/=]+)\]\]/g;

/**
 * Parse a message and extract place and chips markers
 * Returns array of text, place, and chips segments for rendering
 */
export function parseMessageForPlaces(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  // Reset regex state
  ANY_MARKER_REGEX.lastIndex = 0;

  let match;
  while ((match = ANY_MARKER_REGEX.exec(content)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    const markerType = match[1]; // 'place' or 'chips'
    const base64Data = match[2];

    try {
      const jsonString = atob(base64Data);
      const parsedData = JSON.parse(jsonString);

      if (markerType === 'place') {
        // Validate place data
        const placeData = parsedData as PlaceData;
        if (placeData.name) {
          segments.push({ type: 'place', place: placeData });
        } else {
          segments.push({ type: 'text', content: match[0] });
        }
      } else if (markerType === 'chips') {
        // Validate chips data
        const chipsData = parsedData as { chips: QuickActionChip[] };
        if (chipsData.chips && Array.isArray(chipsData.chips) && chipsData.chips.length > 0) {
          segments.push({ type: 'chips', chips: chipsData.chips });
        } else {
          segments.push({ type: 'text', content: match[0] });
        }
      }
    } catch (error) {
      console.warn(`Failed to parse ${markerType} marker:`, match[0], error);
      segments.push({ type: 'text', content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText.trim()) {
      segments.push({ type: 'text', content: remainingText });
    }
  }

  // If no segments were created, return the original content as text
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: 'text', content });
  }

  return segments;
}

/**
 * Check if a message contains any markers (place or chips)
 */
export function hasPlaceMarkers(content: string): boolean {
  ANY_MARKER_REGEX.lastIndex = 0;
  return ANY_MARKER_REGEX.test(content);
}

/**
 * Check if a message contains chips markers specifically
 */
export function hasChipsMarkers(content: string): boolean {
  CHIPS_MARKER_REGEX.lastIndex = 0;
  return CHIPS_MARKER_REGEX.test(content);
}

/**
 * Encode place data for inclusion in agent response
 * This is used by the backend mentionPlace tool
 */
export function encodePlaceMarker(place: PlaceData): string {
  const jsonString = JSON.stringify(place);
  const base64 = btoa(jsonString);
  return `[[place:${base64}]]`;
}

/**
 * Extract all places from a message without the text segments
 * Useful for getting a list of mentioned places
 */
export function extractPlaces(content: string): PlaceData[] {
  const segments = parseMessageForPlaces(content);
  return segments
    .filter((s): s is PlaceSegment => s.type === 'place')
    .map(s => s.place);
}

/**
 * Remove place markers from content, returning plain text
 * Useful for accessibility or fallback rendering
 */
export function stripPlaceMarkers(content: string): string {
  PLACE_MARKER_REGEX.lastIndex = 0;
  return content.replace(PLACE_MARKER_REGEX, (_match, base64) => {
    try {
      const jsonString = atob(base64);
      const place = JSON.parse(jsonString) as PlaceData;
      return place.name || '';
    } catch {
      return '';
    }
  });
}

/**
 * Encode chips data for inclusion in agent response
 * This is used by the backend suggestActions tool
 */
export function encodeChipsMarker(chips: QuickActionChip[]): string {
  const jsonString = JSON.stringify({ chips });
  const base64 = btoa(jsonString);
  return `[[chips:${base64}]]`;
}

/**
 * Extract all chips from a message
 */
export function extractChips(content: string): QuickActionChip[] {
  const segments = parseMessageForPlaces(content);
  const chipsSegment = segments.find((s): s is ChipsSegment => s.type === 'chips');
  return chipsSegment?.chips || [];
}
