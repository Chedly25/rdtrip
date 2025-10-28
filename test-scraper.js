#!/usr/bin/env node
/**
 * Test web scraping functions on real websites
 * Usage: node test-scraper.js
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Copy scraping utilities from server.js
const domainLastRequest = new Map();

async function rateLimitedFetch(url, timeout = 5000) {
  try {
    const domain = new URL(url).hostname;
    const lastRequest = domainLastRequest.get(domain) || 0;
    const now = Date.now();

    if (now - lastRequest < 2000) {
      await new Promise(resolve => setTimeout(resolve, 2000 - (now - lastRequest)));
    }

    domainLastRequest.set(domain, Date.now());

    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RDTrip/1.0; +https://rdtrip.com)'
      }
    });

    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error.message);
    return null;
  }
}

function resolveImageUrl(imageUrl, baseUrl) {
  if (!imageUrl) return null;

  try {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }

    const base = new URL(baseUrl);
    const resolved = new URL(imageUrl, base.origin);
    return resolved.href;
  } catch (error) {
    console.error(`URL resolution error:`, error.message);
    return null;
  }
}

function isValidImageUrl(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const ext = parsed.pathname.toLowerCase();
    return ext.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
           url.includes('unsplash.com') ||
           url.includes('images') ||
           url.includes('photo');
  } catch {
    return false;
  }
}

async function scrapeOpenGraphImage(url) {
  try {
    const response = await rateLimitedFetch(url);
    if (!response) return null;

    const $ = cheerio.load(response.data);

    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[property="og:image:secure_url"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[name="twitter:image:src"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content');

    if (ogImage) {
      const resolved = resolveImageUrl(ogImage, url);
      if (isValidImageUrl(resolved)) {
        return resolved;
      }
    }

    return null;
  } catch (error) {
    console.error(`Open Graph scrape error:`, error.message);
    return null;
  }
}

async function scrapeWithFallback(url, entityName, city) {
  console.log(`\n🔍 Testing: ${entityName} in ${city}`);
  console.log(`   URL: ${url}`);

  const ogImage = await scrapeOpenGraphImage(url);
  if (ogImage) {
    console.log(`✅ SUCCESS - Open Graph image: ${ogImage.substring(0, 80)}...`);
    return { imageUrl: ogImage, source: 'opengraph' };
  }

  console.log(`❌ FAILED - No image found`);
  return { imageUrl: null, source: 'failed' };
}

// Test cases
async function runTests() {
  console.log('='.repeat(80));
  console.log('WEB SCRAPING TEST SUITE');
  console.log('='.repeat(80));

  const tests = [
    {
      name: 'The Louvre Museum',
      city: 'Paris',
      url: 'https://www.louvre.fr/en'
    },
    {
      name: 'Eiffel Tower',
      city: 'Paris',
      url: 'https://www.toureiffel.paris/en'
    },
    {
      name: 'GitHub',
      city: 'Test',
      url: 'https://github.com'
    }
  ];

  for (const test of tests) {
    await scrapeWithFallback(test.url, test.name, test.city);
  }

  console.log('\n' + '='.repeat(80));
  console.log('TEST SUITE COMPLETE');
  console.log('='.repeat(80));
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
