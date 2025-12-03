-- Migration 020: Add personalization content column
-- Stores AI-generated personalization content from PersonalizationContentAgent

-- Add personalization_content column to itineraries table
ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS personalization_content JSONB;

-- Comment documenting the structure
COMMENT ON COLUMN itineraries.personalization_content IS 'AI-generated personalization content including:
{
  "personalizedIntro": {
    "headline": "string",
    "subheadline": "string",
    "narrative": "string",
    "highlights": ["string"],
    "personalizedFor": ["string"]
  },
  "dayThemes": [
    {
      "day": 1,
      "date": "2025-01-01",
      "city": "Paris",
      "theme": "Romantic Beginnings",
      "subtitle": "Your love story starts here",
      "icon": "heart"
    }
  ],
  "tripStyleProfile": {
    "cultural": 30,
    "adventure": 20,
    "relaxation": 15,
    "culinary": 25,
    "nature": 10
  },
  "tripNarrative": "Full trip story text..."
}';
