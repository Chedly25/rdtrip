/**
 * translateText - Translate Text
 *
 * Uses Claude itself to translate text between languages.
 * Cost-effective and accurate for travel phrases.
 */

const Anthropic = require('@anthropic-ai/sdk');

/**
 * @param {Object} args
 * @param {string} args.text - Text to translate
 * @param {string} args.targetLanguage - Target language (e.g., 'French', 'Spanish', 'Italian')
 * @param {string} [args.context] - Optional context (e.g., 'restaurant menu', 'asking for directions')
 */
async function translateText({ text, targetLanguage, context }) {
  try {
    console.log(`🌐 Translating "${text.slice(0, 50)}..." to ${targetLanguage}`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const contextPrompt = context ? `\n\nContext: This is used for ${context}.` : '';

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Translate the following text to ${targetLanguage}. Only respond with the translation, nothing else.${contextPrompt}\n\nText to translate: ${text}`
      }]
    });

    const translation = message.content[0].text.trim();

    console.log(`✅ Translated: "${text}" → "${translation}"`);

    return {
      success: true,
      originalText: text,
      translatedText: translation,
      targetLanguage,
      context: context || 'general'
    };

  } catch (error) {
    console.error('Error translating text:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to translate text'
    };
  }
}

module.exports = translateText;
