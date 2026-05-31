const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const MAX_TEXT_LENGTH = 12000;
const MAX_REDIRECTS = 5;

function fetchBuffer(url, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      // Follow redirects (301, 302, 307, 308)
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        const location = res.headers['location'];
        if (!location) return reject(new Error('Redirect with no Location header'));
        if (redirectsLeft <= 0) return reject(new Error('Too many redirects fetching PDF'));
        res.resume(); // drain response before following redirect
        return fetchBuffer(location, redirectsLeft - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching PDF from ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sanitizeForMysql(text) {
  return text
    // Common Unicode symbols → ASCII equivalents
    .replace(/\u2192/g, '->')      // →
    .replace(/\u2190/g, '<-')      // ←
    .replace(/\u2194/g, '<->')     // ↔
    .replace(/\u21d2/g, '=>')      // ⇒
    .replace(/\u2022/g, '-')       // •
    .replace(/\u2023/g, '-')       // ‣
    .replace(/\u2043/g, '-')       // ⁃
    .replace(/\u2013/g, '-')       // –  en dash
    .replace(/\u2014/g, '--')      // —  em dash
    .replace(/\u2026/g, '...')     // …
    .replace(/[\u2018\u2019]/g, "'")  // '' smart single quotes
    .replace(/[\u201c\u201d]/g, '"')  // "" smart double quotes
    .replace(/\u00b7/g, '-')       // · middle dot
    .replace(/\u00d7/g, 'x')       // × multiplication sign
    .replace(/\u00f7/g, '/')       // ÷ division sign
    .replace(/\u2260/g, '!=')      // ≠
    .replace(/\u2264/g, '<=')      // ≤
    .replace(/\u2265/g, '>=')      // ≥
    .replace(/\u221e/g, 'infinity') // ∞
    .replace(/\u03b1/g, 'alpha')   // α
    .replace(/\u03b2/g, 'beta')    // β
    .replace(/\u03c0/g, 'pi')      // π
    // Strip only truly problematic characters for MySQL utf8:
    // surrogate pairs (invalid UTF-8), 4-byte chars (emoji/rare symbols), null bytes
    .replace(/[\uD800-\uDFFF]/g, '')   // surrogate pairs
    .replace(/[^\u0000-\uFFFF]/g, '')  // 4-byte characters above BMP (emoji etc.)
    .replace(/\u0000/g, '')            // null bytes
    // Clean up extra spaces left by replacements
    .replace(/ {2,}/g, ' ');
}

async function extractTextFromPdf(uri) {
  if (!uri) return null;

  let pdfParse;
  try {
    // Use lib path directly to avoid pdf-parse test file check on production servers
    pdfParse = require('pdf-parse/lib/pdf-parse.js');
    if (typeof pdfParse !== 'function') throw new Error('not a function');
  } catch (_) {
    try {
      pdfParse = require('pdf-parse');
      if (typeof pdfParse !== 'function') throw new Error('not a function');
    } catch (__) {
      console.warn('pdf-parse not available, skipping text extraction');
      return null;
    }
  }

  try {
    let buffer;

    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log(`📄 PDF extraction: fetching from ${uri}`);
      buffer = await fetchBuffer(uri);
    } else {
      const localPath = uri.startsWith('/')
        ? path.join(__dirname, '..', uri.slice(1))
        : path.join(__dirname, '..', 'uploads', path.basename(uri));
      console.log(`📄 PDF extraction: reading from ${localPath}`);
      if (!fs.existsSync(localPath)) {
        console.warn(`PDF file not found at: ${localPath}`);
        return null;
      }
      buffer = fs.readFileSync(localPath);
    }

    // Verify buffer starts with PDF magic bytes
    if (!buffer || buffer.length < 4 || buffer.slice(0, 4).toString() !== '%PDF') {
      console.warn(`PDF extraction: buffer does not appear to be a valid PDF (${uri})`);
      return null;
    }

    const data = await pdfParse(buffer, { max: 0 });
    const raw = (data.text || '').trim();
    const sanitized = sanitizeForMysql(raw);
    const result = sanitized.replace(/\s{3,}/g, '  ').trim().slice(0, MAX_TEXT_LENGTH) || null;
    console.log(`📄 PDF extraction: extracted ${result ? result.length : 0} chars from ${uri}`);
    return result;
  } catch (error) {
    console.warn(`PDF text extraction failed for ${uri}:`, error.message);
    return null;
  }
}

module.exports = { extractTextFromPdf };
