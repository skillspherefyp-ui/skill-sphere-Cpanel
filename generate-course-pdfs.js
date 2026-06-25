/**
 * Generates one PDF per topic for both courses.
 * Run: node generate-course-pdfs.js
 */
const fs   = require('fs');
const path = require('path');

// ── Load puppeteer from backend node_modules ──────────────────────────────
let puppeteer;
try {
  puppeteer = require(path.join(__dirname, 'backend', 'node_modules', 'puppeteer'));
} catch (_) {
  try {
    puppeteer = require(path.join(__dirname, 'backend', 'node_modules', 'puppeteer-core'));
  } catch (__) {
    console.error('puppeteer not found in backend/node_modules. Run: npm install puppeteer in backend/');
    process.exit(1);
  }
}

// Chrome path for puppeteer-core fallback
const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean).find(p => { try { return fs.existsSync(p); } catch { return false; } });

// ── Simple Markdown → HTML ────────────────────────────────────────────────
function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function mdToHtml(md) {
  const lines   = md.split('\n');
  let html      = '';
  let inCode    = false;
  let codeBuf   = '';
  let codeLang  = '';
  let inTable   = false;
  let tableRows = [];
  let listStack = [];   // track open <ul> depth

  function closeLists() {
    while (listStack.length) { html += '</ul>\n'; listStack.pop(); }
  }
  function closeTable() {
    if (!inTable) return;
    let t = '<table>';
    tableRows.forEach((cells, i) => {
      t += '<tr>' + cells.map(c => i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join('') + '</tr>';
    });
    t += '</table>';
    html += t;
    inTable = false;
    tableRows = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.trimEnd();

    // ── Code block ──
    if (line.startsWith('```')) {
      if (!inCode) {
        closeLists();
        closeTable();
        codeLang = line.slice(3).trim();
        inCode   = true;
        codeBuf  = '';
      } else {
        html   += `<pre><code>${escHtml(codeBuf.replace(/\n$/, ''))}</code></pre>\n`;
        inCode  = false;
      }
      continue;
    }
    if (inCode) { codeBuf += raw + '\n'; continue; }

    // ── Table ──
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-: ]+$/.test(c))) continue; // separator row
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    }
    if (inTable) closeTable();

    // ── Headings ──
    if (line.startsWith('#### ')) { closeLists(); html += `<h4>${inlineFormat(escHtml(line.slice(5)))}</h4>\n`; continue; }
    if (line.startsWith('### '))  { closeLists(); html += `<h3>${inlineFormat(escHtml(line.slice(4)))}</h3>\n`; continue; }
    if (line.startsWith('## '))   { closeLists(); html += `<h2>${inlineFormat(escHtml(line.slice(3)))}</h2>\n`; continue; }
    if (line.startsWith('# '))    { closeLists(); html += `<h1>${inlineFormat(escHtml(line.slice(2)))}</h1>\n`; continue; }

    // ── Horizontal rule ──
    if (/^---+$/.test(line.trim())) { closeLists(); html += '<hr>\n'; continue; }

    // ── Blockquote (> Note:) ──
    if (line.startsWith('> ')) { closeLists(); html += `<blockquote>${inlineFormat(escHtml(line.slice(2)))}</blockquote>\n`; continue; }

    // ── List items ──
    const listMatch = line.match(/^(\s*)- (.+)/);
    if (listMatch) {
      const depth   = Math.floor(listMatch[1].length / 2);
      const content = inlineFormat(escHtml(listMatch[2]));
      while (listStack.length > depth + 1) { html += '</ul>\n'; listStack.pop(); }
      if (listStack.length < depth + 1)    { html += '<ul>\n';  listStack.push(depth); }
      html += `<li>${content}</li>\n`;
      continue;
    }

    // ── Blank line ──
    if (line.trim() === '') {
      closeLists();
      closeTable();
      html += '\n';
      continue;
    }

    // ── Paragraph ──
    closeLists();
    html += `<p>${inlineFormat(escHtml(line))}</p>\n`;
  }
  closeLists();
  closeTable();
  return html;
}

// ── HTML wrapper ──────────────────────────────────────────────────────────
function wrapHtml(title, bodyHtml, isUrdu = false) {
  return `<!DOCTYPE html>
<html lang="${isUrdu ? 'ur' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(title)}</title>
  <style>
    /* system fonts only — no network fetch */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Segoe UI', 'Noto Nastaliq Urdu', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1a1a2e;
      padding: 40px 50px;
      max-width: 860px;
      margin: 0 auto;
    }
    h1 { font-size: 20pt; color: #0d1b2a; border-bottom: 2px solid #3a86ff; padding-bottom: 8px; margin: 0 0 20px; }
    h2 { font-size: 15pt; color: #1d3557; margin: 28px 0 10px; border-left: 4px solid #3a86ff; padding-left: 10px; }
    h3 { font-size: 12pt; color: #1d3557; margin: 18px 0 6px; }
    h4 { font-size: 11pt; color: #457b9d; margin: 12px 0 4px; }
    p  { margin: 6px 0 8px; }
    ul { margin: 4px 0 8px 24px; }
    li { margin: 3px 0; }
    ul ul { margin-top: 2px; margin-bottom: 2px; }
    pre {
      background: #0d1b2a;
      color: #e0e0e0;
      padding: 14px 16px;
      border-radius: 6px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 9.5pt;
      overflow-x: auto;
      margin: 10px 0 14px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    code {
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 9.5pt;
      background: #eef2ff;
      padding: 1px 5px;
      border-radius: 3px;
      color: #3a0ca3;
    }
    pre code { background: none; color: inherit; padding: 0; }
    strong { color: #1d3557; }
    hr { border: none; border-top: 1px solid #dee2e6; margin: 16px 0; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0 14px; font-size: 10pt; }
    th { background: #1d3557; color: #fff; padding: 7px 10px; text-align: left; }
    td { padding: 6px 10px; border: 1px solid #dee2e6; }
    tr:nth-child(even) td { background: #f8f9fa; }
    blockquote { background: #fff3cd; border-left: 4px solid #ffc107; padding: 8px 14px; margin: 10px 0; font-size: 10pt; border-radius: 0 4px 4px 0; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// ── Split markdown into topics ────────────────────────────────────────────
function splitTopics(mdContent) {
  // Split on "## Topic N:" lines — captures the heading + everything until next topic
  const parts = mdContent.split(/(?=^## Topic \d+)/m).filter(p => p.trim());
  const topics = [];

  for (const part of parts) {
    const titleMatch = part.match(/^## Topic \d+[:\s—-]+(.+)/m);
    if (!titleMatch) continue;
    const rawTitle = titleMatch[0].replace(/^## /, '').trim();
    const shortTitle = titleMatch[1].trim();
    const topicNumMatch = part.match(/^## Topic (\d+)/m);
    const num = topicNumMatch ? parseInt(topicNumMatch[1], 10) : 0;
    topics.push({ num, rawTitle, shortTitle, content: part });
  }

  return topics;
}

// ── Generate PDF from HTML ────────────────────────────────────────────────
async function generatePdf(browser, htmlContent, outputPath) {
  const page = await browser.newPage();
  try {
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
    });
  } finally {
    await page.close().catch(() => {});
  }
}

// ── Safe filename (keep Urdu chars, replace problematic ones) ────────────
function safeFilename(str) {
  return str
    .replace(/[—–]/g, '-')          // em dash / en dash → plain hyphen
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  // English filenames for Python topics (content stays in Urdu)
  const pythonEnglishTitles = [
    'Introduction to Python and Programming',
    'Installing Python and Setting Up VS Code',
    'Variables and Data Types',
    'Operators',
    'User Input and Output',
    'Conditional Statements',
    'Loops - for and while',
    'Functions',
    'Lists and Tuples',
    'Dictionaries and Sets',
    'Strings',
    'File Handling',
    'Error Handling',
    'Introduction to Object-Oriented Programming',
    'Major Practice Programs',
  ];

  const courses = [
    {
      mdFile:        path.join(__dirname, 'python-beginners-urdu.md'),
      outFolder:     path.join(__dirname, 'python course'),
      isUrdu:        true,
      label:         'Python (Urdu)',
      filenameTitles: pythonEnglishTitles,
      skip:          true,
    },
    {
      mdFile:    path.join(__dirname, 'cpp-introduction-english.md'),
      outFolder: path.join(__dirname, 'itp course'),
      isUrdu:    false,
      label:     'ITP C++ (English)',
      skip:      true,
    },
    {
      mdFile:     path.join(__dirname, 'web-development-fundamentals.md'),
      outFolder:  path.join(__dirname, 'web dev course'),
      isUrdu:     false,
      label:      'Web Development (English)',
      topicLimit: 5,
    },
  ];

  const launchOpts = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  if (CHROME) {
    launchOpts.executablePath = CHROME;
    console.log(`Using browser: ${CHROME}`);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch(launchOpts);

  try {
    for (const course of courses) {
      if (course.skip) { console.log(`Skipping: ${course.label}`); continue; }
      if (!fs.existsSync(course.mdFile)) {
        console.warn(`MD file not found: ${course.mdFile}`);
        continue;
      }

      fs.mkdirSync(course.outFolder, { recursive: true });
      console.log(`\n── ${course.label} ──────────────────────`);
      console.log(`   Output folder: ${course.outFolder}`);

      const mdContent = fs.readFileSync(course.mdFile, 'utf8');
      const topics    = splitTopics(mdContent);

      if (topics.length === 0) {
        console.warn('   No topics found — check MD file format.');
        continue;
      }

      const topicsToProcess = course.topicLimit ? topics.slice(0, course.topicLimit) : topics;
      for (const topic of topicsToProcess) {
        const displayTitle = course.filenameTitles ? (course.filenameTitles[topic.num - 1] || topic.shortTitle) : topic.shortTitle;
        const filename  = `Topic ${String(topic.num).padStart(2, '0')} - ${safeFilename(displayTitle)}.pdf`;
        const outPath   = path.join(course.outFolder, filename);
        const bodyHtml  = mdToHtml(topic.content);
        const fullHtml  = wrapHtml(topic.rawTitle, bodyHtml, course.isUrdu);

        process.stdout.write(`   [${String(topic.num).padStart(2, '0')}] ${topic.shortTitle.slice(0, 50)} ... `);
        await generatePdf(browser, fullHtml, outPath);
        console.log('done');
      }

      console.log(`   ${topicsToProcess.length} PDF(s) saved to "${path.basename(course.outFolder)}/"`);
    }
  } finally {
    await browser.close();
  }

  console.log('\nAll done!');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
