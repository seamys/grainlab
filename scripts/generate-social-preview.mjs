/**
 * Generate a 1280×640 social preview image for GitHub
 * Uses Playwright to render an HTML template and screenshot it
 */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Load screenshots as base64
const mainImg = readFileSync(path.join(projectRoot, 'docs/images/before-after.png')).toString('base64');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

  body {
    width: 1280px;
    height: 640px;
    overflow: hidden;
    background: #0d0d0d;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    align-items: stretch;
  }

  /* ── Film grain overlay ─────────────────── */
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    opacity: 0.35;
    pointer-events: none;
    z-index: 10;
  }

  /* ── Left: screenshot panel ─────────────── */
  .screenshot-panel {
    position: relative;
    width: 720px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .screenshot-panel img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
  }

  /* Dark gradient fade on the right edge */
  .screenshot-panel::after {
    content: '';
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 180px;
    background: linear-gradient(to right, transparent, #0d0d0d);
  }

  /* Film strip perforations top & bottom */
  .perfs {
    position: absolute;
    left: 0; right: 0;
    height: 28px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 16px;
    background: rgba(0,0,0,0.7);
    z-index: 5;
  }
  .perfs.top { top: 0; }
  .perfs.bottom { bottom: 0; }
  .perf {
    width: 18px;
    height: 14px;
    border-radius: 3px;
    border: 2px solid rgba(255,255,255,0.25);
    flex-shrink: 0;
  }

  /* ── Right: branding panel ──────────────── */
  .brand-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 52px 48px 32px;
    gap: 0;
    position: relative;
  }

  /* Subtle warm radial glow */
  .brand-panel::before {
    content: '';
    position: absolute;
    top: -100px; right: -100px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(220,150,60,0.12) 0%, transparent 65%);
    pointer-events: none;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #c8922a;
    margin-bottom: 14px;
  }

  .logo {
    font-size: 68px;
    font-weight: 900;
    letter-spacing: -2px;
    line-height: 1;
    color: #f5f0e8;
    margin-bottom: 16px;
  }
  .logo span {
    color: #c8922a;
  }

  .tagline {
    font-size: 17px;
    font-weight: 400;
    color: #a09880;
    line-height: 1.5;
    margin-bottom: 32px;
    max-width: 380px;
  }

  /* Divider */
  .divider {
    width: 40px;
    height: 2px;
    background: #c8922a;
    margin-bottom: 28px;
    border-radius: 1px;
  }

  /* Feature badges */
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 36px;
  }
  .badge {
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 100px;
    background: rgba(200,146,42,0.12);
    border: 1px solid rgba(200,146,42,0.3);
    color: #d4a855;
    letter-spacing: 0.3px;
  }

  /* URL pill */
  .url-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }
  .url-pill {
    font-size: 13px;
    font-weight: 500;
    color: #786858;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 7px 14px;
    letter-spacing: 0.2px;
  }
  .star-hint {
    font-size: 12px;
    color: #4a4035;
  }

  /* GitHub icon in corner */
  .gh-icon {
    position: absolute;
    top: 28px;
    right: 28px;
    opacity: 0.2;
  }
</style>
</head>
<body>

  <!-- Left: screenshot -->
  <div class="screenshot-panel">
    <div class="perfs top">
      ${Array(20).fill('<div class="perf"></div>').join('')}
    </div>
    <img src="data:image/png;base64,${mainImg}" alt="GrainLab screenshot">
    <div class="perfs bottom">
      ${Array(20).fill('<div class="perf"></div>').join('')}
    </div>
  </div>

  <!-- Right: brand -->
  <div class="brand-panel">

    <svg class="gh-icon" width="48" height="48" viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>

    <p class="eyebrow">Open Source · MIT · Free Forever</p>
    <h1 class="logo">Grain<span>Lab</span></h1>
    <p class="tagline">Film Photography Effect Simulator — give your digital photos the authentic look of classic analog film, right in the browser.</p>

    <div class="divider"></div>

    <div class="badges">
      <span class="badge">🎞 11 Film Presets</span>
      <span class="badge">🎛 8 Effects</span>
      <span class="badge">📦 Batch Export</span>
      <span class="badge">🌍 9 Languages</span>
      <span class="badge">⚡ No Install</span>
    </div>

    <div class="url-row">
      <span class="url-pill">seamys.github.io/grainlab</span>
    </div>

  </div>

</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 640 });
await page.setContent(html, { waitUntil: 'networkidle' });
// Wait for any fonts to load
await page.waitForTimeout(500);

const outputPath = path.join(projectRoot, 'docs/images/social-preview.png');
await page.screenshot({ path: outputPath, type: 'png' });
await browser.close();

console.log(`✓ Social preview saved to ${outputPath}`);
