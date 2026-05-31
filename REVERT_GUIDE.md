# Revert Guide — AI Tutor Delay Fixes

If anything breaks, here is exactly what to undo for each fix.

---

## Fix 4 — Remove session reload
**File:** `backend/services/aiTutorService.js`
**In function:** `submitQuestion`
**What was removed:** The `session.reload()` block after saving the AI message.

Add this back just before the `return {` at the end of `submitQuestion`:

```javascript
    // Reload the session after persisting the pause state so callers receive
    // the latest chunk pointer and teaching state instead of the stale instance.
    await session.reload({
      include: [{
        model: AITutorMessage,
        as: 'messages',
        separate: true,
        limit: 20,
        order: [['createdAt', 'ASC']]
      }]
    });
```

---

## Fix 5 — Combine progress save
**File:** `backend/services/aiTutorService.js`
**In function:** `getNextLectureChunk`
**What was changed:** `findOrCreate` + `update` replaced with `upsert`.

Replace the `AIStudentProgress.upsert(...)` block with:

```javascript
  const [progress] = await AIStudentProgress.findOrCreate({
    where: {
      userId,
      courseId: session.courseId,
      topicId: session.topicId
    },
    defaults: { lectureId: session.lectureId }
  });

  await progress.update({
    lectureId: lecture.id,
    currentSectionIndex: pointer.sectionIndex,
    currentChunkIndex: pointer.chunkIndex,
    lastSessionId: session.id
  });
```

---

## Fix 3 — Cache course language
**Three files changed:**

### `backend/models/AITutorSession.js`
Remove the `courseLanguage` field that was added:
```javascript
  // Fix 3: cached so we don't hit Course table on every chunk/question
  courseLanguage: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'English'
  },
```

### `backend/services/aiTutorService.js` — `attachTeachingDecision`
Replace:
```javascript
  // Fix 3: read from session cache instead of hitting Course table every chunk
  const courseLanguage = session?.courseLanguage || 'English';
```
With:
```javascript
  const courseForLang = lecture.courseId
    ? await Course.findByPk(lecture.courseId, { attributes: ['language'] })
    : null;
  const courseLanguage = courseForLang?.language || 'English';
```

### `backend/services/aiTutorService.js` — `submitQuestion`
Replace:
```javascript
  // Fix 3: read from session cache instead of hitting Course table
  const courseLanguage = session.courseLanguage || 'English';
```
With:
```javascript
  const courseForLang = await Course.findByPk(lecture.courseId, { attributes: ['language'] });
  const courseLanguage = courseForLang?.language || 'English';
```

### `backend/services/aiTutorService.js` — `startTutorSession`
Remove the two lines:
```javascript
  // Fix 3: fetch course language once and cache it in the session
  const courseForLang = await Course.findByPk(lecture.courseId, { attributes: ['language'] });
  const sessionLanguage = courseForLang?.language || 'English';
```
And remove `courseLanguage: sessionLanguage,` from both the `AITutorSession.create()` and `session.update()` calls.

---

## Fix 2 — Lean lecture query
**File:** `backend/services/aiTutorService.js`

### Remove the added function
Delete `getLectureChunksOnly()` (the lean query added after `getLectureByTopicId`).

### Restore the 4 replaced calls
All 4 occurrences of:
```javascript
  const lecture = await getLectureChunksOnly(session.topicId);
```
Change back to:
```javascript
  const lecture = await getLectureByTopicId(session.topicId);
```
(In `getNextLectureChunk`, `getSessionState`, `restartTutorSession`, `submitQuestion`)

---

## Fix 1 — Stream answers
**Six files changed:**

### `backend/services/openaiService.js`
Remove the `answerLectureQuestionStream` generator function and its export.

### `backend/services/aiTutorService.js`
Remove the `submitQuestionStream` generator function and its export from `module.exports`.

### `backend/controllers/aiTutorController.js`
Replace the modified `submitQuestion` with the original:
```javascript
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
```

### `AppAndroidSS/src/services/apiClient.js`
Remove the `streamPost` function and its export.

### `AppAndroidSS/src/screens/student/AILearningScreen.js`
- Revert import: `import { aiTutorAPI, API_BASE } from '../../services/apiClient';`
- Replace the streaming `submitLectureQuestion` with the original:
```javascript
  const submitLectureQuestion = async (rawPrompt) => {
    const prompt = `${rawPrompt || ''}`.trim();
    if (!prompt || !session) return;
    if (handRaiseTimeoutRef.current) {
      clearTimeout(handRaiseTimeoutRef.current);
      handRaiseTimeoutRef.current = null;
    }
    setQuestion('');
    setSubmittingQuestion(true);
    setChatMessages((prev) => [...prev, { type: 'user', text: prompt }]);

    try {
      const response = await aiTutorAPI.askQuestion(session.id, prompt);
      if (!response.success || !response.aiMessage?.content) {
        throw new Error(response.error || 'I could not answer that question right now.');
      }
      setChatMessages((prev) => [...prev, { type: 'ai', text: response.aiMessage.content }]);
      setHandRaised(false);
      setTimeout(() => {
        resumeLectureSession().catch(() => {});
      }, 2200);
    } catch (error) {
      setChatMessages((prev) => [...prev, { type: 'ai', text: error.message || 'I could not answer that question right now.' }]);
    } finally {
      setSubmittingQuestion(false);
    }
  };
```

### `AppAndroidSS/src/components/VoiceQAOverlay.js`
- Revert import: `import { aiTutorAPI, lectureChatAPI, API_BASE } from '../services/apiClient';`
- Replace the modified `handleQuestion` with the original:
```javascript
  const handleQuestion = useCallback(async (question) => {
    setPhase('processing');
    try {
      let answer  = '';
      let rawRes  = null;

      if (sessionId) {
        rawRes = await aiTutorAPI.askQuestion(sessionId, question);
        answer = rawRes?.aiMessage?.content || rawRes?.answer || '';
      } else {
        rawRes = await lectureChatAPI.sendMessage(courseId, topicId, question);
        answer = rawRes?.aiMessage?.content || rawRes?.content || '';
      }

      if (!answer) answer = "I couldn't find a specific answer right now.";
      if (phaseRef.current === 'done') return;

      onQuestionAnswered?.(question, answer, rawRes);
      setAnswerText(answer);
      setPhase('speaking-answer');
      speak(answer, () => { if (phaseRef.current !== 'done') finishAndClose(); });
    } catch (_) {
      if (phaseRef.current === 'done') return;
      setPhase('speaking-closing');
      speak("Sorry, I couldn't get an answer right now. Let's continue.", () => finishAndClose());
    }
  }, [sessionId, courseId, topicId, speak, finishAndClose, onQuestionAnswered]);
```

---

## DB column revert (Fix 3)
If you need to drop the `courseLanguage` column from the database:
```sql
ALTER TABLE ai_tutor_sessions DROP COLUMN courseLanguage;
```
Run this only after reverting the model and service changes above.
