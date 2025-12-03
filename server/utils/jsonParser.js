/**
 * Robust JSON Parser Utility
 *
 * Handles common issues with LLM-generated JSON:
 * - Markdown code blocks
 * - Truncated responses
 * - Trailing commas
 * - Unclosed brackets/braces
 */

/**
 * Parse JSON from LLM response text with automatic repair
 * @param {string} responseText - Raw text from LLM response
 * @param {object} options - Parsing options
 * @param {boolean} options.logErrors - Whether to log parsing errors (default: true)
 * @param {string} options.agentName - Name of the agent for logging
 * @returns {object} Parsed JSON object
 * @throws {Error} If JSON cannot be parsed or repaired
 */
function parseJsonResponse(responseText, options = {}) {
  const { logErrors = true, agentName = 'Agent' } = options;

  try {
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1];
    } else if (jsonText.includes('```')) {
      const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1];
    }

    // Find JSON object or array boundaries
    const jsonObjectStart = jsonText.indexOf('{');
    const jsonArrayStart = jsonText.indexOf('[');

    let jsonStart;
    let isArray = false;

    if (jsonObjectStart === -1 && jsonArrayStart === -1) {
      throw new Error('No JSON object or array found in response');
    } else if (jsonObjectStart === -1) {
      jsonStart = jsonArrayStart;
      isArray = true;
    } else if (jsonArrayStart === -1) {
      jsonStart = jsonObjectStart;
    } else {
      jsonStart = Math.min(jsonObjectStart, jsonArrayStart);
      isArray = jsonArrayStart < jsonObjectStart;
    }

    const closingChar = isArray ? ']' : '}';
    let jsonEnd = jsonText.lastIndexOf(closingChar);

    // If no proper closing found, attempt repair
    if (jsonEnd === -1 || jsonEnd < jsonStart) {
      console.log(`⚠️  ${agentName}: JSON appears truncated, attempting repair...`);
      jsonText = repairTruncatedJson(jsonText.substring(jsonStart));
    } else {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }

    // Try to parse, with repair attempt on failure
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.log(`⚠️  ${agentName}: Initial parse failed (${parseError.message}), attempting JSON repair...`);
      jsonText = repairTruncatedJson(jsonText);
      parsed = JSON.parse(jsonText);
      console.log(`✓ ${agentName}: JSON repair successful`);
    }

    return parsed;

  } catch (error) {
    if (logErrors) {
      console.error(`Failed to parse ${agentName} response:`, responseText.substring(0, 500));
    }
    throw new Error(`JSON parsing failed: ${error.message}`);
  }
}

/**
 * Attempt to repair truncated JSON by closing open brackets/braces
 * Handles cases where the LLM response was cut off mid-stream
 * @param {string} jsonText - Potentially truncated JSON string
 * @returns {string} Repaired JSON string
 */
function repairTruncatedJson(jsonText) {
  let repaired = jsonText.trim();

  // Count open brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }

  // If we're in the middle of a string, close it
  if (inString) {
    repaired += '"';
  }

  // Remove trailing comma if present before closing
  repaired = repaired.replace(/,\s*$/, '');

  // Remove incomplete key-value pairs (e.g., "key": or "key":  )
  repaired = repaired.replace(/,?\s*"[^"]*":\s*$/, '');

  // Close any open brackets first, then braces
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }

  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }

  return repaired;
}

/**
 * Check if a response appears to be truncated JSON
 * @param {string} responseText - Response to check
 * @returns {boolean} True if the response appears truncated
 */
function isTruncatedJson(responseText) {
  const text = responseText.trim();

  // Count brackets/braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }

  // If there are unclosed brackets/braces, it's truncated
  return openBraces !== 0 || openBrackets !== 0 || inString;
}

module.exports = {
  parseJsonResponse,
  repairTruncatedJson,
  isTruncatedJson
};
