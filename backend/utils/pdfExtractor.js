const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const MAX_TEXT_LENGTH = 12000;

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching PDF`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function extractTextFromPdf(uri) {
  if (!uri) return null;

  let pdfParse;
  try {
    pdfParse = require('pdf-parse');
    if (typeof pdfParse !== 'function') throw new Error('not a function');
  } catch (_) {
    console.warn('pdf-parse not available, skipping text extraction');
    return null;
  }

  try {
    let buffer;

    if (uri.startsWith('http://') || uri.startsWith('https://')) {
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

    const data = await pdfParse(buffer);
    const text = (data.text || '').replace(/\s{3,}/g, '  ').trim();
    return text.slice(0, MAX_TEXT_LENGTH) || null;
  } catch (error) {
    console.warn('PDF text extraction failed:', error.message);
    return null;
  }
}

module.exports = { extractTextFromPdf };
