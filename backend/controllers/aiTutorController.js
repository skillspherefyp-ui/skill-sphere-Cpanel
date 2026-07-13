const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');
const { Topic, AILecture, AIOutline, Course, Material } = require('../models');
const aiTutorService = require('../services/aiTutorService');
const openaiService = require('../services/openaiService');

const upload = multer({ storage: multer.memoryStorage() });

exports.audioUploadMiddleware = upload.single('audio');

exports.upsertOutline = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findByPk(topicId);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    await aiTutorService.canManageCourse(req.user, topic.courseId);

    const outlineText = req.body.outlineText?.trim();
    if (!outlineText) {
      return res.status(400).json({ error: 'outlineText is required' });
    }

    const [outline] = await AIOutline.findOrCreate({
      where: { topicId: topic.id },
      defaults: {
        courseId: topic.courseId,
        topicId: topic.id,
        instructorId: req.user.id,
        outlineText,
        sourceMaterials: [],
        status: 'draft'
      }
    });

    await outline.update({
      instructorId: req.user.id,
      outlineText
    });

    const result = { topicId: topic.id, topicTitle: topic.title, status: 'updated' };
    res.json({ success: true, result });
  } catch (error) {
    console.error('Upsert AI outline error:', error);
    res.status(error.message.includes('permission') ? 403 : 400).json({ error: error.message || 'Internal server error' });
  }
};

exports.generateCoursePackage = async (req, res) => {
  try {
    const generation = await aiTutorService.startCourseGeneration(req.params.courseId, req.user);

    res.status(202).json({
      success: true,
      accepted: true,
      alreadyRunning: generation.alreadyRunning,
      courseId: generation.courseId,
      startedAt: generation.startedAt,
      message: generation.alreadyRunning
        ? 'AI lecture generation is already in progress for this course.'
        : 'AI lecture generation has started. You can track progress from the instructor screen.'
    });
  } catch (error) {
    console.error('Generate AI course package error:', error);
    res.status(error.message.includes('permission') ? 403 : 400).json({ error: error.message || 'Internal server error' });
  }
};

exports.createTopicsFromOutline = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId, {
      include: [{ model: Material, as: 'materials' }]
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    await aiTutorService.canManageCourse(req.user, courseId);

    // Find course-level outline PDF with extracted text
    const outlineMaterial = (course.materials || []).find(
      m => !m.topicId && m.type === 'pdf' && m.extractedText
    );
    if (!outlineMaterial) {
      return res.status(400).json({ error: 'No course outline PDF with extracted text found. Please upload a course outline PDF on the course creation page first.' });
    }

    const topicNames = await openaiService.extractTopicsFromOutline({
      outlineText: outlineMaterial.extractedText,
      courseName: course.name,
      courseDescription: course.description
    });

    if (!topicNames.length) {
      return res.status(400).json({ error: 'Could not extract any topics from the outline. Please check the PDF content.' });
    }

    // Delete all existing topics for this course (cascades to materials, AI content, etc.)
    await Topic.destroy({ where: { courseId } });

    // Create fresh topics from outline
    const created = await Topic.bulkCreate(
      topicNames.map((title, i) => ({
        title,
        courseId: parseInt(courseId, 10),
        order: i,
        status: 'locked'
      })),
      { returning: true }
    );

    res.json({ success: true, count: created.length, topics: created });
  } catch (error) {
    console.error('Create topics from outline error:', error);
    res.status(error.message.includes('permission') ? 403 : 500).json({ error: error.message || 'Failed to create topics' });
  }
};

exports.getGenerationStatus = async (req, res) => {
  try {
    await aiTutorService.canManageCourse(req.user, req.params.courseId);
    const status = await aiTutorService.getCourseGenerationStatus(req.params.courseId);
    res.json(status);
  } catch (error) {
    console.error('Get AI generation status error:', error);
    res.status(error.message.includes('permission') ? 403 : 400).json({ error: error.message || 'Internal server error' });
  }
};

exports.generateTopicPackage = async (req, res) => {
  try {
    const customPrompt = req.body?.customPrompt || null;
    const generation = await aiTutorService.startTopicGeneration(req.params.topicId, req.user, customPrompt);

    res.status(202).json({
      success: true,
      accepted: true,
      alreadyRunning: generation.alreadyRunning,
      topicId: generation.topicId,
      startedAt: generation.startedAt,
      message: generation.alreadyRunning
        ? 'AI lecture generation is already in progress for this topic.'
        : 'AI lecture generation has started for this topic.'
    });
  } catch (error) {
    console.error('Generate AI topic package error:', error);
    res.status(error.message.includes('permission') ? 403 : 400).json({ error: error.message || 'Internal server error' });
  }
};

exports.getTopicGenerationStatus = async (req, res) => {
  try {
    const status = await aiTutorService.getTopicGenerationStatus(req.params.topicId);
    res.json(status);
  } catch (error) {
    console.error('Get AI topic generation status error:', error);
    res.status(error.message.includes('permission') ? 403 : 400).json({ error: error.message || 'Internal server error' });
  }
};

exports.listLectures = async (req, res) => {
  try {
    const lectures = await AILecture.findAll({
      where: req.query.topicId
        ? { courseId: req.params.courseId, topicId: req.query.topicId }
        : { courseId: req.params.courseId },
      include: [{ model: Topic, as: 'topic' }],
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, lectures });
  } catch (error) {
    console.error('List AI lectures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getLecturePackage = async (req, res) => {
  try {
    const lecture = await aiTutorService.getLectureByTopicId(req.params.topicId);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture package not found' });
    }

    res.json({ success: true, lecture });
  } catch (error) {
    console.error('Get AI lecture package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.startSession = async (req, res) => {
  try {
    const payload = await aiTutorService.startTutorSession(
      req.user.id,
      req.params.topicId,
      req.body.voiceModeEnabled
    );

    res.status(201).json({
      success: true,
      session: payload.session,
      lecture: payload.lecture,
      progress: payload.progress,
      chunk: payload.chunk
    });
  } catch (error) {
    console.error('Start AI tutor session error:', error);
    res.status(error.message.includes('enrolled') ? 403 : 400).json({ error: error.message || 'Internal server error' });
  }
};

exports.getSessionState = async (req, res) => {
  try {
    const state = await aiTutorService.getSessionState(req.params.sessionId, req.user.id);
    res.json({ success: true, ...state });
  } catch (error) {
    console.error('Get AI tutor session state error:', error);
    res.status(404).json({ error: error.message || 'Internal server error' });
  }
};

exports.getNextChunk = async (req, res) => {
  try {
    const result = await aiTutorService.getNextLectureChunk(req.params.sessionId, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get next AI lecture chunk error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

exports.restartSession = async (req, res) => {
  try {
    const result = await aiTutorService.restartTutorSession(req.params.sessionId, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Restart AI tutor session error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

exports.pauseSession = async (req, res) => {
  try {
    const session = await aiTutorService.setSessionPaused(req.params.sessionId, req.user.id, true);
    res.json({ success: true, session });
  } catch (error) {
    console.error('Pause AI tutor session error:', error);
    res.status(404).json({ error: error.message || 'Internal server error' });
  }
};

exports.resumeSession = async (req, res) => {
  try {
    await aiTutorService.setSessionPaused(req.params.sessionId, req.user.id, false);
    const state = await aiTutorService.getSessionState(req.params.sessionId, req.user.id);
    res.json({ success: true, ...state });
  } catch (error) {
    console.error('Resume AI tutor session error:', error);
    res.status(404).json({ error: error.message || 'Internal server error' });
  }
};

exports.submitQuestion = async (req, res) => {
  try {
    const question = req.body.question?.trim();
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const result = await aiTutorService.submitQuestion(req.params.sessionId, req.user.id, question);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Submit AI tutor question error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

exports.getFlashcards = async (req, res) => {
  try {
    const flashcards = await aiTutorService.getFlashcards(req.params.lectureId);
    res.json({ success: true, flashcards });
  } catch (error) {
    console.error('Get AI flashcards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const quiz = await aiTutorService.getQuiz(req.params.lectureId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const sanitizedQuiz = {
      ...quiz.toJSON(),
      questions: (quiz.questions || [])
        .slice()
        .sort((a, b) => a.questionIndex - b.questionIndex)
        .map((question) => ({
        id: question.id,
        questionIndex: question.questionIndex,
        prompt: question.prompt,
        options: question.options
      }))
    };

    res.json({ success: true, quiz: sanitizedQuiz });
  } catch (error) {
    console.error('Get AI quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const result = await aiTutorService.submitQuiz(req.params.lectureId, req.user.id, req.body.answers || {});
    res.json({ success: true, result });

    // Fire-and-forget memory extraction (Phase 3)
    try {
      const lecture = await AILecture.findByPk(req.params.lectureId);
      if (lecture) {
        const memoryService = require('../services/aiStudentMemoryService');
        memoryService.extractMemoriesFromQuiz({
          userId: req.user.id,
          lectureId: lecture.id,
          courseId: lecture.courseId,
          topicId: lecture.topicId,
          gradedQuestions: result.gradedQuestions || [],
          score: result.score,
          passed: result.passed,
        }).catch(() => {});
      }
    } catch { /* non-critical */ }
  } catch (error) {
    console.error('Submit AI quiz error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

// ── Phase 3: Student Memory ──────────────────────────────────────────────────

exports.getStudentMemory = async (req, res) => {
  try {
    const memoryService = require('../services/aiStudentMemoryService');
    const context = await memoryService.getStudentMemoryContext(
      req.user.id,
      req.params.courseId,
      req.query.topicId || null
    );
    res.json({ success: true, context });
  } catch (error) {
    console.error('Get student memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteStudentMemory = async (req, res) => {
  try {
    const { AIStudentMemory } = require('../models');
    const where = { userId: req.user.id, courseId: req.params.courseId };
    const deleted = await AIStudentMemory.destroy({ where });
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Delete student memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Phase 4: Adaptive Plans ──────────────────────────────────────────────────

exports.generateAdaptivePlan = async (req, res) => {
  try {
    const { lectureId, quizScore, gradedQuestions } = req.body;
    if (!lectureId) return res.status(400).json({ error: 'lectureId is required' });

    const lecture = await AILecture.findByPk(lectureId);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    const memoryService = require('../services/aiStudentMemoryService');
    const plan = await memoryService.generateAdaptiveRevision({
      userId: req.user.id,
      courseId: lecture.courseId,
      topicId: req.params.topicId,
      lectureId: lecture.id,
      quizScore: quizScore || 0,
      gradedQuestions: gradedQuestions || [],
    });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Generate adaptive plan error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

exports.getAdaptivePlan = async (req, res) => {
  try {
    const memoryService = require('../services/aiStudentMemoryService');
    const plan = await memoryService.getAdaptivePlan(req.user.id, req.params.topicId);
    res.json({ success: true, plan: plan || null });
  } catch (error) {
    console.error('Get adaptive plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.completeAdaptivePlan = async (req, res) => {
  try {
    const memoryService = require('../services/aiStudentMemoryService');
    await memoryService.completeAdaptivePlan(req.params.planId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Complete adaptive plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.transcribeAudio = async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'audio file is required' });
    }

    const extension = path.extname(req.file.originalname || '') || '.webm';
    tempFilePath = path.join(os.tmpdir(), `skillsphere-ai-${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const prompt = req.body.prompt || null;
    const transcript = await openaiService.transcribeAudio(tempFilePath, { prompt });
    res.json({ success: true, transcript });
  } catch (error) {
    console.error('Transcribe AI audio error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
};

exports.speakText = async (req, res) => {
  try {
    const text = req.body.text?.trim();
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const asset = await aiTutorService.getOrCreateAudioAsset({
      lectureId: req.body.lectureId || null,
      sessionId: req.body.sessionId || null,
      assetType: req.body.assetType || 'lecture_chunk',
      text
    });

    res.json({ success: true, asset });
  } catch (error) {
    console.error('Generate AI speech error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

exports.smokeTest = async (req, res) => {
  try {
    const response = await openaiService.smokeTest();
    res.json({ success: true, response });
  } catch (error) {
    console.error('OpenAI smoke test error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

exports.evaluateCheckpoint = async (req, res) => {
  try {
    const { question, studentAnswer, chunkText, language } = req.body;
    if (!question || !studentAnswer) {
      return res.status(400).json({ error: 'question and studentAnswer are required' });
    }
    const result = await openaiService.evaluateCheckpointAnswer({ question, studentAnswer, chunkText, language });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Evaluate checkpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

exports.retriggerGuidedSteps = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { language } = req.query;
    const guidedStepsService = require('../services/guidedStepsService');
    const { Topic, Course } = require('../models');

    const topic = await Topic.findByPk(topicId, { include: [{ model: Course, as: 'course' }] });
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const courseLang = language || topic.course?.language;
    await guidedStepsService.enrichLectureWithGuidedSteps(topic.id, {
      lectureTitle: topic.title,
      language: courseLang,
    });
    res.json({ success: true, message: 'Guided steps generation complete. Reload the lecture to see screenshots.' });
  } catch (error) {
    console.error('Retrigger guided steps error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
