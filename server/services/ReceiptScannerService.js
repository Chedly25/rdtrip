/**
 * ReceiptScannerService
 *
 * AI-powered receipt scanning using Deepseek Vision for OCR and expense categorization.
 * Extracts merchant, amount, date, items, and automatically categorizes expenses.
 */

const OpenAI = require('openai');

// Expense categories aligned with database schema
const EXPENSE_CATEGORIES = [
  'accommodation',
  'food',
  'transportation',
  'activities',
  'shopping',
  'fuel',
  'tolls',
  'parking',
  'other'
];

class ReceiptScannerService {
  constructor() {
    // Use Deepseek API key (OpenAI-compatible)
    this.apiKey = process.env.DEEPSEEK_API_KEY || 'sk-d4bc11d58a654a428463c1c3b5252b37';
    this.baseURL = 'https://api.deepseek.com';
    this._client = null;

    if (!this.apiKey) {
      console.warn('DEEPSEEK_API_KEY not set - receipt scanning will not work');
    } else {
      console.log('✓ Deepseek API configured for receipt scanning');
    }
  }

  /**
   * Lazy-load Deepseek client (only when needed)
   * @returns {OpenAI} OpenAI-compatible client instance
   */
  get openai() {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured - receipt scanning is disabled');
    }

    if (!this._client) {
      this._client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL
      });
    }

    return this._client;
  }

  /**
   * Scan a receipt image and extract structured data using GPT-4 Vision
   * @param {Buffer} imageBuffer - Receipt image as buffer
   * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
   * @returns {Promise<Object>} Extracted receipt data
   */
  async scanReceipt(imageBuffer, mimeType = 'image/jpeg') {
    // Check if API key is configured
    if (!this.apiKey) {
      throw new Error('Receipt scanning is not available - OPENAI_API_KEY not configured');
    }

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      console.log('Scanning receipt with Deepseek Vision...');

      // Call Deepseek Vision API
      const response = await this.openai.chat.completions.create({
        model: "DeepSeek-V3.2-Exp",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: this._getReceiptExtractionPrompt()
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high" // High detail for better OCR accuracy
                }
              }
            ]
          }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
      });

      // Parse the response
      const content = response.choices[0].message.content;
      console.log('Deepseek Vision response:', content);

      // Extract JSON from response
      const receiptData = this._parseReceiptResponse(content);

      // Validate extracted data
      this._validateReceiptData(receiptData);

      // Add AI categorization
      const category = await this._categorizeExpense(receiptData);
      receiptData.aiCategory = category.category;
      receiptData.aiConfidence = category.confidence;

      console.log('Receipt scan successful:', {
        merchant: receiptData.merchant,
        amount: receiptData.amount,
        category: receiptData.aiCategory
      });

      return receiptData;

    } catch (error) {
      console.error('Receipt scanning failed:', error);
      throw new Error(`Failed to scan receipt: ${error.message}`);
    }
  }

  /**
   * Categorize an expense using AI
   * @param {Object} expenseData - Expense data (merchant, description, items)
   * @returns {Promise<Object>} Category and confidence score
   */
  async _categorizeExpense(expenseData) {
    try {
      const prompt = `Categorize this expense into ONE of these categories: ${EXPENSE_CATEGORIES.join(', ')}.

Expense details:
- Merchant: ${expenseData.merchant || 'Unknown'}
- Description: ${expenseData.description || 'N/A'}
- Items: ${expenseData.items ? expenseData.items.join(', ') : 'N/A'}

Respond with ONLY a JSON object in this exact format:
{
  "category": "one of the categories above",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;

      const response = await this.openai.chat.completions.create({
        model: "DeepSeek-V3.2-Exp",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150
      });

      const content = response.choices[0].message.content;
      const result = this._parseJSON(content);

      // Validate category
      if (!EXPENSE_CATEGORIES.includes(result.category)) {
        console.warn(`Invalid category "${result.category}", defaulting to "other"`);
        result.category = 'other';
        result.confidence = 0.5;
      }

      return {
        category: result.category,
        confidence: Math.min(Math.max(result.confidence || 0.7, 0), 1), // Clamp 0-1
        reasoning: result.reasoning
      };

    } catch (error) {
      console.error('Categorization failed:', error);
      return {
        category: 'other',
        confidence: 0.5,
        reasoning: 'Auto-categorization failed'
      };
    }
  }

  /**
   * Generate prompt for receipt extraction
   * @returns {string} Extraction prompt
   */
  _getReceiptExtractionPrompt() {
    return `You are a receipt OCR expert. Extract ALL information from this receipt and return it as a JSON object.

Extract these fields:
- merchant: Business/store name
- amount: Total amount (number only, no currency symbols)
- currency: Currency code (e.g., EUR, USD, GBP)
- date: Transaction date (YYYY-MM-DD format)
- items: Array of purchased items with name and price
- paymentMethod: Payment method if visible (cash, card, etc.)
- location: Store location/address if visible
- taxAmount: Tax amount if visible
- tipAmount: Tip amount if visible

Respond with ONLY a valid JSON object in this exact format:
{
  "merchant": "Store Name",
  "amount": 42.50,
  "currency": "EUR",
  "date": "2024-11-12",
  "items": [
    {"name": "Item 1", "price": 10.00},
    {"name": "Item 2", "price": 32.50}
  ],
  "paymentMethod": "card",
  "location": "City, Country",
  "taxAmount": 5.00,
  "tipAmount": 0.00,
  "description": "Brief description of purchase"
}

If any field is not visible on the receipt, use null. Be as accurate as possible with numbers.`;
  }

  /**
   * Parse JSON from GPT response (handles markdown code blocks)
   * @param {string} content - GPT response content
   * @returns {Object} Parsed JSON object
   */
  _parseJSON(content) {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.trim();

      // Remove ```json and ``` markers
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
      }

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON:', content);
      throw new Error('Invalid JSON response from AI');
    }
  }

  /**
   * Parse receipt extraction response
   * @param {string} content - GPT response content
   * @returns {Object} Parsed receipt data
   */
  _parseReceiptResponse(content) {
    const data = this._parseJSON(content);

    // Normalize data structure
    return {
      merchant: data.merchant || 'Unknown Merchant',
      amount: parseFloat(data.amount) || 0,
      currency: data.currency || 'EUR',
      date: data.date || new Date().toISOString().split('T')[0],
      items: Array.isArray(data.items) ? data.items : [],
      paymentMethod: data.paymentMethod || null,
      location: data.location || null,
      taxAmount: data.taxAmount ? parseFloat(data.taxAmount) : null,
      tipAmount: data.tipAmount ? parseFloat(data.tipAmount) : null,
      description: data.description || `Purchase at ${data.merchant || 'store'}`,
      rawData: data // Store original extraction
    };
  }

  /**
   * Validate extracted receipt data
   * @param {Object} data - Receipt data
   * @throws {Error} If validation fails
   */
  _validateReceiptData(data) {
    if (!data.amount || data.amount <= 0) {
      throw new Error('Invalid amount extracted from receipt');
    }

    if (!data.currency || data.currency.length !== 3) {
      console.warn('Invalid currency, defaulting to EUR');
      data.currency = 'EUR';
    }

    // Validate date format
    if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      console.warn('Invalid date format, using current date');
      data.date = new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Suggest expense split based on receipt items
   * @param {Array} items - Receipt items
   * @param {Array} participantIds - Array of participant user IDs
   * @returns {Object} Split suggestion
   */
  suggestSplit(items, participantIds) {
    if (!items || items.length === 0) {
      // Equal split by default
      return {
        method: 'equal',
        splitData: null,
        reasoning: 'No items found, suggesting equal split'
      };
    }

    // For now, suggest equal split
    // Future: AI could analyze items and suggest who should pay for what
    return {
      method: 'equal',
      splitData: null,
      reasoning: 'Equal split among all participants'
    };
  }

  /**
   * Get supported image formats
   * @returns {Array} Supported MIME types
   */
  getSupportedFormats() {
    return [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ];
  }

  /**
   * Validate image format
   * @param {string} mimeType - MIME type
   * @returns {boolean} Whether format is supported
   */
  isFormatSupported(mimeType) {
    return this.getSupportedFormats().includes(mimeType);
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      serviceName: 'ReceiptScannerService',
      status: this.apiKey ? 'ready' : 'not_configured',
      apiKeyConfigured: !!this.apiKey,
      supportedFormats: this.getSupportedFormats(),
      model: 'DeepSeek-V3.2-Exp',
      baseURL: this.baseURL
    };
  }
}

// Export singleton instance
module.exports = new ReceiptScannerService();
