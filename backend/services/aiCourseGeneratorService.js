/**
 * AI Course Generator Service — Phase 1
 * Generates curriculum structure from OpenAI, then persists real DB records
 * and delegates lecture generation to the existing aiTutorService pipeline.
 */

const OpenAI = require('openai');
const { Course, Topic } = require('../models');
const aiTutorService = require('./aiTutorService');

function makeClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateCurriculumStructure(title, description, outcomes, pdfText, language) {
  const client = makeClient();
  const model = process.env.OPENAI_MODEL_QA || 'gpt-4o-mini';

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Generate structured course curricula as compact JSON. Return JSON only.'
      },
      {
        role: 'user',
        content: `You are an expert curriculum designer. Generate a complete, practical course structure.

Course Title: ${title}
Description: ${description || 'A comprehensive course'}
Learning Outcomes: ${outcomes || 'Students will understand core concepts'}
Language: ${language || 'English'}
${pdfText ? `Reference Material (excerpt): ${pdfText.slice(0, 2000)}` : ''}

Return valid JSON only with this exact structure:
{
  "modules": [
    {
      "title": "string",
      "description": "string",
      "topics": [
        {
          "title": "string",
          "outline": "2-3 sentences describing what this topic covers",
          "estimatedMinutes": 20
        }
      ]
    }
  ]
}

Rules:
- Generate 3-4 modules
- Each module has 2-3 topics
- Topics should build progressively
- Be specific to the course subject, not generic`
      }
    ]
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI');
  return JSON.parse(text);
}

/**
 * Creates a real Course + Topics in DB, then triggers the existing
 * aiTutorService.startCourseGeneration pipeline for lecture generation.
 *
 * @returns {Promise<{courseId, topicCount, structure}>}
 */
async function createAndGenerateCourse({
  title,
  description,
  outcomes,
  pdfText,
  language,
  level,
  categoryId,
  duration,
  instructorUser,
}) {
  // 1. Generate curriculum structure via OpenAI
  const structure = await generateCurriculumStructure(title, description, outcomes, pdfText, language);
  const modules = structure.modules || [];

  // 2. Flatten all topics across modules
  const allTopics = [];
  for (const mod of modules) {
    for (const topic of mod.topics || []) {
      allTopics.push({ title: topic.title });
    }
  }

  if (allTopics.length === 0) {
    throw new Error('AI did not generate any topics. Please try again.');
  }

  // 3. Create the Course record
  const estimatedHours = Math.max(1, Math.ceil((allTopics.length * 20) / 60));
  const course = await Course.create({
    name: title.trim(),
    description: (description || title).trim(),
    level: level || 'Intermediate',
    language: language || 'English',
    categoryId: Number(categoryId),
    duration: duration?.trim() || `${estimatedHours} hour${estimatedHours > 1 ? 's' : ''}`,
    userId: instructorUser.id,
    creationMode: 'ai',
    status: 'draft',
  });

  // 4. Create Topic records (sequential, first one unlocked)
  for (let i = 0; i < allTopics.length; i++) {
    await Topic.create({
      title: allTopics[i].title,
      courseId: course.id,
      order: i,
      status: i === 0 ? 'unlocked' : 'locked',
    });
  }

  // 5. Trigger background lecture generation via the existing aiTutorService pipeline.
  //    This is async — status polled via GET /ai-tutor/courses/:courseId/generate-status
  await aiTutorService.startCourseGeneration(course.id, instructorUser);

  return { courseId: course.id, topicCount: allTopics.length, structure };
}

module.exports = { createAndGenerateCourse, generateCurriculumStructure };
