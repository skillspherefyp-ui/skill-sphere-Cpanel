const { Op, fn, col, literal } = require('sequelize');
const {
  AITutorSession,
  AITutorMessage,
  AIStudentProgress,
  AIStudentMemory,
  AIAdaptivePlan,
  AILecture,
  AIQuiz,
  Course,
  Topic,
  User,
  Enrollment,
} = require('../models');

// Helper: verify the requesting instructor owns the course
async function verifyCourseOwner(courseId, userId) {
  const course = await Course.findOne({ where: { id: courseId, userId } });
  if (!course) throw Object.assign(new Error('Course not found or access denied'), { status: 403 });
  return course;
}

// ── GET /api/analytics/overview ─────────────────────────────────────────────
exports.getOverview = async (req, res) => {
  try {
    // Get all courses owned by this instructor
    const courses = await Course.findAll({
      where: { userId: req.user.id },
      attributes: ['id'],
    });
    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return res.json({ success: true, overview: { totalSessions: 0, totalQuestions: 0, totalStudents: 0, quizPassRate: 0, avgScore: 0 } });
    }

    const [totalSessions, totalQuestions, totalStudents, progressRecords] = await Promise.all([
      AITutorSession.count({ where: { courseId: { [Op.in]: courseIds } } }),
      AITutorMessage.count({
        include: [{ model: AITutorSession, as: 'session', where: { courseId: { [Op.in]: courseIds } }, attributes: [] }],
        where: { role: 'user' },
      }),
      Enrollment.count({
        where: { courseId: { [Op.in]: courseIds } },
        distinct: true,
        col: 'userId',
      }),
      AIStudentProgress.findAll({
        where: { courseId: { [Op.in]: courseIds }, quizAttempts: { [Op.gt]: 0 } },
        attributes: ['quizAttempts', 'quizBestScore'],
      }),
    ]);

    const totalAttempts = progressRecords.reduce((s, r) => s + (r.quizAttempts || 0), 0);
    const totalPassed = progressRecords.filter((r) => (r.quizBestScore || 0) >= 70).length;
    const avgScore = progressRecords.length
      ? Math.round(progressRecords.reduce((s, r) => s + (r.quizBestScore || 0), 0) / progressRecords.length)
      : 0;

    res.json({
      success: true,
      overview: {
        totalSessions,
        totalQuestions,
        totalStudents,
        totalCourses: courseIds.length,
        quizAttempts: totalAttempts,
        quizPassRate: totalAttempts ? Math.round((totalPassed / progressRecords.length) * 100) : 0,
        avgScore,
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

// ── GET /api/analytics/courses/:courseId/engagement ─────────────────────────
exports.getEngagement = async (req, res) => {
  try {
    await verifyCourseOwner(req.params.courseId, req.user.id);

    const sessions = await AITutorSession.findAll({
      where: { courseId: req.params.courseId },
      attributes: ['id', 'status', 'topicId', 'createdAt', 'updatedAt'],
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'title'] }],
    });

    const questionCount = await AITutorMessage.count({
      include: [{ model: AITutorSession, as: 'session', where: { courseId: req.params.courseId }, attributes: [] }],
      where: { role: 'user' },
    });

    const progressRecords = await AIStudentProgress.findAll({
      where: { courseId: req.params.courseId },
      attributes: ['userId', 'topicId', 'lectureCompleted', 'quizAttempts', 'quizBestScore'],
    });

    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const byTopic = {};
    for (const s of sessions) {
      const key = s.topicId;
      if (!byTopic[key]) byTopic[key] = { topicId: key, title: s.topic?.title || 'Unknown', sessions: 0 };
      byTopic[key].sessions++;
    }

    res.json({
      success: true,
      engagement: {
        totalSessions: sessions.length,
        completedSessions,
        totalQuestions: questionCount,
        topicBreakdown: Object.values(byTopic),
        lectureCompletions: progressRecords.filter((r) => r.lectureCompleted).length,
        quizAttempts: progressRecords.reduce((s, r) => s + (r.quizAttempts || 0), 0),
      },
    });
  } catch (error) {
    console.error('Analytics engagement error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

// ── GET /api/analytics/courses/:courseId/confusion ──────────────────────────
exports.getConfusion = async (req, res) => {
  try {
    await verifyCourseOwner(req.params.courseId, req.user.id);

    const memories = await AIStudentMemory.findAll({
      where: {
        courseId: req.params.courseId,
        memoryType: { [Op.in]: ['weakness', 'confusion'] },
      },
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'title'] }],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    // Aggregate key terms across all memories
    const termFrequency = {};
    const topicConfusion = {};

    for (const m of memories) {
      const topicId = m.topicId;
      if (topicId) {
        if (!topicConfusion[topicId]) {
          topicConfusion[topicId] = { topicId, title: m.topic?.title || 'Unknown', count: 0, terms: {} };
        }
        topicConfusion[topicId].count++;
      }
      for (const term of m.keyTerms || []) {
        termFrequency[term] = (termFrequency[term] || 0) + 1;
        if (topicId && topicConfusion[topicId]) {
          topicConfusion[topicId].terms[term] = (topicConfusion[topicId].terms[term] || 0) + 1;
        }
      }
    }

    const topTerms = Object.entries(termFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([term, count]) => ({ term, count }));

    const topicList = Object.values(topicConfusion)
      .sort((a, b) => b.count - a.count)
      .map((t) => ({
        ...t,
        topTerms: Object.entries(t.terms)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([term, count]) => ({ term, count })),
        terms: undefined,
      }));

    res.json({ success: true, confusion: { topTerms, byTopic: topicList, totalMemories: memories.length } });
  } catch (error) {
    console.error('Analytics confusion error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

// ── GET /api/analytics/courses/:courseId/students ───────────────────────────
exports.getStudents = async (req, res) => {
  try {
    await verifyCourseOwner(req.params.courseId, req.user.id);

    const enrollments = await Enrollment.findAll({
      where: { courseId: req.params.courseId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    });

    const userIds = enrollments.map((e) => e.userId);
    if (userIds.length === 0) return res.json({ success: true, students: [] });

    const [sessions, questions, memories, progress] = await Promise.all([
      AITutorSession.findAll({
        where: { courseId: req.params.courseId, userId: { [Op.in]: userIds } },
        attributes: ['userId', 'status'],
      }),
      AITutorMessage.findAll({
        where: { role: 'user' },
        include: [{
          model: AITutorSession, as: 'session',
          where: { courseId: req.params.courseId, userId: { [Op.in]: userIds } },
          attributes: ['userId'],
        }],
        attributes: [],
      }),
      AIStudentMemory.findAll({
        where: { courseId: req.params.courseId, userId: { [Op.in]: userIds } },
        attributes: ['userId', 'memoryType'],
      }),
      AIStudentProgress.findAll({
        where: { courseId: req.params.courseId, userId: { [Op.in]: userIds } },
        attributes: ['userId', 'lectureCompleted', 'quizAttempts', 'quizBestScore'],
      }),
    ]);

    const sessionsByUser = {};
    for (const s of sessions) {
      if (!sessionsByUser[s.userId]) sessionsByUser[s.userId] = { total: 0, completed: 0 };
      sessionsByUser[s.userId].total++;
      if (s.status === 'completed') sessionsByUser[s.userId].completed++;
    }

    const questionsByUser = {};
    for (const q of questions) {
      const uid = q.session?.userId;
      if (uid) questionsByUser[uid] = (questionsByUser[uid] || 0) + 1;
    }

    const memoriesByUser = {};
    for (const m of memories) {
      if (!memoriesByUser[m.userId]) memoriesByUser[m.userId] = { weakness: 0, confusion: 0, mastery: 0 };
      memoriesByUser[m.userId][m.memoryType] = (memoriesByUser[m.userId][m.memoryType] || 0) + 1;
    }

    const progressByUser = {};
    for (const p of progress) {
      if (!progressByUser[p.userId]) progressByUser[p.userId] = { completed: 0, quizAttempts: 0, bestScore: 0 };
      if (p.lectureCompleted) progressByUser[p.userId].completed++;
      progressByUser[p.userId].quizAttempts += p.quizAttempts || 0;
      progressByUser[p.userId].bestScore = Math.max(progressByUser[p.userId].bestScore, p.quizBestScore || 0);
    }

    const students = enrollments.map((e) => ({
      userId: e.userId,
      name: e.user?.name,
      email: e.user?.email,
      sessions: sessionsByUser[e.userId] || { total: 0, completed: 0 },
      questions: questionsByUser[e.userId] || 0,
      memories: memoriesByUser[e.userId] || {},
      progress: progressByUser[e.userId] || {},
    }));

    res.json({ success: true, students });
  } catch (error) {
    console.error('Analytics students error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

// ── GET /api/analytics/courses/:courseId/timeline ───────────────────────────
exports.getTimeline = async (req, res) => {
  try {
    await verifyCourseOwner(req.params.courseId, req.user.id);

    const sessions = await AITutorSession.findAll({
      where: { courseId: req.params.courseId },
      attributes: ['createdAt', 'status'],
      order: [['createdAt', 'ASC']],
    });

    // Group by day (YYYY-MM-DD)
    const byDay = {};
    for (const s of sessions) {
      const day = s.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { date: day, sessions: 0, completed: 0 };
      byDay[day].sessions++;
      if (s.status === 'completed') byDay[day].completed++;
    }

    res.json({ success: true, timeline: Object.values(byDay) });
  } catch (error) {
    console.error('Analytics timeline error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};
