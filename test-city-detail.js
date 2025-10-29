const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    // Only log relevant city detail logs
    if (text.includes('[useAsyncCityDetails]') || 
        text.includes('[CityDetailModal]') || 
        text.includes('Image for') ||
        text.includes('Wikipedia') ||
        text.includes('placeholder')) {
      console.log('Browser:', text);
    }
  });
  
  console.log('📍 Navigating to landing page...');
  await page.goto('https://rdtrip-4d4035861576.herokuapp.com/');
  
  console.log('⏳ Waiting for page to load...');
  await page.waitForTimeout(2000);
  
  console.log('🔍 Looking for route generation form...');
  
  // Fill in the route form
  await page.fill('input[placeholder*="origin" i], input[placeholder*="start" i]', 'Barcelona');
  await page.waitForTimeout(500);
  
  await page.fill('input[placeholder*="destination" i], input[placeholder*="end" i]', 'Nice');
  await page.waitForTimeout(500);
  
  console.log('🚀 Generating route...');
  await page.click('button:has-text("Generate"), button:has-text("Create")');
  
  console.log('⏳ Waiting for results (max 60s)...');
  await page.waitForSelector('.city-card, [class*="city"], [class*="CityCard"]', { timeout: 60000 });
  
  console.log('✅ Results loaded! Looking for a city to click...');
  await page.waitForTimeout(2000);
  
  // Find and click on a city card (looking for an uncached city)
  const cityCards = await page.locator('.city-card, [class*="CityCard"]').all();
  console.log(`📊 Found ${cityCards.length} city cards`);
  
  if (cityCards.length > 0) {
    // Click the third city (more likely to be uncached)
    const cityToTest = Math.min(2, cityCards.length - 1);
    console.log(`🎯 Clicking on city card #${cityToTest + 1}...`);
    await cityCards[cityToTest].click();
    
    console.log('⏳ Waiting for city detail modal...');
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: '/tmp/city-detail-test.png', fullPage: true });
    
    console.log('⏳ Waiting 30 seconds to observe the loading process...');
    await page.waitForTimeout(30000);
    
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ path: '/tmp/city-detail-final.png', fullPage: true });
    
    console.log('✅ Test complete!');
  } else {
    console.log('❌ No city cards found');
  }
  
  await browser.close();
})();
