const courseGeneratorService = require('../services/aiCourseGeneratorService');

// ── AI Course Generator (Instructor) ──────────────────────────────────────────

exports.startCourseGeneration = async (req, res) => {
  try {
    const { title, description, outcomes, pdfText, language, level, categoryId, duration } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Course title is required' });
    }
    if (!categoryId) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const result = await courseGeneratorService.createAndGenerateCourse({
      title: title.trim(),
      description: description?.trim(),
      outcomes: outcomes?.trim(),
      pdfText: pdfText?.trim(),
      language: language || 'English',
      level: level || 'Intermediate',
      categoryId,
      duration: duration?.trim(),
      instructorUser: req.user,
    });

    res.json({
      success: true,
      courseId: result.courseId,
      topicCount: result.topicCount,
      message: 'Course created. Lecture generation started in background.',
    });
  } catch (error) {
    console.error('[AIClassroom] Course generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create course' });
  }
};
