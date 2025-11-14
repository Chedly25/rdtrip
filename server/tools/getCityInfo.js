/**
 * Tool: Get City Info
 *
 * Get comprehensive information about a city (overview, culture, tips, safety)
 * Great for answering "tell me about" questions
 * Uses Perplexity API for up-to-date, curated information
 */

const axios = require('axios');

/**
 * Execute city info request
 * @param {Object} params - Tool parameters
 * @param {string} params.city - City name
 * @param {string} [params.focus='overview'] - What aspect to focus on (overview, culture, food, safety, tips)
 * @param {Object} context - Agent context (userId, routeId, etc.)
 * @returns {Promise<Object>} City information
 */
async function getCityInfo(params, context) {
  const { city, focus = 'overview' } = params;

  // Validate parameters
  if (!city) {
    throw new Error('City is required');
  }

  const validFocus = ['overview', 'culture', 'food', 'safety', 'tips'];
  const focusArea = validFocus.includes(focus) ? focus : 'overview';

  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    return {
      success: false,
      error: 'Perplexity API key not configured. Please add PERPLEXITY_API_KEY to environment variables.'
    };
  }

  try {
    console.log(`📚 Getting city info for ${city} (focus: ${focusArea})`);

    // Build focused query based on focus area
    const queries = {
      overview: `Tell me about ${city} as a travel destination. Include key highlights, best time to visit, and what makes it special. Be concise but informative.`,
      culture: `What should I know about the culture and customs in ${city}? Include etiquette tips, local traditions, and cultural highlights.`,
      food: `What are the must-try foods and best restaurants in ${city}? Include local specialties and dining recommendations.`,
      safety: `What should I know about safety in ${city}? Include tips for travelers, areas to avoid, and general safety advice.`,
      tips: `What are the best travel tips for visiting ${city}? Include practical advice about transportation, money, best areas to stay, and insider tips.`
    };

    const query = queries[focusArea];

    // Call Perplexity API
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online', // Fast online model
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable travel guide. Provide accurate, helpful information about cities and destinations. Be specific, practical, and focus on what travelers actually need to know. Include recent information when relevant.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 0.9,
        return_citations: true,
        search_recency_filter: 'month' // Recent information
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const data = response.data;
    const answer = data.choices[0]?.message?.content || 'No information found.';
    const citations = data.citations || [];

    console.log(`✅ Got city info for ${city} (${answer.length} chars)`);

    // Parse the answer into sections (if possible)
    const sections = parseAnswerIntoSections(answer, focusArea);

    return {
      success: true,
      city: city,
      focus: focusArea,
      information: answer,
      sections: sections,
      citations: citations,
      sources: citations.length,
      summary: generateCityInfoSummary(city, focusArea, answer, citations)
    };

  } catch (error) {
    console.error('Perplexity API error for city info:', error.message);

    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
      return {
        success: false,
        error: `Perplexity API error: ${error.response.status} - ${error.response.statusText}`,
        details: error.response.data?.error || 'Unknown error'
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timed out. Please try again.'
      };
    }

    return {
      success: false,
      error: `Failed to get city info: ${error.message}`
    };
  }
}

/**
 * Parse answer into structured sections (basic heuristic)
 */
function parseAnswerIntoSections(answer, focusArea) {
  // Try to split by common section headers
  const sections = [];

  // Split by numbered lists or bullet points
  const lines = answer.split('\n');
  let currentSection = { title: 'Overview', content: '' };

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers (lines that end with : or are in bold **text**)
    if (trimmed.match(/^#+\s+/) || trimmed.match(/^\*\*.*\*\*:?$/) || trimmed.endsWith(':')) {
      // Save previous section
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection });
      }

      // Start new section
      currentSection = {
        title: trimmed.replace(/^#+\s+/, '').replace(/\*\*/g, '').replace(/:$/, ''),
        content: ''
      };
    } else {
      currentSection.content += line + '\n';
    }
  }

  // Add last section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : [{ title: focusArea, content: answer }];
}

/**
 * Generate natural language summary
 */
function generateCityInfoSummary(city, focusArea, answer, citations) {
  let summary = `Information about ${city} (${focusArea}):\n\n${answer}`;

  if (citations.length > 0) {
    summary += `\n\n📚 Sources (${citations.length}):`;
    citations.slice(0, 3).forEach((citation, index) => {
      summary += `\n${index + 1}. ${citation}`;
    });

    if (citations.length > 3) {
      summary += `\n... and ${citations.length - 3} more sources`;
    }
  }

  return summary;
}

module.exports = getCityInfo;
