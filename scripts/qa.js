import puppeteer from 'puppeteer';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const DIST = path.join(ROOT, 'dist');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ not found. Run npm run build first.');
    process.exit(1);
  }

  // Start static server
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: ROOT,
    stdio: 'pipe',
  });

  await wait(3000);

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];

    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for preloader and click enter
    await page.waitForSelector('[data-testid="enter-core"]', { timeout: 120000 });
    await page.click('[data-testid="enter-core"]');
    await wait(1000);

    // Scroll through phases
    const height = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    for (let i = 0; i <= 10; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.floor((height * i) / 10));
      await wait(300);
    }

    // Check core site visible
    const coreVisible = await page.evaluate(() => {
      const sections = document.querySelectorAll('.core-section');
      return sections.length > 0;
    });

    if (!coreVisible) {
      errors.push('No core sections found after scroll');
    }

    if (errors.length > 0) {
      console.error('QA errors:', errors);
      process.exitCode = 1;
    } else {
      console.log('QA passed: preloader, scroll, core site OK');
    }
  } catch (e) {
    console.error('QA failed:', e.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
}

main();
