/**
 * Wipe existing courses + AI content, then generate 2 fresh, fully-AI courses
 * with thumbnails (intelligent visual-mode mix + auto screenshots).
 *
 *   node scripts/recreateCourses.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { sequelize, testConnection } = require('../config/database');
const { User, Category, Course, Topic } = require('../models');
const aiCourseGenerator = require('../services/aiCourseGeneratorService');
const aiTutorService = require('../services/aiTutorService');

const MAX_TOPICS = 4;

const COURSES = [
  {
    title: 'Python Programming for Beginners',
    description:
      'A hands-on introduction to programming with Python — install it, write your first programs, and master variables, data types, control flow and functions with live code and clear visuals.',
    outcomes:
      'Install Python; write and run Python programs; use variables, conditionals, loops and functions; read and trace code; think through simple problems step by step.',
    level: 'Beginner',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Computer Networking Fundamentals',
    description:
      'Understand how computers talk to each other — networks, nodes, protocols, IP addressing and the internet — explained with diagrams, real-world analogies and clear board notes.',
    outcomes:
      'Explain what a network is and its core components; understand nodes, links and protocols; grasp how data travels across the internet; compare LAN, WAN and common protocols.',
    level: 'Beginner',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  },
];

// Course/AI content tables to clear (users, categories, templates, blogs are kept).
const TABLES_TO_CLEAR = [
  'ai_lecture_sections', 'ai_lectures', 'ai_course_outlines', 'ai_quiz_questions', 'ai_quizzes',
  'ai_flashcards', 'ai_audio_assets', 'ai_tutor_messages', 'ai_tutor_sessions', 'ai_student_progress',
  'ai_slide_outlines', 'ai_visual_suggestions', 'ai_adaptive_plans', 'ai_chat_messages', 'ai_chat_sessions',
  'ai_student_memories', 'lecture_chat_messages', 'quiz_results', 'quizzes', 'materials',
  'enrollments', 'progress', 'certificates', 'discussion_posts', 'feedbacks', 'topics', 'courses',
];

async function wipeExistingCourses() {
  console.log('🧹 Removing existing courses + AI content…');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of TABLES_TO_CLEAR) {
    try { await sequelize.query(`DELETE FROM \`${t}\``); } catch (e) { console.warn(`  (skip ${t}: ${e.message})`); }
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('   ✅ Cleared.');
}

async function buildCourse(spec, instructor, category) {
  console.log(`\n🧠 Generating curriculum for "${spec.title}"…`);
  const structure = await aiCourseGenerator.generateCurriculumStructure(
    spec.title, spec.description, spec.outcomes, null, spec.language
  );
  let topics = [];
  for (const mod of structure.modules || []) for (const t of mod.topics || []) topics.push(t.title);
  topics = topics.filter(Boolean).slice(0, MAX_TOPICS);
  if (!topics.length) throw new Error('No topics generated');
  console.log(`📚 Topics (${topics.length}): ${topics.join(' | ')}`);

  const estHours = Math.max(1, Math.ceil((topics.length * 20) / 60));
  const course = await Course.create({
    name: spec.title.trim(),
    description: spec.description.trim(),
    level: spec.level,
    language: spec.language,
    categoryId: Number(category.id),
    duration: `${estHours} hour${estHours > 1 ? 's' : ''}`,
    userId: instructor.id,
    creationMode: 'ai',
    status: 'draft',
    thumbnailImage: spec.thumbnail,
  });
  for (let i = 0; i < topics.length; i += 1) {
    await Topic.create({ title: topics[i], courseId: course.id, order: i, status: i === 0 ? 'unlocked' : 'locked' });
  }
  console.log(`✅ Course #${course.id} created. Generating lectures (intelligent mix + screenshots)…`);
  await aiTutorService.generateCoursePackage(course.id, instructor);
  await course.update({ status: 'published' });
  console.log(`🎉 "${spec.title}" generated & PUBLISHED (course #${course.id}).`);
  return course;
}

(async () => {
  await testConnection();
  const instructor =
    (await User.findOne({ where: { role: 'admin' } })) ||
    (await User.findOne({ where: { role: 'instructor' } }));
  if (!instructor) throw new Error('No admin/instructor user found.');
  let category = await Category.findOne();
  if (!category) category = await Category.create({ name: 'Technology' });
  console.log(`👤 Instructor: ${instructor.email} | 🏷️  Category: ${category.name}`);

  await wipeExistingCourses();

  for (const spec of COURSES) {
    try { await buildCourse(spec, instructor, category); }
    catch (e) { console.error(`❌ Failed "${spec.title}": ${e.message}`); }
  }

  console.log('\n════════════════════════════════════════════');
  console.log('✅ DONE. 2 fresh courses created with thumbnails.');
  console.log('════════════════════════════════════════════');
  process.exit(0);
})().catch((e) => { console.error('❌', e); process.exit(1); });
