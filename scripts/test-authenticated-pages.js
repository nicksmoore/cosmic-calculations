const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

async function testAuthenticatedPages() {
  console.log('🔐 Authenticated Playwright Test Suite');
  console.log('═'.repeat(70));
  
  const authFile = path.join(__dirname, '../.auth/storage.json');
  
  if (!fs.existsSync(authFile)) {
    console.log('\n⚠️  Auth storage not found. You must provide:');
    console.log('   1. Email address');
    console.log('   2. Password');
    console.log('\nThen this script will:');
    console.log('   • Log in to the app');
    console.log('   • Save the session to .auth/storage.json');
    console.log('   • Use that session for all subsequent page tests');
    console.log('\nUsage: EMAIL=user@example.com PASSWORD=pass node scripts/test-authenticated-pages.js');
    
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    
    if (!email || !password) {
      console.log('\n❌ Skipping auth test - credentials not provided in env vars.');
      process.exit(0);
    }
    
    // Log in and save auth
    console.log('\n🔑 Logging in...');
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    try {
      await page.goto('https://aoe-claude-code.vercel.app/sign-in', { waitUntil: 'domcontentloaded' });
      
      // Fill in credentials
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      
      // Wait for redirect to feed or onboarding
      await page.waitForNavigation({ waitUntil: 'networkidle' });
      
      // Save auth
      fs.mkdirSync(path.join(__dirname, '../.auth'), { recursive: true });
      await context.storageState({ path: authFile });
      
      console.log('✅ Authentication saved to .auth/storage.json');
      await browser.close();
    } catch (e) {
      console.log('❌ Login failed:', e.message);
      await browser.close();
      process.exit(1);
    }
  }
  
  // Now test with auth
  console.log('\n✅ Using saved authentication...');
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.createBrowserContext({
    storageState: authFile,
  });
  const page = await context.newPage();
  
  const pagesToTest = [
    { url: 'https://aoe-claude-code.vercel.app/feed', name: 'Feed' },
    { url: 'https://aoe-claude-code.vercel.app/profile', name: 'Profile' },
    { url: 'https://aoe-claude-code.vercel.app/friends', name: 'Friends' },
    { url: 'https://aoe-claude-code.vercel.app/bazaar', name: 'Bazaar' },
    { url: 'https://aoe-claude-code.vercel.app/transit', name: 'Transit' },
  ];
  
  for (const pageInfo of pagesToTest) {
    console.log(`\n📄 Testing: ${pageInfo.name}`);
    console.log('─'.repeat(70));
    
    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const content = await page.evaluate(() => ({
        title: document.title,
        hasSignIn: document.body.innerText.includes('Sign in'),
        hasMainContent: !!document.querySelector('main'),
        mainTextLength: document.querySelector('main')?.innerText?.length || 0,
        totalElements: document.querySelectorAll('*').length,
        hasStars: document.body.innerHTML.includes('star') || 
                  document.body.innerHTML.includes('Star') ||
                  !!document.querySelector('canvas'),
        textPreview: document.body.innerText.slice(0, 150).replace(/\n/g, ' '),
      }));
      
      const status = content.hasMainContent && content.mainTextLength > 100 ? '✅' : '⚠️';
      console.log(`${status} Main content: ${content.mainTextLength} chars`);
      console.log(`   Sign In visible: ${content.hasSignIn ? 'NO ✓' : 'YES (unexpected)'}`);
      console.log(`   Total elements: ${content.totalElements}`);
      console.log(`   Stars visible: ${content.hasStars ? 'YES ✓' : 'NO'}`);
      console.log(`   Preview: "${content.textPreview}..."`);
      
      if (!content.hasMainContent) {
        console.log('   ⚠️  ISSUE: No main content found!');
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
  
  await browser.close();
  console.log('\n✅ Testing complete!');
}

testAuthenticatedPages().catch(console.error);
