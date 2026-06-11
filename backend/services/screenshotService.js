/**
 * Screenshot service — captures real screenshots of public web pages using the
 * locally-installed Chrome/Edge (via puppeteer-core, no bundled Chromium).
 *
 * Used at lecture-authoring time to grab real "how-to" screenshots (e.g. the
 * python.org download page) which the AI tutor then walks through on the board.
 *
 * Design goals: never throw (a failed screenshot must not break generation),
 * reuse one browser instance, and cache by content hash so the same URL is
 * captured only once.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');

const IMAGE_DIR = path.join(__dirname, '..', 'uploads', 'ai-images');

const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

function findBrowser() {
  for (const p of BROWSER_CANDIDATES) {
    try { if (p && fs.existsSync(p)) return p; } catch (_) { /* ignore */ }
  }
  return null;
}

let browserPromise = null;
async function getBrowser() {
  const exe = findBrowser();
  if (!exe) throw new Error('No Chrome/Edge found for screenshots. Set CHROME_PATH in backend/.env');
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        executablePath: exe,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--disable-gpu', '--mute-audio'],
      })
      .catch((e) => { browserPromise = null; throw e; });
  }
  return browserPromise;
}

async function closeBrowser() {
  if (!browserPromise) return;
  try { const b = await browserPromise; await b.close(); } catch (_) { /* ignore */ }
  browserPromise = null;
}

/**
 * Capture a screenshot of a public URL.
 * @param {string} url
 * @param {object} opts { width, height, fullPage, selector, cacheKey }
 * @returns {Promise<{urlPath:string, storagePath:string, width:number, height:number}|null>}
 *          null on any failure (never throws).
 */
// Only allow public http(s) URLs — block localhost / private ranges (SSRF guard),
// since URLs may come from an AI model.
function isPublicHttpUrl(u) {
  try {
    const url = new URL(`${u || ''}`);
    if (!/^https?:$/.test(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '::1' || host.endsWith('.local')) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch (_) {
    return false;
  }
}

async function captureUrlScreenshot(url, opts = {}) {
  const { width = 1280, height = 800, fullPage = false, selector = null, cacheKey = null } = opts;
  if (!isPublicHttpUrl(url)) return null;

  const key = cacheKey
    || crypto.createHash('sha1').update(`${url}|${width}x${height}|${fullPage ? 'full' : 'fit'}|${selector || ''}`).digest('hex');
  const filename = `shot-${key}.png`;
  const storagePath = path.join(IMAGE_DIR, filename);
  const urlPath = `/uploads/ai-images/${filename}`;

  try {
    if (fs.existsSync(storagePath)) return { urlPath, storagePath, width, height };
    fs.mkdirSync(IMAGE_DIR, { recursive: true });

    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      );
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      // Give late-loading hero images/fonts a moment.
      await new Promise((r) => setTimeout(r, 800));

      let clip;
      if (selector) {
        try {
          const el = await page.$(selector);
          if (el) {
            const box = await el.boundingBox();
            if (box) {
              clip = {
                x: Math.max(0, box.x - 14),
                y: Math.max(0, box.y - 14),
                width: Math.min(width, box.width + 28),
                height: Math.min(height * 3, box.height + 28),
              };
            }
          }
        } catch (_) { /* selector optional */ }
      }

      await page.screenshot({ path: storagePath, fullPage: fullPage && !clip, clip: clip || undefined });
      return { urlPath, storagePath, width, height };
    } finally {
      await page.close().catch(() => {});
    }
  } catch (e) {
    console.warn(`📸 Screenshot failed for ${url}: ${e.message}`);
    return null;
  }
}

module.exports = { captureUrlScreenshot, closeBrowser, findBrowser, isPublicHttpUrl };
