const zlib = require('zlib');
const fs = require('fs');

function checkPDF(filename) {
  const buf = fs.readFileSync(filename);
  const str = buf.toString('binary');
  let pos = 0, streamCount = 0;
  while (true) {
    const s = str.indexOf('stream\r\n', pos);
    if (s === -1) break;
    streamCount++;
    const d = s + 8;
    const e = str.indexOf('endstream', d);
    if (e === -1) break;
    const rawBuf = buf.slice(d, e);
    let inflated;
    try {
      inflated = zlib.inflateSync(rawBuf).toString('binary');
    } catch(e2) {
      inflated = rawBuf.toString('binary');
    }
    console.log(`\nStream ${streamCount} (${rawBuf.length} bytes compressed):`);
    // Look for any text operators
    const hasBT = inflated.includes('BT');
    const hasTj = inflated.includes('Tj') || inflated.includes('TJ');
    const hasFont = inflated.includes('Tf');
    console.log('  BT:', hasBT, 'Tj/TJ:', hasTj, 'Tf:', hasFont);
    if (hasBT || hasTj) {
      // Print context around text operators
      const idx = inflated.indexOf('BT');
      console.log('  Around BT:', JSON.stringify(inflated.slice(Math.max(0,idx-20), idx+100)));
    }
    pos = e + 9;
  }
  console.log(`Total streams: ${streamCount}`);
}

console.log('=== test_abs_text.pdf ===');
checkPDF('C:/Users/Talha/test_abs_text.pdf');
