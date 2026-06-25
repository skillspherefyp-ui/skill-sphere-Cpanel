/**
 * resetUrduLectures.js
 * Deletes all stored AI lecture data for Urdu-language courses so they are
 * regenerated fresh the next time a student opens a lesson.
 *
 * Run once from the backend folder:
 *   node scripts/resetUrduLectures.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const { Course, Topic, AILecture, AILectureSection, AIFlashcard, AIQuiz, AIQuizQuestion, AISlideOutline, AIVisualSuggestion, AIAudioAsset } = require('../models');

async function main() {
  await sequelize.authenticate();
  console.log('Connected to database.');

  // Find all Urdu courses
  const urduCourses = await Course.findAll({ where: { language: 'Urdu' } });
  if (urduCourses.length === 0) {
    console.log('No Urdu courses found. Nothing to reset.');
    process.exit(0);
  }

  console.log(`Found ${urduCourses.length} Urdu course(s):`);
  urduCourses.forEach(c => console.log(`  - [${c.id}] ${c.name}`));

  const courseIds = urduCourses.map(c => c.id);

  // Find all topics in those courses
  const topics = await Topic.findAll({ where: { courseId: courseIds } });
  const topicIds = topics.map(t => t.id);
  console.log(`\nFound ${topicIds.length} topic(s) across those courses.`);

  // Find all lectures for those topics
  const lectures = await AILecture.findAll({ where: { topicId: topicIds } });
  const lectureIds = lectures.map(l => l.id);
  console.log(`Found ${lectureIds.length} stored lecture(s) to delete.`);

  if (lectureIds.length === 0) {
    console.log('No lectures to delete. Exiting.');
    process.exit(0);
  }

  // Delete in dependency order
  const sectionCount = await AILectureSection.destroy({ where: { lectureId: lectureIds } });
  console.log(`Deleted ${sectionCount} lecture section(s).`);

  // Delete related assets if models exist
  try {
    const flashcardCount = await AIFlashcard.destroy({ where: { lectureId: lectureIds } });
    console.log(`Deleted ${flashcardCount} flashcard(s).`);
  } catch (_) {}

  try {
    const quizzes = await AIQuiz.findAll({ where: { lectureId: lectureIds } });
    const quizIds = quizzes.map(q => q.id);
    if (quizIds.length > 0) {
      await AIQuizQuestion.destroy({ where: { quizId: quizIds } });
      await AIQuiz.destroy({ where: { id: quizIds } });
      console.log(`Deleted ${quizzes.length} quiz/quizzes.`);
    }
  } catch (_) {}

  try {
    await AISlideOutline.destroy({ where: { lectureId: lectureIds } });
  } catch (_) {}

  try {
    await AIVisualSuggestion.destroy({ where: { lectureId: lectureIds } });
  } catch (_) {}

  try {
    await AIAudioAsset.destroy({ where: { lectureId: lectureIds } });
  } catch (_) {}

  // Finally delete the lecture records themselves
  const lectureCount = await AILecture.destroy({ where: { id: lectureIds } });
  console.log(`Deleted ${lectureCount} lecture record(s).`);

  console.log('\nDone! All Urdu lectures have been cleared.');
  console.log('They will be regenerated fresh the next time a student opens a lesson.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
