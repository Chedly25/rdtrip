/**
 * Perplexity AI Client
 * Thin wrapper for Perplexity AI API calls
 */
const axios = require('axios');

class PerplexityClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    
    if (!this.apiKey) {
      throw new Error('Perplexity API key is required');
    }
  }

  /**
   * Send chat completion request
   */
  async chat(messages, model = 'llama-3.1-sonar-large-128k-online', options = {}) {
    try {
      const response = await axios.post(this.baseUrl, {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
        ...options
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: options.timeout || 60000 // 60s for AI responses
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Perplexity API error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
      }
      throw error;
    }
  }

  /**
   * Simple query (single user message)
   */
  async query(content, model = 'llama-3.1-sonar-large-128k-online', options = {}) {
    return this.chat([{ role: 'user', content }], model, options);
  }
}

module.exports = PerplexityClient;

