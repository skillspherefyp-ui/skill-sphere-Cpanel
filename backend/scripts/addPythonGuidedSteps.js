/**
 * Attach a "Guided Steps with real screenshots" walkthrough to a lecture section.
 * Demo: section [40] "Downloading Python" → real python.org screenshots.
 *
 *   node scripts/addPythonGuidedSteps.js [sectionId]
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const OpenAI = require('openai');
const { testConnection } = require('../config/database');
const AILectureSection = require('../models/AILectureSection');
const screenshotService = require('../services/screenshotService');

const SECTION_ID = Number(process.argv[2]) || 40;

async function generateSteps(client, section) {
  const model = process.env.OPENAI_MODEL_QA || 'gpt-4o-mini';
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You produce concise on-screen "how-to" walkthroughs a tutor shows on a board. Return JSON only.',
      },
      {
        role: 'user',
        content: `Topic/section: "${section.title}".
Create a short, beginner-friendly visual walkthrough for: how to DOWNLOAD Python on a Windows computer.

Return JSON exactly:
{ "steps": [ { "instruction": "one imperative sentence", "url": "a REAL public web URL to screenshot, or null for a desktop/offline step", "selector": "optional CSS selector on that page to highlight, or null", "caption": "short note shown under the screenshot" } ] }

Rules:
- 3 to 4 steps, in order.
- Use ONLY real public pages on https://www.python.org for url (e.g. https://www.python.org/downloads/). For desktop installer steps (running the .exe, ticking "Add to PATH"), set url to null.
- Keep instructions short and clear for a complete beginner.`,
      },
    ],
  });
  const parsed = JSON.parse(completion.choices[0].message.content);
  return Array.isArray(parsed.steps) ? parsed.steps : [];
}

(async () => {
  await testConnection();
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const section = await AILectureSection.findByPk(SECTION_ID);
  if (!section) throw new Error(`Section ${SECTION_ID} not found`);
  console.log(`📑 Section [${section.id}] "${section.title}"`);

  console.log('🧠 Generating walkthrough steps…');
  const aiSteps = await generateSteps(client, section);
  console.log(`   ${aiSteps.length} steps proposed.`);

  const guidedSteps = [];
  for (let i = 0; i < aiSteps.length; i += 1) {
    const s = aiSteps[i];
    const instruction = `${s.instruction || ''}`.trim();
    const caption = `${s.caption || ''}`.trim();
    let image = null;
    if (s.url && /^https?:\/\/(www\.)?python\.org/i.test(s.url)) {
      console.log(`   📸 [${i + 1}] capturing ${s.url}${s.selector ? ` (highlight: ${s.selector})` : ''}…`);
      const shot = await screenshotService.captureUrlScreenshot(s.url, {
        width: 1280,
        height: 900,
        selector: s.selector || null,
      });
      if (shot) { image = shot.urlPath; console.log(`       → ${image}`); }
      else console.log('       → capture failed (instruction-only step)');
    } else {
      console.log(`   📝 [${i + 1}] desktop/offline step (no screenshot)`);
    }
    guidedSteps.push({ instruction, image, caption, url: image ? s.url : null });
  }
  await screenshotService.closeBrowser();

  const existing = section.visualData && typeof section.visualData === 'object' ? section.visualData : {};
  const merged = { ...existing, guidedSteps };
  await section.update({ visualData: merged });

  console.log('────────────────────────────────────────────');
  console.log(`✅ Attached ${guidedSteps.length} guided steps (${guidedSteps.filter((g) => g.image).length} with real screenshots) to section [${section.id}].`);
  console.log('   Open the lecture → reach "Downloading Python" to see it on the board.');
  console.log('────────────────────────────────────────────');
  process.exit(0);
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
