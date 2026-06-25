/**
<<<<<<< HEAD
 * Screenshot service — captures real screenshots of public web pages.
 *
 * Priority:
 *   1. Local Chrome/Edge found on disk → puppeteer-core (no download)
 *   2. No local browser → full `puppeteer` package with bundled Chromium
 *   3. Puppeteer unavailable or launch fails → @sparticuz/chromium (pre-built,
 *      no system library dependencies, works on cPanel shared hosting)
 *      Run: npm install @sparticuz/chromium puppeteer-core --legacy-peer-deps
=======
 * Screenshot service — captures real screenshots of public web pages using the
 * locally-installed Chrome/Edge (via puppeteer-core, no bundled Chromium).
 *
 * Used at lecture-authoring time to grab real "how-to" screenshots (e.g. the
 * python.org download page) which the AI tutor then walks through on the board.
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
 *
 * Design goals: never throw (a failed screenshot must not break generation),
 * reuse one browser instance, and cache by content hash so the same URL is
 * captured only once.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
<<<<<<< HEAD

const IMAGE_DIR = path.join(__dirname, '..', 'uploads', 'ai-images');

// Lazy-load whichever puppeteer variant is available.
// puppeteer-core: uses a local Chrome/Edge (no bundled browser).
// puppeteer:      bundles its own Chromium (~170 MB, works without system Chrome).
let _puppeteer = null;
let _usingBundled = false;
function getPuppeteer() {
  if (_puppeteer) return { lib: _puppeteer, bundled: _usingBundled };
  try {
    _puppeteer = require('puppeteer-core');
    _usingBundled = false;
  } catch (_) {
    try {
      _puppeteer = require('puppeteer');
      _usingBundled = true;
    } catch (__) {
      throw new Error('Neither puppeteer-core nor puppeteer is installed. Run: npm install puppeteer');
    }
  }
  return { lib: _puppeteer, bundled: _usingBundled };
}

=======
const puppeteer = require('puppeteer-core');

const IMAGE_DIR = path.join(__dirname, '..', 'uploads', 'ai-images');

>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
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
<<<<<<< HEAD
  if (!browserPromise) {
    let { lib, bundled } = getPuppeteer();
    let exe = !bundled ? findBrowser() : null;
    let extraArgs = [];

    // puppeteer-core loaded but no system browser — try @sparticuz/chromium first,
    // then fall back to full puppeteer bundled Chromium.
    if (!bundled && !exe) {
      try {
        const sparticuz = require('@sparticuz/chromium');
        // Override TMPDIR so chromium extracts to project dir, not /tmp (noexec on cPanel)
        const chromiumDir = path.join(__dirname, '..', '.chromium-bin');
        fs.mkdirSync(chromiumDir, { recursive: true });
        const prevTmp = process.env.TMPDIR;
        process.env.TMPDIR = chromiumDir;
        exe = await sparticuz.executablePath();
        process.env.TMPDIR = prevTmp !== undefined ? prevTmp : '';
        try { fs.chmodSync(exe, 0o755); } catch (_) {}
        extraArgs = sparticuz.args;
        bundled = false;
        console.log(`📸 Using @sparticuz/chromium: ${exe}`);
      } catch (_) {
        try {
          lib = require('puppeteer');
          bundled = true;
          exe = null;
        } catch (__) {
          throw new Error('No Chrome/Edge found. Run: npm install @sparticuz/chromium puppeteer-core');
        }
      }
    }

    const launchOpts = {
      headless: true,
      args: [...new Set([...extraArgs, '--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--disable-gpu', '--mute-audio', '--disable-dev-shm-usage'])],
    };
    if (exe) launchOpts.executablePath = exe;
    browserPromise = lib.launch(launchOpts).catch((e) => { browserPromise = null; throw e; });
=======
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
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
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
<<<<<<< HEAD
  if (!isPublicHttpUrl(url)) {
    console.warn(`📸 Screenshot blocked (not a public URL): ${url}`);
    return null;
  }
  console.log(`📸 Taking screenshot: ${url}`);
=======
  if (!isPublicHttpUrl(url)) return null;
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821

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
<<<<<<< HEAD
=======
      // Give late-loading hero images/fonts a moment.
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
      await new Promise((r) => setTimeout(r, 800));

      let clip;
      if (selector) {
        try {
          const el = await page.$(selector);
          if (el) {
            const box = await el.boundingBox();
<<<<<<< HEAD
            if (box) clip = { x: Math.max(0, box.x - 14), y: Math.max(0, box.y - 14), width: Math.min(width, box.width + 28), height: Math.min(height * 3, box.height + 28) };
=======
            if (box) {
              clip = {
                x: Math.max(0, box.x - 14),
                y: Math.max(0, box.y - 14),
                width: Math.min(width, box.width + 28),
                height: Math.min(height * 3, box.height + 28),
              };
            }
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
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

<<<<<<< HEAD
/** Returns true if screenshots can be taken (local browser, bundled puppeteer, or @sparticuz/chromium). */
function isAvailable() {
  if (findBrowser()) return true;
  try { require.resolve('@sparticuz/chromium'); return true; } catch (_) {}
  try { require.resolve('puppeteer'); return true; } catch (_) { return false; }
}

module.exports = { captureUrlScreenshot, closeBrowser, findBrowser, isPublicHttpUrl, isAvailable };
=======
module.exports = { captureUrlScreenshot, closeBrowser, findBrowser, isPublicHttpUrl };
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
