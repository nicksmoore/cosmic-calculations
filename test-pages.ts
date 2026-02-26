import { chromium } from 'playwright';

async function checkPages() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const pagesToCheck = [
    'http://localhost:8080/feed',
    'http://localhost:8080/profile', 
    'http://localhost:8080/friends',
    'http://localhost:8080/bazaar',
    'http://localhost:8080/transit',
  ];

  for (const url of pagesToCheck) {
    console.log(`\n🔍 Testing: ${url}`);
    console.log('─'.repeat(60));
    
    try {
      // Navigate
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // Wait a bit for any async rendering
      await page.waitForTimeout(2000);
      
      // Check what's visible
      const bodyContent = await page.evaluate(() => {
        const body = document.body;
        return {
          html: body.innerHTML.slice(0, 500),
          textContent: body.innerText.slice(0, 200),
          childCount: body.children.length,
          hasErrors: (window as any).__REACT_ERROR__ ? true : false,
        };
      });

      console.log(`✓ Page loaded`);
      console.log(`  Body has ${bodyContent.childCount} children`);
      console.log(`  Text preview: ${bodyContent.textContent.replace(/\n/g, ' ').slice(0, 100)}...`);
      
      if (bodyContent.hasErrors) {
        console.log(`  ⚠️ React error detected`);
      }

      // Check for specific content
      const hasMainContent = await page.evaluate(() => {
        return {
          hasMain: !!document.querySelector('main'),
          hasDiv: !!document.querySelector('div.relative'),
          starFieldVisible: document.body.innerText.includes('Star'),
          hasButtons: !!document.querySelectorAll('button').length,
        };
      });

      console.log(`  Main element: ${hasMainContent.hasMain ? '✓' : '✗'}`);
      console.log(`  Relative div: ${hasMainContent.hasDiv ? '✓' : '✗'}`);
      console.log(`  Buttons found: ${hasMainContent.hasButtons}`);
      
    } catch (error) {
      console.log(`✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await browser.close();
  console.log('\n✓ Testing complete');
}

checkPages().catch(console.error);
