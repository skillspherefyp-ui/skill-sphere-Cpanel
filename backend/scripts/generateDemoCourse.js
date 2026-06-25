/**
 * One-off: create a fully AI-generated demo course (curriculum + topics + lectures)
 * so the AI Virtual Classroom can be experienced end-to-end.
 *
 * Run from the backend folder:  node scripts/generateDemoCourse.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { testConnection } = require('../config/database');
const { User, Category, Course, Topic } = require('../models');
const aiCourseGenerator = require('../services/aiCourseGeneratorService');
const aiTutorService = require('../services/aiTutorService');

// ── What to build ──────────────────────────────────────────────────────────
const COURSE = {
  title: 'Python Programming Fundamentals',
  description:
    'A beginner-friendly, hands-on introduction to programming with Python — variables, data types, control flow, functions, and core problem-solving, taught with live examples and code.',
  outcomes:
    'Write basic Python programs; use variables, conditionals, loops and functions; read and trace code; understand how data flows through a simple program.',
  language: 'English',
  level: 'Beginner',
};
const MAX_TOPICS = 4; // keep generation time/cost reasonable while covering the full experience

(async () => {
  console.log('⏳ Connecting to the database…');
  await testConnection();

  // 1) Instructor/admin user (lectures are owned by them)
  const instructor =
    (await User.findOne({ where: { role: 'admin' } })) ||
    (await User.findOne({ where: { role: 'instructor' } }));
  if (!instructor) throw new Error('No admin/instructor user found. Seed an admin first (scripts/seedSuperAdmin.js).');
  console.log(`👤 Instructor: ${instructor.email} (${instructor.role}), id=${instructor.id}`);

  // 2) Category
  let category = await Category.findOne();
  if (!category) {
    category = await Category.create({ name: 'Programming', description: 'Coding & software', icon: 'code-slash' });
    console.log(`🏷️  Created category "${category.name}" (id=${category.id})`);
  } else {
    console.log(`🏷️  Using category "${category.name}" (id=${category.id})`);
  }

  // 3) AI curriculum structure
  console.log(`🧠 Generating curriculum for "${COURSE.title}"…`);
  const structure = await aiCourseGenerator.generateCurriculumStructure(
    COURSE.title, COURSE.description, COURSE.outcomes, null, COURSE.language
  );
  const modules = structure.modules || [];
  let allTopics = [];
  for (const mod of modules) {
    for (const t of mod.topics || []) allTopics.push(t.title);
  }
  allTopics = allTopics.filter(Boolean).slice(0, MAX_TOPICS);
  if (!allTopics.length) throw new Error('AI did not return any topics.');
  console.log(`📚 Topics (${allTopics.length}): ${allTopics.join(' | ')}`);

  // 4) Create Course + Topics
  const estHours = Math.max(1, Math.ceil((allTopics.length * 20) / 60));
  const course = await Course.create({
    name: COURSE.title.trim(),
    description: COURSE.description.trim(),
    level: COURSE.level,
    language: COURSE.language,
    categoryId: Number(category.id),
    duration: `${estHours} hour${estHours > 1 ? 's' : ''}`,
    userId: instructor.id,
    creationMode: 'ai',
    status: 'draft',
  });
  for (let i = 0; i < allTopics.length; i += 1) {
    await Topic.create({
      title: allTopics[i],
      courseId: course.id,
      order: i,
      status: i === 0 ? 'unlocked' : 'locked',
    });
  }
  console.log(`✅ Course #${course.id} created with ${allTopics.length} topics. Generating lectures (this can take several minutes)…`);

  // 5) Synchronous full lecture generation (sections, visuals, flashcards, quiz)
  await aiTutorService.generateCoursePackage(course.id, instructor);

  // 6) Publish so students can find & enrol
  await course.update({ status: 'published' });

  console.log('────────────────────────────────────────────');
  console.log(`🎉 DONE. Course #${course.id} "${COURSE.title}" is generated & PUBLISHED.`);
  console.log('   → In the app: find it under Courses, enrol with the student account, open a topic → AI Learning.');
  console.log('────────────────────────────────────────────');
  process.exit(0);
})().catch((err) => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
