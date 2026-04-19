/**
 * GrainLab screenshot capture script
 * Run with: node scripts/capture-screenshots.mjs
 * Requires: npx playwright (auto-downloaded on first run via @playwright/test)
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'docs', 'images');
mkdirSync(OUT_DIR, { recursive: true });

// Try live site first; fallback to local dev server
const BASE_URL = process.env.SCREENSHOT_URL || 'https://seamys.github.io/grainlab';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Navigating to app…');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(2000); // wait for example image to load & render

  // ── 1. Main UI overview ──────────────────────────────────────────────────
  console.log('1/6 main.png');
  await page.screenshot({ path: join(OUT_DIR, 'main.png'), fullPage: false });

  // ── 2. Presets panel ─────────────────────────────────────────────────────
  console.log('2/6 presets.png');
  // Try to open presets panel if it has a button/tab
  const presetsTab = page.locator('button, [role="tab"]').filter({ hasText: /preset|胶片/i }).first();
  if (await presetsTab.count() > 0) {
    await presetsTab.click();
    await sleep(600);
  }
  await page.screenshot({ path: join(OUT_DIR, 'presets.png'), fullPage: false });

  // ── 3. Effects / Control panel (Simple mode) ─────────────────────────────
  console.log('3/6 effects.png');
  // Make sure Simple mode is active first
  const simpleTab = page.locator('button').filter({ hasText: /^simple$/i }).first();
  if (await simpleTab.count() > 0) {
    await simpleTab.click();
    await sleep(400);
  }
  await page.screenshot({ path: join(OUT_DIR, 'effects.png'), fullPage: false });

  // ── 3b. Advanced mode (color wheels + extra params) ───────────────────────
  console.log('3b/6 advanced.png');
  const advancedTab = page.locator('button').filter({ hasText: /^advanced$/i }).first();
  if (await advancedTab.count() > 0) {
    await advancedTab.click();
    await sleep(800);
  }
  await page.screenshot({ path: join(OUT_DIR, 'advanced.png'), fullPage: false });

  // ── 4. Before / After comparison ─────────────────────────────────────────
  console.log('4/6 before-after.png');
  const compareBtn = page.locator('button').filter({ hasText: /compare|before|after|对比/i }).first();
  if (await compareBtn.count() > 0) {
    await compareBtn.click();
    await sleep(1500); // wait for BeforeAfter component to render
  }
  await page.screenshot({ path: join(OUT_DIR, 'before-after.png'), fullPage: false });
  // close compare mode
  if (await compareBtn.count() > 0) await compareBtn.click();
  await sleep(400);

  // ── 5. Export dialog ─────────────────────────────────────────────────────
  console.log('5/6 export.png');
  const exportBtn = page.locator('button').filter({ hasText: /export|导出/i }).first();
  if (await exportBtn.count() > 0) {
    await exportBtn.click();
    await sleep(600);
    await page.screenshot({ path: join(OUT_DIR, 'export.png'), fullPage: false });
    // close dialog (Escape)
    await page.keyboard.press('Escape');
    await sleep(300);
  } else {
    await page.screenshot({ path: join(OUT_DIR, 'export.png'), fullPage: false });
  }

  // ── 6. Batch panel ───────────────────────────────────────────────────────
  console.log('6/6 batch.png');
  // Close any open modal/overlay first
  const overlay = page.locator('.modal-overlay');
  if (await overlay.count() > 0) {
    await page.keyboard.press('Escape');
    await sleep(400);
  }
  const batchBtn = page.locator('button').filter({ hasText: /batch|批量/i }).first();
  if (await batchBtn.count() > 0) {
    await batchBtn.click({ force: true });
    await sleep(600);
  }
  await page.screenshot({ path: join(OUT_DIR, 'batch.png'), fullPage: false });

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${OUT_DIR}`);
})();
