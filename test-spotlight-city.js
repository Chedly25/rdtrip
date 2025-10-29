const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    // Log all console messages for debugging
    console.log('Browser:', text);
  });
  
  console.log('📍 Navigating directly to spotlight page...');
  await page.goto('https://rdtrip-4d4035861576.herokuapp.com/spotlight.html');
  
  console.log('⏳ Waiting for page to load...');
  await page.waitForTimeout(3000);
  
  console.log('🔍 Looking for city cards...');
  
  // Wait for city cards to appear
  await page.waitForSelector('.city-card', { timeout: 10000 });
  
  const cityCards = await page.locator('.city-card').all();
  console.log(`📊 Found ${cityCards.length} city cards`);
  
  if (cityCards.length > 0) {
    // Click on a less common city (more likely uncached)
    // Try to find Allauch, Cassis, or any other smaller city
    const cityIndex = Math.min(5, cityCards.length - 1);
    console.log(`🎯 Clicking on city card #${cityIndex + 1}...`);
    await cityCards[cityIndex].click();
    
    console.log('⏳ Waiting for city detail modal to open...');
    await page.waitForTimeout(5000);
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: '/tmp/city-detail-initial.png', fullPage: true });
    
    console.log('⏳ Waiting 40 seconds to observe full loading process (Phase 1 + Phase 2)...');
    await page.waitForTimeout(40000);
    
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ path: '/tmp/city-detail-complete.png', fullPage: true });
    
    console.log('✅ Test complete! Check screenshots at:');
    console.log('   - /tmp/city-detail-initial.png');
    console.log('   - /tmp/city-detail-complete.png');
  } else {
    console.log('❌ No city cards found');
  }
  
  await browser.close();
})();
