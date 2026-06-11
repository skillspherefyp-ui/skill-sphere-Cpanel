/**
 * AI Student Memory Service — Phases 3 & 4
 *
 * Phase 3: Stores and retrieves per-student learning memories
 *          (weaknesses, strengths, confusion patterns).
 *          Memories are injected into future AI Q&A prompts.
 *
 * Phase 4: Generates targeted revision content when a student
 *          fails a quiz, using stored weakness memories.
 */

const OpenAI = require('openai');
const { AIStudentMemory, AIAdaptivePlan, AILecture, Topic, Course } = require('../models');

function makeClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Phase 3: Memory Extraction ────────────────────────────────────────────────

/**
 * Called after quiz submission. Extracts weakness/mastery memories from graded questions.
 */
async function extractMemoriesFromQuiz({ userId, lectureId, courseId, topicId, gradedQuestions, score, passed }) {
  if (!gradedQuestions?.length) return;

  const wrongQuestions = gradedQuestions.filter((q) => !q.isCorrect);
  const rightQuestions = gradedQuestions.filter((q) => q.isCorrect);

  // Store a weakness memory for failed quiz (if any wrong answers)
  if (wrongQuestions.length > 0) {
    const keyTerms = wrongQuestions
      .map((q) => q.explanation?.split(/\s+/).slice(0, 3).join(' '))
      .filter(Boolean);

    await AIStudentMemory.create({
      userId,
      courseId: courseId || null,
      topicId: topicId || null,
      lectureId: lectureId || null,
      memoryType: 'weakness',
      content: `Student answered ${wrongQuestions.length} of ${gradedQuestions.length} questions incorrectly (score: ${score}%).`,
      keyTerms,
      sourceType: 'quiz_failure',
      confidence: Math.min(1, wrongQuestions.length / gradedQuestions.length + 0.2),
    });
  }

  // Store a mastery memory for correct answers (if passed)
  if (passed && rightQuestions.length > 0) {
    await AIStudentMemory.create({
      userId,
      courseId: courseId || null,
      topicId: topicId || null,
      lectureId: lectureId || null,
      memoryType: 'mastery',
      content: `Student passed quiz with score: ${score}%.`,
      keyTerms: [],
      sourceType: 'quiz_pass',
      confidence: 0.9,
    });
  }
}

/**
 * Called after a student asks a question. Records what concept they needed help with.
 */
async function extractMemoryFromQuestion({ userId, courseId, topicId, lectureId, question }) {
  if (!question?.trim()) return;

  // Use a minimal OpenAI call to extract the concept being asked about
  try {
    const client = makeClient();
    const model = process.env.OPENAI_MODEL_QA || 'gpt-4o-mini';

    const resp = await client.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: 80,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Extract the core concept from a student question. Return JSON: {"concept": "short phrase", "terms": ["term1", "term2"]}'
        },
        { role: 'user', content: `Student question: "${question}"` }
      ]
    });

    const parsed = JSON.parse(resp.choices[0]?.message?.content || '{}');
    const concept = parsed.concept || question.slice(0, 80);
    const terms = Array.isArray(parsed.terms) ? parsed.terms.slice(0, 4) : [];

    await AIStudentMemory.create({
      userId,
      courseId: courseId || null,
      topicId: topicId || null,
      lectureId: lectureId || null,
      memoryType: 'confusion',
      content: `Student asked: "${question.slice(0, 200)}" — concept: ${concept}`,
      keyTerms: terms,
      sourceType: 'question_asked',
      confidence: 0.75,
    });
  } catch {
    // Non-critical — don't fail the question flow if memory extraction fails
  }
}

/**
 * Returns a formatted memory context string for injection into AI prompts.
 * Fetches the 20 most recent memories for the given student/course/topic.
 */
async function getStudentMemoryContext(userId, courseId, topicId) {
  const where = { userId };
  if (courseId) where.courseId = courseId;
  if (topicId) where.topicId = topicId;

  const memories = await AIStudentMemory.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 20,
  });

  if (memories.length === 0) return null;

  const weaknesses = memories.filter((m) => m.memoryType === 'weakness' || m.memoryType === 'confusion');
  const strengths = memories.filter((m) => m.memoryType === 'mastery' || m.memoryType === 'strength');
  const questions = memories.filter((m) => m.memoryType === 'question_pattern');

  const parts = [];

  if (weaknesses.length > 0) {
    const terms = [...new Set(weaknesses.flatMap((m) => m.keyTerms || []))].slice(0, 6);
    parts.push(`Student has struggled with: ${terms.join(', ') || 'general concepts'}. ${weaknesses[0].content}`);
  }
  if (strengths.length > 0) {
    parts.push(`Student has demonstrated mastery in: ${strengths.map((m) => m.content).join('; ')}`);
  }
  if (questions.length > 0) {
    parts.push(`Student previously asked about: ${questions.map((m) => m.keyTerms?.join(', ')).filter(Boolean).join('; ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : null;
}

// ── Phase 4: Adaptive Revision Generation ────────────────────────────────────

/**
 * Generates 2-3 targeted revision chunks for a student who failed a quiz.
 * Stores the plan in AIAdaptivePlan table.
 */
async function generateAdaptiveRevision({ userId, courseId, topicId, lectureId, quizScore, gradedQuestions }) {
  const existing = await AIAdaptivePlan.findOne({
    where: { userId, topicId, status: ['pending', 'ready'] },
    order: [['createdAt', 'DESC']],
  });

  if (existing?.status === 'ready') return existing;

  // Determine weak areas from quiz failures and stored memories
  const wrongQuestions = (gradedQuestions || []).filter((q) => !q.isCorrect);
  const weakTerms = [...new Set(wrongQuestions.flatMap((q) => {
    const words = (q.explanation || '').split(/\s+/).slice(0, 4);
    return words;
  }))].slice(0, 6);

  const memoryContext = await getStudentMemoryContext(userId, courseId, topicId);

  // Create a plan record first (status: pending)
  const plan = existing || await AIAdaptivePlan.create({
    userId,
    courseId,
    topicId,
    lectureId,
    triggerType: 'quiz_failure',
    weakAreas: weakTerms,
    revisionChunks: [],
    status: 'pending',
    quizScore: quizScore || 0,
  });

  // Generate revision content via OpenAI
  try {
    const lecture = await AILecture.findByPk(lectureId);
    const topic = await Topic.findByPk(topicId);
    const course = await Course.findByPk(courseId);

    const client = makeClient();
    const model = process.env.OPENAI_MODEL_QA || 'gpt-4o-mini';

    const prompt = `You are an AI tutor. A student failed a quiz on "${topic?.title || 'this topic'}" with a score of ${quizScore}%.

Weak areas: ${weakTerms.join(', ') || 'general understanding'}
${memoryContext ? `Student history: ${memoryContext}` : ''}
Lecture title: ${lecture?.title || topic?.title}
Language: ${course?.language || 'English'}

Generate 2 focused revision chunks that re-explain the weak concepts differently, with new examples.
Return JSON: {
  "chunks": [
    {
      "title": "string",
      "spokenExplanation": "string (300-500 words, clear and friendly)",
      "keyTerms": ["term1", "term2"],
      "examples": ["example1", "example2"],
      "analogyIfHelpful": "string or null",
      "visualMode": "none"
    }
  ]
}`;

    const resp = await client.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Generate targeted revision content as JSON.' },
        { role: 'user', content: prompt }
      ]
    });

    const parsed = JSON.parse(resp.choices[0]?.message?.content || '{"chunks":[]}');
    const chunks = Array.isArray(parsed.chunks) ? parsed.chunks : [];

    await plan.update({ revisionChunks: chunks, status: 'ready', weakAreas: weakTerms });
    return plan;
  } catch (err) {
    console.error('[AdaptivePlan] Revision generation failed:', err.message);
    await plan.update({ status: 'pending' });
    throw err;
  }
}

/**
 * Returns an existing ready adaptive plan for the student/topic, or null.
 */
async function getAdaptivePlan(userId, topicId) {
  return AIAdaptivePlan.findOne({
    where: { userId, topicId, status: ['ready', 'pending'] },
    order: [['createdAt', 'DESC']],
  });
}

/**
 * Marks an adaptive plan as completed (student finished revision).
 */
async function completeAdaptivePlan(planId, userId) {
  const plan = await AIAdaptivePlan.findOne({ where: { id: planId, userId } });
  if (plan) await plan.update({ status: 'completed' });
}

module.exports = {
  extractMemoriesFromQuiz,
  extractMemoryFromQuestion,
  getStudentMemoryContext,
  generateAdaptiveRevision,
  getAdaptivePlan,
  completeAdaptivePlan,
};
