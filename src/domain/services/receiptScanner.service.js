/**
 * Receipt Scanner Service
 * AI-powered receipt scanning using Deepseek Vision
 */
const BaseService = require('./BaseService');
const OpenAI = require('openai');

// Expense categories aligned with database schema
const EXPENSE_CATEGORIES = [
  'accommodation', 'food', 'transportation', 'activities',
  'shopping', 'fuel', 'tolls', 'parking', 'other'
];

class ReceiptScannerService extends BaseService {
  constructor(apiKey, baseURL = 'https://api.deepseek.com') {
    super('ReceiptScanner');
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY;
    this.baseURL = baseURL;
    this._client = null;

    if (!this.apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY not set - receipt scanning will not work');
    } else {
      this.logger.info('Deepseek API configured for receipt scanning');
    }
  }

  /**
   * Lazy-load Deepseek client
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
   * Scan a receipt image and extract structured data
   */
  async scanReceipt(imageBuffer, mimeType = 'image/jpeg') {
    if (!this.apiKey) {
      throw new Error('Receipt scanning is not available - DEEPSEEK_API_KEY not configured');
    }

    this.logAction('Scan receipt', { mimeType, bufferSize: imageBuffer.length });

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      this.logger.info('Calling Deepseek Vision API...');

      // Call Deepseek Vision API
      const response = await this.openai.chat.completions.create({
        model: "deepseek-chat",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: this.getReceiptExtractionPrompt()
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        temperature: 0.1
      });

      // Parse the response
      const content = response.choices[0].message.content;
      this.logger.debug('Deepseek Vision response received');

      // Extract JSON from response
      const receiptData = this.parseReceiptResponse(content);

      // Validate extracted data
      this.validateReceiptData(receiptData);

      // Add AI categorization
      const category = await this.categorizeExpense(receiptData);
      receiptData.aiCategory = category.category;
      receiptData.aiConfidence = category.confidence;

      this.logger.info('Receipt scan successful', {
        merchant: receiptData.merchant,
        amount: receiptData.amount,
        category: receiptData.aiCategory
      });

      return receiptData;

    } catch (error) {
      this.handleError(error, 'scanReceipt');
    }
  }

  /**
   * Categorize an expense using AI
   */
  async categorizeExpense(expenseData) {
    this.logAction('Categorize expense', { merchant: expenseData.merchant });

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
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150
      });

      const content = response.choices[0].message.content;
      const result = this.parseJSON(content);

      // Validate category
      if (!EXPENSE_CATEGORIES.includes(result.category)) {
        this.logger.warn(`Invalid category "${result.category}", defaulting to "other"`);
        result.category = 'other';
        result.confidence = 0.5;
      }

      return {
        category: result.category,
        confidence: Math.min(Math.max(result.confidence || 0.7, 0), 1),
        reasoning: result.reasoning
      };

    } catch (error) {
      this.logger.error('Categorization failed', { error: error.message });
      return {
        category: 'other',
        confidence: 0.5,
        reasoning: 'Auto-categorization failed'
      };
    }
  }

  /**
   * Generate prompt for receipt extraction
   */
  getReceiptExtractionPrompt() {
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
   */
  parseJSON(content) {
    try {
      let cleaned = content.trim();

      // Remove markdown code blocks if present
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
      }

      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.error('Failed to parse JSON', { content });
      throw new Error('Invalid JSON response from AI');
    }
  }

  /**
   * Parse receipt extraction response
   */
  parseReceiptResponse(content) {
    const data = this.parseJSON(content);

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
      rawData: data
    };
  }

  /**
   * Validate extracted receipt data
   */
  validateReceiptData(data) {
    if (!data.amount || data.amount <= 0) {
      throw new Error('Invalid amount extracted from receipt');
    }

    if (!data.currency || data.currency.length !== 3) {
      this.logger.warn('Invalid currency, defaulting to EUR');
      data.currency = 'EUR';
    }

    // Validate date format
    if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      this.logger.warn('Invalid date format, using current date');
      data.date = new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Suggest expense split based on receipt items
   */
  suggestSplit(items, participantIds) {
    this.logAction('Suggest split', { items: items?.length, participants: participantIds?.length });

    if (!items || items.length === 0) {
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
   */
  isFormatSupported(mimeType) {
    return this.getSupportedFormats().includes(mimeType);
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      serviceName: 'ReceiptScannerService',
      status: this.apiKey ? 'ready' : 'not_configured',
      apiKeyConfigured: !!this.apiKey,
      supportedFormats: this.getSupportedFormats(),
      model: 'deepseek-chat',
      baseURL: this.baseURL
    };
  }
}

module.exports = ReceiptScannerService;

