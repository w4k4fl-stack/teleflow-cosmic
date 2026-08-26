import puppeteer from 'puppeteer-core';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });

const errors = [];
page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(`CONSOLE ERROR: ${msg.text()}`);
  }
});

await page.goto('https://w4k4fl-stack.github.io/teleflow-cosmic/', {
  waitUntil: 'networkidle2',
  timeout: 120000,
});

await sleep(3000);

// Click enter button if exists
const enterBtn = await page.$('[data-testid="enter-core"]');
if (enterBtn) {
  await enterBtn.click();
  await sleep(2000);
}

// Scroll down
await page.evaluate(() => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, max * 0.5);
});
await sleep(1000);

await page.screenshot({ path: '/tmp/teleflow-cosmic.png', fullPage: false });

console.log('Errors:', errors.length ? errors.join('\n') : 'none');
console.log('Screenshot saved to /tmp/teleflow-cosmic.png');

await browser.close();
