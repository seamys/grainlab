/**
 * GrainLab demo video recorder
 * Produces: docs/videos/demo.webm  (Product Hunt accepts WebM/MP4)
 * Run: node scripts/record-demo.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, renameSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const OUT_DIR = join(projectRoot, 'docs', 'videos');
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'https://seamys.github.io/grainlab';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

console.log('🎬 Starting demo recording…');

const browser = await chromium.launch({ headless: true });

// Playwright records into a temp folder per context; we pick it up afterwards
const tmpDir = join(OUT_DIR, '_tmp');
mkdirSync(tmpDir, { recursive: true });

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: tmpDir,
    size: { width: 1280, height: 720 },
  },
});

const page = await context.newPage();

// ── Scene 1: Load the app (0-4s) ──────────────────────────────────────────
console.log('Scene 1: Loading app…');
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await sleep(3000);  // let example image render

// ── Scene 2: Open Presets panel & hover presets (4-12s) ───────────────────
console.log('Scene 2: Presets panel…');
const presetsTab = page.locator('button, [role="tab"]').filter({ hasText: /preset/i }).first();
if (await presetsTab.count() > 0) {
  await presetsTab.click();
  await sleep(800);
}

// Click through a few presets with a pause each time
const presetNames = ['Kodak Portra', 'Fuji Velvia', 'CineStill', 'Kodak Tri-X', 'Ilford'];
for (const name of presetNames) {
  const btn = page.locator('button').filter({ hasText: new RegExp(name, 'i') }).first();
  if (await btn.count() > 0) {
    await btn.click();
    await sleep(1200);
  }
}

// ── Scene 3: Fine-tune an effect slider (12-18s) ──────────────────────────
console.log('Scene 3: Adjusting effects…');
// Go back to Kodak Portra for a nice warm look
const portra = page.locator('button').filter({ hasText: /portra/i }).first();
if (await portra.count() > 0) {
  await portra.click();
  await sleep(800);
}

// Open the effects/controls panel
const effectsTab = page.locator('button, [role="tab"]').filter({ hasText: /effect|control|adjust/i }).first();
if (await effectsTab.count() > 0) {
  await effectsTab.click();
  await sleep(600);
}

// Drag a grain slider left then right to show interactivity
const grainSlider = page.locator('input[type=range]').first();
if (await grainSlider.count() > 0) {
  const box = await grainSlider.boundingBox();
  if (box) {
    // Drag from center to right
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, { steps: 20 });
    await sleep(600);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 20 });
    await page.mouse.up();
    await sleep(600);
  }
}

// ── Scene 4: Before / After comparison (18-25s) ────────────────────────────
console.log('Scene 4: Before/After…');
const compareBtn = page.locator('button').filter({ hasText: /compare|before|after/i }).first();
if (await compareBtn.count() > 0) {
  await compareBtn.click();
  await sleep(1000);

  // Drag the split handle left and right
  const divider = page.locator('.before-after-divider, [data-testid="divider"], .slider-handle').first();
  if (await divider.count() > 0) {
    const box = await divider.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 30 });
      await sleep(500);
      await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 30 });
      await sleep(500);
      await page.mouse.move(box.x, box.y + box.height / 2, { steps: 20 });
      await page.mouse.up();
      await sleep(800);
    }
  } else {
    // Drag in center of viewport as fallback
    const vp = page.viewportSize();
    await page.mouse.move(vp.width / 2, vp.height / 2);
    await page.mouse.down();
    await page.mouse.move(vp.width * 0.25, vp.height / 2, { steps: 30 });
    await sleep(500);
    await page.mouse.move(vp.width * 0.75, vp.height / 2, { steps: 30 });
    await sleep(500);
    await page.mouse.move(vp.width / 2, vp.height / 2, { steps: 20 });
    await page.mouse.up();
    await sleep(800);
  }

  // Close compare mode
  await compareBtn.click();
  await sleep(600);
}

// ── Scene 5: Outro — hold on the finished photo (25-28s) ───────────────────
console.log('Scene 5: Outro…');
await sleep(3000);

// ── Finish recording ───────────────────────────────────────────────────────
await context.close();  // this finalises the video file
await browser.close();

// Move the recorded file to a predictable name
const files = readdirSync(tmpDir).filter(f => f.endsWith('.webm'));
if (files.length === 0) {
  console.error('❌ No video file was recorded.');
  process.exit(1);
}
const src = join(tmpDir, files[0]);
const dest = join(OUT_DIR, 'demo.webm');
renameSync(src, dest);

// Clean up temp dir
import { rmdirSync } from 'fs';
try { rmdirSync(tmpDir); } catch {}

console.log(`✅ Demo video saved to ${dest}`);
console.log(`   Upload to Product Hunt / convert to MP4 with:`);
console.log(`   ffmpeg -i docs/videos/demo.webm -c:v libx264 docs/videos/demo.mp4`);
