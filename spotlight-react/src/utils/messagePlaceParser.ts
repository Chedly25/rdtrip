/**
 * Message Place Parser - Extract place cards from agent messages
 *
 * Parses messages containing [[place:BASE64_JSON]] markers and returns
 * structured segments for rendering with InlinePlaceCard components.
 *
 * Format: [[place:BASE64_ENCODED_JSON]]
 *
 * Example JSON:
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
 */

import type { PlaceData } from '../components/agent/InlinePlaceCard';

export interface TextSegment {
  type: 'text';
  content: string;
}

export interface PlaceSegment {
  type: 'place';
  place: PlaceData;
}

export type MessageSegment = TextSegment | PlaceSegment;

// Regex to match [[place:BASE64_JSON]] markers
const PLACE_MARKER_REGEX = /\[\[place:([A-Za-z0-9+/=]+)\]\]/g;

/**
 * Parse a message and extract place markers
 * Returns array of text and place segments for rendering
 */
export function parseMessageForPlaces(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  // Reset regex state
  PLACE_MARKER_REGEX.lastIndex = 0;

  let match;
  while ((match = PLACE_MARKER_REGEX.exec(content)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    // Try to decode the place data
    try {
      const base64Data = match[1];
      const jsonString = atob(base64Data);
      const placeData = JSON.parse(jsonString) as PlaceData;

      // Validate required fields
      if (placeData.name) {
        segments.push({ type: 'place', place: placeData });
      } else {
        // Invalid place data - render as text
        segments.push({ type: 'text', content: match[0] });
      }
    } catch (error) {
      console.warn('Failed to parse place marker:', match[0], error);
      // Failed to decode - render as text
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
 * Check if a message contains any place markers
 */
export function hasPlaceMarkers(content: string): boolean {
  PLACE_MARKER_REGEX.lastIndex = 0;
  return PLACE_MARKER_REGEX.test(content);
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
