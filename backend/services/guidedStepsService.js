/**
 * Guided Steps service — for "how-to / install / tool-usage" lecture sections,
 * generates a short visual walkthrough (instructions + REAL website screenshots)
 * and stores it on the section's visualData.guidedSteps. The AI tutor then walks
 * the student through it on the board.
 *
 * Best-effort: any failure is swallowed so it never breaks lecture generation.
 * Toggle with ENABLE_GUIDED_STEPS=false in .env.
 */
const OpenAI = require('openai');
const AILecture = require('../models/AILecture');
const AILectureSection = require('../models/AILectureSection');
const screenshotService = require('./screenshotService');

let client = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// Sections worth a screenshot walkthrough.
const HOWTO_RE = /(install|download|set[\s-]?up|configure|sign[\s-]?up|create an account|register|getting started|launch|run the|environment|\bide\b|editor|interpreter|command\s?line|terminal|browser|website|tool|account|extension|package manager|انسٹال|ڈاؤن لوڈ|ترتیب|شروع کریں|ٹرمینل|ایڈیٹر|ماحول|ویب سائٹ|اکاؤنٹ|رجسٹر|انسٹالیشن|ڈاؤنلوڈ)/i;
const MAX_SECTIONS = Number(process.env.GUIDED_STEPS_MAX_SECTIONS || 2);

async function generateSteps(section, lectureTitle) {
  const model = process.env.OPENAI_MODEL_QA || 'gpt-4o-mini';
  const completion = await getClient().chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You produce concise on-screen "how-to" walkthroughs a tutor shows on a board, using REAL public websites. Return JSON only.',
      },
      {
        role: 'user',
        content: `Lecture: "${lectureTitle}". Section: "${section.title}". Learning objective: "${section.learningObjective || ''}".

If (and ONLY if) this section is about a practical procedure a learner performs on a real website or computer (installing, downloading, signing up, configuring, using a tool/site), produce a short visual walkthrough. Otherwise return {"applicable": false, "steps": []}.

Return JSON exactly:
{ "applicable": true|false,
  "steps": [ { "instruction": "one imperative sentence", "url": "a REAL existing public web URL to screenshot, or null for a desktop/offline step", "selector": "optional CSS selector to highlight, or null", "caption": "short note under the screenshot" } ] }

Rules:
- 3 to 5 steps, in order.
- url must be a REAL, currently-existing official public page (e.g. https://www.python.org/downloads/, https://code.visualstudio.com/). Never invent URLs. Desktop/offline steps (running an installer, ticking a checkbox) → url null.
- Beginner-friendly, short, clear.`,
      },
    ],
  });
  const parsed = JSON.parse(completion.choices[0].message.content);
  console.log(`🖼️  GPT for section "${section.title}": applicable=${parsed.applicable}, steps=${Array.isArray(parsed.steps) ? parsed.steps.length : 0}`);
  if (parsed.applicable === false) return [];
  return Array.isArray(parsed.steps) ? parsed.steps : [];
}

async function attachGuidedStepsToSection(section, { lectureTitle }) {
  const aiSteps = await generateSteps(section, lectureTitle);
  if (!aiSteps.length) return false;

  const guidedSteps = [];
  for (const s of aiSteps) {
    const instruction = `${s.instruction || ''}`.trim();
    if (!instruction) continue;
    let image = null;
    let url = null;
    console.log(`🖼️  Step: "${instruction}" | url=${s.url || 'null'}`);
    if (s.url && screenshotService.isPublicHttpUrl(s.url)) {
      const shot = await screenshotService.captureUrlScreenshot(s.url, { width: 1280, height: 900, selector: s.selector || null });
      if (shot) { image = shot.urlPath; url = s.url; }
    }
    guidedSteps.push({ instruction, image, url, caption: `${s.caption || ''}`.trim() });
  }

  if (!guidedSteps.length) return false;

  const withImages = guidedSteps.filter((g) => g.image).length;
  console.log(`🖼️  Guided steps: ${guidedSteps.length} steps generated, ${withImages} with screenshots for section "${section.title}"`);

  const existing = section.visualData && typeof section.visualData === 'object' ? section.visualData : {};
  await section.update({ visualData: { ...existing, guidedSteps } });
  return true;
}

/**
 * Find how-to sections in a topic's lecture and attach guided steps to up to
 * MAX_SECTIONS of them. Safe to call after a lecture is persisted.
 */
async function enrichLectureWithGuidedSteps(topicId, { lectureTitle, language } = {}) {
  if (process.env.ENABLE_GUIDED_STEPS === 'false') {
    console.log(`🖼️  Guided steps: disabled via ENABLE_GUIDED_STEPS=false`);
    return;
  }
  if (!screenshotService.isAvailable()) {
    console.warn(`🖼️  Guided steps: skipped — no Chrome/Edge found and no SCREENSHOT_API_KEY set in backend/.env.`);
    return;
  }
  const browserExe = screenshotService.findBrowser();
  if (browserExe) console.log(`🖼️  Guided steps: browser found at ${browserExe}`);
  else console.log(`🖼️  Guided steps: using screenshot API (no local browser)`);

  const lecture = await AILecture.findOne({ where: { topicId } });
  if (!lecture) {
    console.log(`🖼️  Guided steps: no lecture found for topic ${topicId}`);
    return;
  }
  const sections = await AILectureSection.findAll({
    where: { lectureId: lecture.id },
    order: [['sectionIndex', 'ASC'], ['chunkIndex', 'ASC']],
  });

  const matchedSections = sections.filter((s) => {
    const vd = s.visualData || {};
    if (Array.isArray(vd.guidedSteps) && vd.guidedSteps.length) return false; // already done
    return HOWTO_RE.test(`${s.title || ''} ${s.learningObjective || ''} ${s.summary || ''}`);
  });

  console.log(`🖼️  Guided steps: ${sections.length} total sections, ${matchedSections.length} match HOWTO regex for topic ${topicId}`);
  if (matchedSections.length === 0) {
    console.log(`🖼️  Guided steps: no install/download/setup sections detected. Section titles: ${sections.slice(0, 5).map(s => s.title).join(', ')}`);
  }

  const candidates = matchedSections.slice(0, MAX_SECTIONS);

  let attached = 0;
  for (const section of candidates) {
    try {
      if (await attachGuidedStepsToSection(section, { lectureTitle: lectureTitle || lecture.title })) attached += 1;
    } catch (e) {
      console.warn(`Guided steps failed for section ${section.id}: ${e.message}`);
    }
  }
  if (attached) console.log(`🖼️  Attached guided steps to ${attached} section(s) for topic ${topicId}.`);
}

module.exports = { enrichLectureWithGuidedSteps, attachGuidedStepsToSection };
