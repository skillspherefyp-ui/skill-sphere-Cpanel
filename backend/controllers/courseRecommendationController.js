const { Enrollment, Course, Category } = require('../models');
const OpenAI = require('openai');

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await Enrollment.findAll({ where: { userId }, attributes: ['courseId'] });
    const enrolledIds = enrollments.map(e => e.courseId);

    const allCourses = await Course.findAll({
      where: { status: 'published' },
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      attributes: ['id', 'name', 'description', 'level', 'categoryId'],
    });

    const enrolledCourses = allCourses.filter(c => enrolledIds.includes(c.id));
    const unenrolledCourses = allCourses.filter(c => !enrolledIds.includes(c.id));

    if (unenrolledCourses.length === 0) {
      return res.json({ success: true, recommendations: [], message: 'You are enrolled in all available courses!' });
    }

    if (enrolledCourses.length === 0) {
      const shuffled = [...unenrolledCourses].sort(() => Math.random() - 0.5).slice(0, 5);
      return res.json({ success: true, recommendations: shuffled, source: 'random' });
    }

    const enrolledNames = enrolledCourses.map(c => `${c.name} (${c.category?.name || 'General'})`).join(', ');
    const catalogLines = unenrolledCourses.map(c =>
      `[ID:${c.id}] ${c.name} | Level: ${c.level} | Category: ${c.category?.name || 'General'} | ${(c.description || '').slice(0, 80)}`
    ).join('\n');

    const prompt = `A student is enrolled in: ${enrolledNames}.\n\nAvailable courses they haven't taken:\n${catalogLines}\n\nRecommend the top 5 most relevant course IDs as a JSON array of numbers. Only return the JSON array, nothing else.`;

    let recommendedIds = [];
    try {
      if (!process.env.OPENAI_API_KEY) throw new Error('No API key');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_MODEL_QA || 'gpt-4o-mini';
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.3,
      });
      const text = completion.choices[0]?.message?.content?.trim() || '[]';
      recommendedIds = JSON.parse(text);
    } catch (aiErr) {
      console.error('AI recommendation fallback:', aiErr.message);
      recommendedIds = [...unenrolledCourses].sort(() => Math.random() - 0.5).slice(0, 5).map(c => c.id);
    }

    const recommendations = unenrolledCourses.filter(c => recommendedIds.includes(c.id)).slice(0, 5);
    res.json({ success: true, recommendations, source: 'ai' });
  } catch (err) {
    console.error('Get recommendations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
