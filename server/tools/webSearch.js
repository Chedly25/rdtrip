/**
 * Tool: Web Search
 *
 * Search the web using Perplexity API for travel information, tips, guides
 * Use this for questions about destinations, local customs, best time to visit, etc.
 */

const axios = require('axios');

/**
 * Execute web search
 * @param {Object} params - Tool parameters
 * @param {string} params.query - Search query
 * @param {Object} context - Agent context (userId, routeId, etc.)
 * @returns {Promise<Object>} Search results
 */
async function webSearch(params, context) {
  const { query } = params;

  // Validate parameters
  if (!query) {
    throw new Error('Query is required');
  }

  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    return {
      success: false,
      error: 'Perplexity API key not configured. Please add PERPLEXITY_API_KEY to environment variables.'
    };
  }

  try {
    console.log(`🔍 Web search: "${query}"`);

    // Call Perplexity API (chat completion format, not function calling)
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online', // Fast online model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful travel assistant. Provide accurate, up-to-date information about travel destinations, local customs, tips, and recommendations. Be concise but informative. Include specific details like dates, prices, and practical advice when relevant.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        search_recency_filter: 'month' // Focus on recent information
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30s timeout for web search
      }
    );

    const data = response.data;

    // Extract response and citations
    const answer = data.choices[0]?.message?.content || 'No results found.';
    const citations = data.citations || [];

    console.log(`✅ Web search completed: ${answer.slice(0, 100)}...`);

    return {
      success: true,
      query: query,
      answer: answer,
      citations: citations,
      sources: citations.length,
      model: data.model,
      summary: generateSearchSummary(query, answer, citations)
    };

  } catch (error) {
    console.error('Perplexity API error:', error.message);

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
        error: 'Search timed out after 30 seconds. Please try a more specific query.'
      };
    }

    return {
      success: false,
      error: `Failed to search: ${error.message}`
    };
  }
}

/**
 * Generate natural language summary of search results
 */
function generateSearchSummary(query, answer, citations) {
  let summary = `Search results for "${query}":\n\n${answer}`;

  if (citations.length > 0) {
    summary += `\n\nSources (${citations.length}):`;
    citations.slice(0, 3).forEach((citation, index) => {
      summary += `\n${index + 1}. ${citation}`;
    });

    if (citations.length > 3) {
      summary += `\n... and ${citations.length - 3} more sources`;
    }
  }

  return summary;
}

module.exports = webSearch;
